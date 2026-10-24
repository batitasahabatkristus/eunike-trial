import type { Metadata } from "next";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { fmtYmd } from "@/lib/dates";
import { loadMatrix, pctOf } from "@/lib/attendance-report";
import { Badge } from "@/components/ui/bits";

export const metadata: Metadata = { title: "Laporan hadir" };

/** AD-02: matrix with check, cross, dash; filters Semester, Kelas, Pertemuan; exports respect the filters. */
export default async function Hadir({ searchParams }: { searchParams: Promise<{ semester?: string; kelas?: string; tgl?: string }> }) {
  const session = await guard("/sk/admin/hadir");
  if (!session) return null;
  const sp = await searchParams;
  const m = await asUser(session.userId, (q) => loadMatrix(q, { semester: sp.semester, klass: sp.kelas, date: sp.tgl }));
  const p = pctOf(m.stats);
  const qs = new URLSearchParams({ semester: m.semesterId, kelas: m.klass, ...(sp.tgl ? { tgl: sp.tgl } : {}) }).toString();
  const allDates = (await asUser(session.userId, (q) => loadMatrix(q, { semester: m.semesterId, klass: m.klass }))).dates;
  const mark = (c: "in" | "out" | null) => (c === "in" ? <span style={{ color: "#1b8a4b", fontSize: 18 }} role="img" aria-label="Hadir">✔</span> : c === "out" ? <span style={{ color: "#dd1f4a", fontSize: 18 }} role="img" aria-label="Tidak hadir">✖</span> : <span className="muted" role="img" aria-label="Belum tercatat">–</span>);
  return (
    <div className="col g14">
      <div className="row between wrap"><h1 className="h1" style={{ fontSize: 32 }}>Laporan hadir</h1>
        <div className="row wrap"><Badge kind="ok">Masuk {p.in}%</Badge><Badge kind="need">Tidak masuk {p.out}%</Badge><Badge kind="batal">Belum tercatat {p.none}%</Badge></div></div>
      <form className="card row wrap" method="get" aria-label="Filter laporan">
        <div className="field" style={{ minWidth: 170 }}><label htmlFor="f-sem">Semester</label><select id="f-sem" name="semester" className="sel" defaultValue={m.semesterId}>{m.semesters.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
        <div className="field" style={{ minWidth: 150 }}><label htmlFor="f-kls">Kelas</label><select id="f-kls" name="kelas" className="sel" defaultValue={m.klass}>{["Semua", ...m.classes].map((c) => <option key={c}>{c}</option>)}</select></div>
        <div className="field" style={{ minWidth: 150 }}><label htmlFor="f-tgl">Pertemuan</label><select id="f-tgl" name="tgl" className="sel" defaultValue={sp.tgl ?? ""}><option value="">Semua</option>{allDates.map((d) => <option key={d} value={d}>{fmtYmd(d, { day: "numeric", month: "short" })}</option>)}</select></div>
        <button className="btn ghost sm">Terapkan</button><span className="grow" />
        <a className="btn green sm" href={`/sk/admin/hadir/export?format=xlsx&${qs}`}>Ekspor Excel</a><a className="btn red sm" href={`/sk/admin/hadir/export?format=pdf&${qs}`}>Ekspor PDF</a>
      </form>
      <div className="tblwrap"><table className="tbl">
        <thead><tr><th scope="col">No</th><th scope="col">Nama keluarga</th><th scope="col">Kelas</th>{m.dates.map((d) => <th key={d} scope="col">{fmtYmd(d, { day: "numeric", month: "short" })}</th>)}<th scope="col">Total hadir</th></tr></thead>
        <tbody>{m.rows.length === 0 ? <tr><td colSpan={4 + m.dates.length} className="center muted">Belum ada data untuk filter ini.</td></tr> : m.rows.map((r, i) => <tr key={`${r.klass}-${r.family}`}><td>{i + 1}</td><td><b className="purple">Keluarga {r.family}</b></td><td>{r.klass}</td>{r.cells.map((c, k) => <td key={k}>{mark(c)}</td>)}<td><b>{r.total} / {m.dates.length}</b></td></tr>)}</tbody></table></div>
      <div className="small muted">Menampilkan {m.rows.length} keluarga · ✔ Masuk · ✖ Tidak masuk · – Belum tercatat</div>
    </div>
  );
}
