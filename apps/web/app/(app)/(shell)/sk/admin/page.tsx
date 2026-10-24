import type { Metadata } from "next";
import Link from "next/link";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { describeAudit, type AuditRow } from "@/lib/audit-text";
import { todayJakarta } from "@/lib/dates";
import { idTime } from "@/components/ui/bits";

export const metadata: Metadata = { title: "Dasbor Admin SK" };

/** AD-01 */
export default async function Dasbor() {
  const session = await guard("/sk/admin");
  if (!session) return null;
  const today = todayJakarta();
  const d = await asUser(session.userId, async (q) => {
    const n = async (sql: string, p: unknown[] = []) => Number((await q.one<{ n: string }>(sql, p))?.n ?? 0);
    const [families, corrections, review, epkReady, openClasses] = await Promise.all([
      n("select count(*) n from public.families where deleted_at is null"),
      n("select count(distinct family_id) n from public.data_corrections where status = 'open'"),
      n("select count(*) n from public.lessons where status = 'review'"),
      n("select count(*) n from public.epk_reports where status = 'ready'"),
      // a class "has not filled attendance" when its latest meeting up to today has no marked rows
      n(`select count(*) n from public.sk_classes c join public.semesters s on s.id = c.semester_id and s.active
          where (select count(*) from public.sk_attendance a join public.sk_meetings mt on mt.id = a.meeting_id
                  where mt.class_id = c.id and mt.held_on = (select max(held_on) from public.sk_meetings where class_id = c.id and held_on <= $1::date) and a.status is not null) = 0`, [today]),
    ]);
    const per = await q<{ name: string; pct: number | null }>(
      `select c.name, round(100.0 * count(*) filter (where a.status = 'in') / nullif(count(*) filter (where a.status is not null), 0))::int pct
         from public.sk_classes c join public.semesters s on s.id = c.semester_id and s.active
         left join public.sk_meetings mt on mt.class_id = c.id left join public.sk_attendance a on a.meeting_id = mt.id and a.kind = 'family' group by c.name order by c.name`);
    const week = await q.one<{ pct: number | null }>(
      `select round(100.0 * count(*) filter (where a.status = 'in') / nullif(count(*) filter (where a.status is not null), 0))::int pct
         from public.sk_attendance a join public.sk_meetings mt on mt.id = a.meeting_id and a.kind = 'family'
        where mt.held_on = (select max(held_on) from public.sk_meetings m2 join public.sk_attendance a2 on a2.meeting_id = m2.id where a2.status is not null and m2.held_on <= $1::date)`, [today]);
    const activity = await q<AuditRow & { at: string; who: string | null }>(
      `select l.at::text, l.action, l.row_table, l.before, l.after, p.full_name who from public.audit_log l left join public.profiles p on p.id = l.actor order by l.at desc limit 8`);
    return { families, corrections, review, epkReady, openClasses, per, week: week?.pct ?? null, activity };
  });
  const todo = [
    d.openClasses ? ["📄", `${d.openClasses} kelas belum mengisi absensi`, "Absensi pertemuan terakhir belum lengkap.", "Periksa", "/sk/admin/hadir"] : null,
    d.corrections ? ["✏️", `${d.corrections} koreksi data keluarga menunggu`, "Perlu diperiksa dan diselesaikan.", "Tinjau", "/sk/admin/keluarga"] : null,
    d.epkReady ? ["📄", `${d.epkReady} laporan EPK menunggu`, "Refleksi orang tua dan guru sudah lengkap.", "Periksa", "/sk/admin/epk"] : null,
    d.review ? ["📖", `${d.review} materi menunggu ditinjau`, "Dikirim oleh Kurikulum.", "Tinjau", "/sk/admin/materi"] : null,
  ].filter(Boolean) as string[][];
  const kpi: [string, string, string, string][] = [["👨‍👩‍👧", "Keluarga aktif", String(d.families), "var(--lilac)"], ["✓", "Hadir pertemuan terakhir", d.week === null ? "–" : `${d.week}%`, "var(--mint)"], ["📄", "Absensi belum diisi", `${d.openClasses} kelas`, "var(--peach)"], ["➕", "Pendaftar SK menunggu", "–", "var(--blush)"]];
  return (
    <div className="col g14">
      <h1 className="h1" style={{ fontSize: 32 }}>Dasbor</h1>
      <div className="grid4">{kpi.map(([i, l, v, bg]) => <div key={l} className="kpi"><div className="ic-c" style={{ background: bg }} aria-hidden="true">{i}</div><div><div className="lb">{l}</div><div className="stat">{v}</div></div></div>)}</div>
      <div className="small muted">Pendaftar SK muncul di sini setelah modul pendaftaran selesai (Fase 2).</div>
      <div className="g21">
        <section className="card" aria-labelledby="bk"><h2 className="h2" id="bk">Kehadiran per kelas</h2>
          <div className="bars" role="img" aria-label={`Kehadiran per kelas: ${d.per.map((p) => `${p.name} ${p.pct ?? 0}%`).join(", ")}`}>{d.per.map((p) => <div key={p.name} className="b"><span>{p.pct ?? 0}%</span><i style={{ height: `${(p.pct ?? 0) * 1.4}px` }} /></div>)}</div>
          <div className="barlbl">{d.per.map((p) => <span key={p.name}>{p.name}</span>)}</div></section>
        <section className="card" aria-labelledby="pt"><h2 className="h2" id="pt">Perlu tindakan</h2>
          <div className="col mt8">{todo.length === 0 ? <div className="ghostbox">Semua beres. 🎉</div> : todo.map(([i, t, s, b, href]) => (
            <div key={t} className="card row" style={{ padding: 10 }}><div className="ic-c" aria-hidden="true">{i}</div><div className="grow"><b className="purple">{t}</b><div className="small muted">{s}</div></div><Link className="btn purple sm" href={href}>{b}</Link></div>))}</div></section>
      </div>
      <section className="card" aria-labelledby="ak"><h2 className="h2 mb8" id="ak">Aktivitas terbaru</h2>
        <div className="tblwrap"><table className="tbl"><thead><tr><th scope="col">Waktu</th><th scope="col">Aktor</th><th scope="col">Aktivitas</th></tr></thead>
          <tbody>{d.activity.length === 0 ? <tr><td colSpan={3} className="center muted">Belum ada aktivitas.</td></tr> : d.activity.map((a, i) => <tr key={i}><td>{idTime(a.at)}</td><td>{a.who ?? "Sistem"}</td><td>{describeAudit(a)}</td></tr>)}</tbody></table></div></section>
    </div>
  );
}
