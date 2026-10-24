/**
 * Pilot import (PRD §13): SK Batita spreadsheets exported as CSV -> app tables.
 *
 *   DATABASE_URL=... pnpm import:pilot <dir> [--dry-run]
 *
 * Idempotent: every imported row carries a pilot_ref and inserts use "on conflict do nothing", so a second run creates
 * nothing. App data always wins: attendance already marked in the app is never overwritten. Duplicates, unknown classes
 * and unreadable rows are reported, never silently dropped. See scripts/import-pilot/MAPPING.md for the assumed columns.
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { Pool, type PoolClient } from "pg";
import { normalizePhone } from "../lib/phone";

type Row = Record<string, string>;

export function parseCsv(text: string): Row[] {
  const recs: string[][] = [];
  let cur: string[] = [], f = "", q = false;
  const t = text.replace(/^﻿/, "");
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ",") { cur.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; cur.push(f); f = ""; if (cur.some((x) => x.trim())) recs.push(cur); cur = []; }
    else f += c;
  }
  if (f || cur.length) { cur.push(f); if (cur.some((x) => x.trim())) recs.push(cur); }
  const [head, ...body] = recs;
  if (!head) return [];
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

export function ymd(s: string): string {
  const t = s.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  const m = t.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}` : "";
}

class Report {
  created: Record<string, number> = {};
  existing: Record<string, number> = {};
  problems: string[] = [];
  made(k: string, n: number) { this.created[k] = (this.created[k] ?? 0) + n; this.existing[k] = this.existing[k] ?? 0; }
  had(k: string) { this.existing[k] = (this.existing[k] ?? 0) + 1; this.created[k] = this.created[k] ?? 0; }
  warn(m: string) { this.problems.push(m); }
}

const read = (dir: string, name: string): Row[] => { const p = join(dir, name); return existsSync(p) ? parseCsv(readFileSync(p, "utf8")) : []; };

export async function run(c: PoolClient, dir: string): Promise<Report> {
  const r = new Report();
  const one = async <T>(sql: string, p: unknown[] = []) => (await c.query(sql, p)).rows[0] as T | undefined;
  const sem = await one<{ id: string }>("select id from public.semesters where active");
  if (!sem) throw new Error("Tidak ada semester aktif. Buat semester dulu.");
  const classes = new Map((await c.query("select id, lower(name) n from public.sk_classes where semester_id = $1", [sem.id])).rows.map((x) => [x.n as string, x.id as string]));
  const lessons = new Map((await c.query("select number, id from public.lessons")).rows.map((x) => [Number(x.number), x.id as string]));

  const famId = new Map<string, string>();
  const childId = new Map<string, string>();
  const famClass = new Map<string, string>();

  // Keluarga -----------------------------------------------------------------
  const seenWa = new Map<string, string>();
  for (const k of read(dir, "Keluarga.csv")) {
    const code = k.KodeKeluarga, wa = k.WhatsApp ? normalizePhone(k.WhatsApp) : "";
    if (!code || !k.NamaKeluarga) { r.warn(`Keluarga: baris tanpa kode/nama dilewati (${code || "?"})`); continue; }
    if (wa.length < 9) { r.warn(`Keluarga ${code}: nomor WhatsApp tidak valid, dilewati`); continue; }
    if (seenWa.has(wa) && seenWa.get(wa) !== code) { r.warn(`Keluarga ${code}: nomor WhatsApp sama dengan ${seenWa.get(wa)}, dilewati (duplikat, cek manual)`); continue; }
    seenWa.set(wa, code);
    if (k.Kelas && !classes.has(k.Kelas.toLowerCase())) r.warn(`Keluarga ${code}: kelas "${k.Kelas}" tidak ada; keluarga diimpor tanpa kelas`);
    let f = await one<{ id: string }>("select id from public.families where pilot_ref = $1", [code]);
    if (f) r.had("keluarga");
    else {
      const clash = await one<{ pilot_ref: string | null }>("select pilot_ref from public.families where wa_number = $1 and deleted_at is null", [wa]);
      if (clash) { r.warn(`Keluarga ${code}: nomor WhatsApp sudah dipakai keluarga lain di aplikasi (${clash.pilot_ref ?? "dibuat di aplikasi"}); dilewati`); continue; }
      f = (await one<{ id: string }>(
        "insert into public.families(name, wa_number, kbk_number, data_status, pilot_ref) values ($1,$2,$3,'cek',$4) returning id",
        [k.NamaKeluarga, wa, k.KBK || null, code]))!;
      r.made("keluarga", 1);
      for (const [rel, nm] of [["papa", k.Papa], ["mama", k.Mama]] as const) {
        if (nm) await c.query("insert into public.family_members(family_id, relation, display_name) values ($1,$2,$3)", [f.id, rel, nm]);
      }
    }
    famId.set(code, f.id);
    if (k.Kelas && classes.has(k.Kelas.toLowerCase())) famClass.set(code, classes.get(k.Kelas.toLowerCase())!);
  }

  // Anak ---------------------------------------------------------------------
  for (const a of read(dir, "Anak.csv")) {
    const fid = famId.get(a.KodeKeluarga), dob = ymd(a.TanggalLahir);
    if (!fid) { r.warn(`Anak "${a.NamaAnak}": keluarga ${a.KodeKeluarga} tidak ditemukan`); continue; }
    if (!a.NamaAnak || !dob) { r.warn(`Anak ${a.KodeKeluarga}: nama/tanggal lahir tidak terbaca ("${a.TanggalLahir}")`); continue; }
    const ref = `${a.KodeKeluarga}/${a.NamaAnak.toLowerCase()}`;
    let ch = await one<{ id: string }>("select id from public.children where pilot_ref = $1", [ref]);
    if (ch) r.had("anak");
    else {
      ch = (await one<{ id: string }>("insert into public.children(family_id, name, dob, pilot_ref) values ($1,$2,$3,$4) returning id", [fid, a.NamaAnak, dob, ref]))!;
      r.made("anak", 1);
    }
    childId.set(ref, ch.id);
    const cls = famClass.get(a.KodeKeluarga);
    if (cls) {
      const ins = await c.query("insert into public.sk_class_members(class_id, family_id, child_id) values ($1,$2,$3) on conflict (class_id, child_id) do nothing", [cls, fid, ch.id]);
      ins.rowCount ? r.made("anggota kelas", 1) : r.had("anggota kelas");
    }
  }

  // Sesi + Absensi -------------------------------------------------------------
  const meeting = new Map<string, string>();
  const ensureMeeting = async (klass: string, date: string, lessonNo?: number) => {
    const key = `${klass.toLowerCase()}|${date}`;
    if (meeting.has(key)) return meeting.get(key)!;
    const cid = classes.get(klass.toLowerCase());
    if (!cid) return undefined;
    const lid = lessonNo ? lessons.get(lessonNo) ?? null : null;
    if (lessonNo && !lid) r.warn(`Sesi ${klass} ${date}: pelajaran ${lessonNo} belum ada`);
    const ins = await one<{ id: string }>("insert into public.sk_meetings(class_id, lesson_id, held_on, pilot_ref) values ($1,$2,$3,$4) on conflict (class_id, held_on) do nothing returning id", [cid, lid, date, key]);
    let id = ins?.id;
    if (ins) r.made("sesi", 1);
    else { id = (await one<{ id: string }>("select id from public.sk_meetings where class_id = $1 and held_on = $2", [cid, date]))!.id; r.had("sesi"); }
    meeting.set(key, id!);
    return id;
  };
  for (const s of read(dir, "Sesi.csv")) {
    const d = ymd(s.Tanggal);
    if (!d || !classes.has(s.Kelas.toLowerCase())) { r.warn(`Sesi "${s.Kelas}" "${s.Tanggal}": kelas/tanggal tidak dikenal`); continue; }
    await ensureMeeting(s.Kelas, d, Number(s.NomorPelajaran) || undefined);
  }

  // Two sheets, later one wins when they disagree; the app's own marks (marked_by not null) always win.
  const statusOf = (v: string): "in" | "out" | null => /^(hadir|in|h|1|ya)$/i.test(v) ? "in" : /^(tidak|out|a|t|0|absen|alpa)$/i.test(v) ? "out" : null;
  const merged = new Map<string, { klass: string; date: string; code: string; st: "in" | "out"; src: string }>();
  for (const file of ["Absensi.csv", "AbsensiJul-Des26.csv"]) {
    for (const a of read(dir, file)) {
      const st = statusOf(a.Status), d = ymd(a.Tanggal);
      if (!st || !d) { r.warn(`${file}: status/tanggal tidak terbaca (${a.KodeKeluarga} ${a.Tanggal} "${a.Status}")`); continue; }
      const key = `${a.Kelas.toLowerCase()}|${d}|${a.KodeKeluarga}`;
      const prev = merged.get(key);
      if (prev && prev.st !== st) r.warn(`Absensi ${a.KodeKeluarga} ${d}: ${prev.src} (${prev.st}) berbeda dengan ${file} (${st}); dipakai ${file}`);
      merged.set(key, { klass: a.Kelas, date: d, code: a.KodeKeluarga, st, src: file });
    }
  }
  for (const m of merged.values()) {
    const fid = famId.get(m.code), mid = await ensureMeeting(m.klass, m.date);
    if (!fid || !mid) { r.warn(`Absensi ${m.code} ${m.date}: keluarga atau kelas tidak ditemukan`); continue; }
    const ex = await one<{ status: string | null; marked_by: string | null }>("select status, marked_by from public.sk_attendance where meeting_id = $1 and kind = 'family' and family_id = $2", [mid, fid]);
    if (ex?.marked_by) { r.had("absensi"); r.warn(`Absensi ${m.code} ${m.date}: sudah diisi di aplikasi, tidak ditimpa`); continue; }
    if (ex) {
      if (ex.status === m.st) { r.had("absensi"); continue; }
      await c.query("update public.sk_attendance set status = $3 where meeting_id = $1 and family_id = $2 and kind = 'family' and marked_by is null", [mid, fid, m.st]);
      r.made("absensi", 1);
    } else {
      await c.query("insert into public.sk_attendance(meeting_id, kind, family_id, status, marked_at) values ($1,'family',$2,$3, now())", [mid, fid, m.st]);
      r.made("absensi", 1);
    }
  }

  // Memory Marker --------------------------------------------------------------
  for (const mm of read(dir, "MemoryMarker.csv")) {
    const fid = famId.get(mm.KodeKeluarga), cid = childId.get(`${mm.KodeKeluarga}/${mm.NamaAnak.toLowerCase()}`), lid = lessons.get(Number(mm.NomorPelajaran));
    if (!fid || !cid || !lid) { r.warn(`Memory Marker ${mm.KodeKeluarga}/${mm.NamaAnak}/${mm.NomorPelajaran}: keluarga, anak atau pelajaran tidak ditemukan`); continue; }
    const love = mm.Kasih.split(/[;|]/).map((x) => x.trim()).filter((x) => ["Melayani", "Memberi", "Mengampuni"].includes(x));
    const yes = (v: string) => /^(ya|y|1|true)$/i.test(v);
    const ins = await c.query(
      "insert into public.memory_markers(family_id, child_id, lesson_id, q1, q2, q3, q4, love_in_action, faith_talk, couch_time, is_new) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,false) on conflict (family_id, lesson_id) do nothing",
      [fid, cid, lid, mm.Q1, mm.Q2, mm.Q3, mm.Q4, love, yes(mm.BicaraIman), yes(mm.WaktuSofa)]);
    ins.rowCount ? r.made("memory marker", 1) : r.had("memory marker");
  }

  // EPK (published reports only keep their status; drafts stay drafts) ---------------
  for (const e of read(dir, "EPK.csv")) {
    const fid = famId.get(e.KodeKeluarga), cid = childId.get(`${e.KodeKeluarga}/${e.NamaAnak.toLowerCase()}`);
    if (!fid || !cid) { r.warn(`EPK ${e.KodeKeluarga}/${e.NamaAnak}: keluarga atau anak tidak ditemukan`); continue; }
    const published = /^published$/i.test(e.Status);
    const ins = await c.query(
      `insert into public.epk_reports(family_id, child_id, semester_id, teacher_5g, status, teacher_sent_at, published_at)
       values ($1,$2,$3,$4::jsonb,$5,$6,$7) on conflict (child_id, semester_id) do nothing`,
      [fid, cid, sem.id, JSON.stringify({ note: e.CatatanGuru }), published ? "published" : "draft", published ? new Date() : null, published ? new Date() : null]);
    ins.rowCount ? r.made("EPK", 1) : r.had("EPK");
  }
  return r;
}

async function main() {
  const dir = process.argv[2];
  const dry = process.argv.includes("--dry-run");
  if (!dir || !existsSync(dir) || !readdirSync(dir).some((f) => f.endsWith(".csv"))) { console.error("Pemakaian: pnpm import:pilot <folder-csv> [--dry-run]"); process.exit(2); }
  if (!process.env.DATABASE_URL) { console.error("DATABASE_URL belum diatur."); process.exit(2); }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  const c = await pool.connect();
  try {
    await c.query("begin");
    const r = await run(c, dir);
    await c.query(dry ? "rollback" : "commit");
    console.log(dry ? "DRY RUN (dibatalkan)" : "SELESAI");
    for (const k of Object.keys(r.created)) console.log(`  ${k.padEnd(14)} baru ${String(r.created[k]).padStart(3)}  sudah ada ${String(r.existing[k] ?? 0).padStart(3)}`);
    if (r.problems.length) { console.log(`\nPerlu dicek (${r.problems.length}):`); r.problems.forEach((p) => console.log("  - " + p)); }
  } catch (e) {
    await c.query("rollback").catch(() => undefined);
    console.error("GAGAL, semua perubahan dibatalkan:", e instanceof Error ? e.message : e);
    process.exitCode = 1;
  } finally { c.release(); await pool.end(); }
}
if (process.argv[1]?.endsWith("import-pilot.ts")) void main();
