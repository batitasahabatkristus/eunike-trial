import ExcelJS from "exceljs";
import type { Q } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";

/** AD-04 bulk import and the pilot import script share this: parse, classify (duplicates!), apply. */
export interface ImportRow { line: number; family: string; papa: string; mama: string; child: string; dob: string; wa: string; klass: string }
export type RowStatus = "baru" | "duplikat" | "ganda_di_berkas" | "kelas_tidak_ada" | "tidak_valid";
export interface Classified extends ImportRow { status: RowStatus; note?: string }

const HEAD: Record<string, keyof ImportRow> = { keluarga: "family", "nama keluarga": "family", papa: "papa", ayah: "papa", mama: "mama", ibu: "mama", anak: "child", "nama anak": "child", "tanggal lahir": "dob", "tgl lahir": "dob", whatsapp: "wa", wa: "wa", "nomor whatsapp": "wa", kelas: "klass" };
export const MAX_ROWS = 1000;

const cell = (v: ExcelJS.CellValue): string => {
  if (v == null) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "object") return "richText" in v ? v.richText.map((t) => t.text).join("") : "result" in v ? String(v.result ?? "") : "text" in v ? String(v.text) : "";
  return String(v).trim();
};
export function toYmd(s: string): string {
  const t = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : "";
}

export async function parseWorkbook(buf: ArrayBuffer | Buffer): Promise<{ rows: ImportRow[]; errors: string[] }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buf as ArrayBuffer);
  const ws = wb.worksheets[0];
  if (!ws) return { rows: [], errors: ["Berkas tidak berisi lembar kerja."] };
  const cols = new Map<number, keyof ImportRow>();
  ws.getRow(1).eachCell((c, n) => { const k = HEAD[cell(c.value).toLowerCase()]; if (k) cols.set(n, k); });
  const need: (keyof ImportRow)[] = ["family", "child", "dob", "wa"];
  const have = new Set(cols.values());
  const missing = need.filter((k) => !have.has(k));
  if (missing.length) return { rows: [], errors: [`Kolom wajib tidak ditemukan: ${missing.map((k) => ({ family: "Keluarga", child: "Anak", dob: "Tanggal lahir", wa: "WhatsApp" })[k as "family"]).join(", ")}.`] };
  const rows: ImportRow[] = [];
  ws.eachRow((r, i) => {
    if (i === 1 || rows.length >= MAX_ROWS) return;
    const o: ImportRow = { line: i, family: "", papa: "", mama: "", child: "", dob: "", wa: "", klass: "" };
    cols.forEach((k, n) => { const v = cell(r.getCell(n).value); if (k === "line") return; (o[k] as string) = v; });
    o.dob = toYmd(o.dob); o.wa = o.wa ? normalizePhone(o.wa) : "";
    if (Object.values(o).some((x) => x !== "" && x !== i)) rows.push(o);
  });
  return { rows, errors: ws.rowCount - 1 > MAX_ROWS ? [`Hanya ${MAX_ROWS} baris pertama yang dibaca.`] : [] };
}

export async function classify(q: Q, rows: ImportRow[]): Promise<Classified[]> {
  const classes = new Set((await q<{ name: string }>("select c.name from public.sk_classes c join public.semesters s on s.id = c.semester_id and s.active")).map((c) => c.name.toLowerCase()));
  const existingWa = new Set((await q<{ wa_number: string }>("select wa_number from public.families where deleted_at is null and wa_number is not null")).map((r) => r.wa_number));
  const existingKey = new Set((await q<{ k: string }>("select lower(f.name) || '|' || lower(c.name) || '|' || c.dob::text k from public.families f join public.children c on c.family_id = f.id where f.deleted_at is null")).map((r) => r.k));
  const seenWa = new Set<string>(), seenKey = new Set<string>();
  return rows.map((r) => {
    const key = `${r.family.toLowerCase()}|${r.child.toLowerCase()}|${r.dob}`;
    let status: RowStatus = "baru", note: string | undefined;
    if (!r.family || !r.child || !/^\d{4}-\d{2}-\d{2}$/.test(r.dob) || r.wa.length < 9) { status = "tidak_valid"; note = !/^\d{4}-\d{2}-\d{2}$/.test(r.dob) ? "Tanggal lahir tidak terbaca" : r.wa.length < 9 ? "Nomor WhatsApp tidak valid" : "Nama keluarga atau anak kosong"; }
    else if (r.klass && !classes.has(r.klass.toLowerCase())) { status = "kelas_tidak_ada"; note = `Kelas "${r.klass}" tidak ada`; }
    else if (existingWa.has(r.wa) || existingKey.has(key)) { status = "duplikat"; note = existingWa.has(r.wa) ? "Nomor WhatsApp sudah terdaftar" : "Keluarga dan anak yang sama sudah ada"; }
    else if (seenWa.has(r.wa) || seenKey.has(key)) { status = "ganda_di_berkas"; note = "Muncul dua kali di berkas"; }
    if (status === "baru") { seenWa.add(r.wa); seenKey.add(key); }
    return { ...r, status, note };
  });
}

/** Inserts only rows classified as "baru". Running it twice inserts nothing the second time. */
export async function applyRows(q: Q, rows: Classified[]): Promise<{ created: number; skipped: number }> {
  let created = 0;
  for (const r of rows) {
    if (r.status !== "baru") continue;
    const code = r.klass ? `${r.klass.toUpperCase()}-${String((await q.one<{ n: number }>("select coalesce(max((substring(member_code from '[0-9]+$'))::int), 0) + 1 as n from public.families where member_code like $1", [`${r.klass.toUpperCase()}-%`]))!.n).padStart(4, "0")}` : null;
    const f = await q.one<{ id: string }>("insert into public.families(name, wa_number, member_code, data_status) values ($1, $2, $3, 'cek') returning id", [r.family, r.wa, code]);
    if (r.papa) await q("insert into public.family_members(family_id, relation, display_name) values ($1, 'papa', $2)", [f!.id, r.papa]);
    if (r.mama) await q("insert into public.family_members(family_id, relation, display_name) values ($1, 'mama', $2)", [f!.id, r.mama]);
    const c = await q.one<{ id: string }>("insert into public.children(family_id, name, dob) values ($1, $2, $3) returning id", [f!.id, r.child, r.dob]);
    if (r.klass) await q("insert into public.sk_class_members(class_id, family_id, child_id) select c.id, $1, $2 from public.sk_classes c join public.semesters s on s.id = c.semester_id and s.active where lower(c.name) = lower($3)", [f!.id, c!.id, r.klass]);
    created++;
  }
  return { created, skipped: rows.length - created };
}
