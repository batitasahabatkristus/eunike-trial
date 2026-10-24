import type { Metadata } from "next";
import Link from "next/link";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { Empty } from "@/components/ui/bits";
import { CapacityForm, MoveChild } from "@/components/app/MoveChild";

export const metadata: Metadata = { title: "Grup" };

/** AD: classes with headcounts, and moving a child between them. The database enforces capacity. */
export default async function Grup({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  const session = await guard("/sk/admin/grup");
  if (!session) return null;
  const sel = (await searchParams).k;
  const d = await asUser(session.userId, async (q) => {
    const classes = await q<{ id: string; name: string; weekday: string; start: string; capacity: number; n: string }>(
      `select c.id, c.name, c.weekday, to_char(c.start_time, 'HH24.MI') "start", c.capacity, (select count(distinct family_id) from public.sk_class_members m where m.class_id = c.id) n
         from public.sk_classes c join public.semesters s on s.id = c.semester_id and s.active order by c.name`);
    const cur = classes.find((c) => c.name === sel);
    const members = cur ? await q<{ child_id: string; child: string; family: string }>(
      "select ch.id child_id, ch.name child, f.name family from public.sk_class_members m join public.children ch on ch.id = m.child_id join public.families f on f.id = m.family_id where m.class_id = $1 order by f.name", [cur.id]) : [];
    return { classes, cur, members };
  });
  return (
    <div className="col g14">
      <h1 className="h1" style={{ fontSize: 32 }}>Grup</h1>
      {d.classes.length === 0 ? <Empty>Belum ada kelas untuk semester aktif.</Empty> : <div className="grid3">{d.classes.map((c) => (
        <div key={c.id} className="card" style={c.name === d.cur?.name ? { borderColor: "var(--purple)" } : undefined}><h2 className="h2">Kelas {c.name}</h2><div className="muted">{c.n} dari {c.capacity} keluarga · {c.weekday} {c.start}</div>
          <div className="mt8"><Link className="btn ghost sm" href={`/sk/admin/grup?k=${encodeURIComponent(c.name)}`}>Atur anggota</Link></div></div>))}</div>}
      {d.cur ? (
        <section className="card" aria-label={`Anggota Kelas ${d.cur.name}`}><div className="row between wrap mb8"><h2 className="h2">Anggota Kelas {d.cur.name}</h2><CapacityForm key={d.cur.id} classId={d.cur.id} capacity={d.cur.capacity} /></div>
          <div className="tblwrap"><table className="tbl"><thead><tr><th scope="col">Keluarga</th><th scope="col">Anak</th><th scope="col">Pindahkan</th></tr></thead>
            <tbody>{d.members.length === 0 ? <tr><td colSpan={3} className="center muted">Belum ada anggota.</td></tr> : d.members.map((m) => <tr key={m.child_id}><td><b className="purple">Keluarga {m.family}</b></td><td>{m.child}</td><td><MoveChild childId={m.child_id} current={d.cur!.id} classes={d.classes.map((c) => ({ id: c.id, name: c.name }))} /></td></tr>)}</tbody></table></div></section>
      ) : null}
    </div>
  );
}
