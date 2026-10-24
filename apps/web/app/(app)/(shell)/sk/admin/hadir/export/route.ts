import ExcelJS from "exceljs";
import { getSession } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { fmtYmd } from "@/lib/dates";
import { loadMatrix } from "@/lib/attendance-report";
import { tableReport } from "@/lib/pdf";

const MARK = { in: "Hadir", out: "Tidak", none: "-" } as const;

/** AD-02 export. Same role check as the page, same filters as the screen. */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session || !session.roles.some((r) => r === "sk_admin" || r === "super_admin")) return new Response("Forbidden", { status: 403 });
  const sp = new URL(req.url).searchParams;
  const m = await asUser(session.userId, (q) => loadMatrix(q, { semester: sp.get("semester") ?? undefined, klass: sp.get("kelas") ?? undefined, date: sp.get("tgl") ?? undefined }));
  const head = ["No", "Keluarga", "Kelas", ...m.dates.map((d) => fmtYmd(d, { day: "numeric", month: "short" })), "Total hadir"];
  const body = m.rows.map((r, i) => [String(i + 1), `Keluarga ${r.family}`, r.klass, ...r.cells.map((c) => MARK[c ?? "none"]), `${r.total} / ${m.dates.length}`]);
  const stamp = `${m.semester}${m.klass !== "Semua" ? ` - Kelas ${m.klass}` : ""}`.replace(/[^\w -]+/g, "");
  if (sp.get("format") === "pdf") {
    const pdf = await tableReport("Laporan hadir", `Semester ${m.semester} · Kelas ${m.klass} · ${m.rows.length} keluarga`, head, body, [0.5, 3, 1.2, ...m.dates.map(() => 1), 1.3]);
    return new Response(Buffer.from(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="laporan-hadir ${stamp}.pdf"`, "Cache-Control": "private, no-store" } });
  }
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Kehadiran");
  ws.addRow(head).font = { bold: true };
  body.forEach((r) => ws.addRow(r));
  ws.columns.forEach((c, i) => { c.width = i === 1 ? 26 : 12; });
  const buf = await wb.xlsx.writeBuffer();
  return new Response(Buffer.from(buf), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="laporan-hadir ${stamp}.xlsx"`, "Cache-Control": "private, no-store" } });
}
