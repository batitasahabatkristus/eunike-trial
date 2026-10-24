import type { Metadata } from "next";
import Link from "next/link";
import { loadGuru } from "@/lib/guru";
import { Badge, Avatar, Empty } from "@/components/ui/bits";
import { ClassSwitch } from "@/components/app/ClassSwitch";

export const metadata: Metadata = { title: "Kelas saya" };

export default async function Kelas({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  const ctx = await loadGuru("/sk/guru/kelas", (await searchParams).k, async (q, klass) => {
    if (!klass) return [];
    return q<{ id: string; name: string; children: string; status: "in" | "out" | null }>(
      `select f.id, f.name, string_agg(ch.name, ', ' order by ch.dob) children,
              (select a.status from public.sk_attendance a join public.sk_meetings mt on mt.id = a.meeting_id
                where a.family_id = f.id and a.kind = 'family' and mt.class_id = $1 and mt.held_on <= current_date order by mt.held_on desc limit 1) status
         from public.sk_class_members m join public.families f on f.id = m.family_id join public.children ch on ch.id = m.child_id
        where m.class_id = $1 group by f.id, f.name order by f.name`, [klass.id]);
  });
  if (!ctx) return null;
  const { classes, klass, data } = ctx;
  if (!klass) return <Empty>Anda belum ditugaskan ke kelas mana pun.</Empty>;
  return (
    <div className="page-narrow col g14">
      <div className="hdr"><Link className="back" href="/sk/guru" aria-label="Kembali">‹</Link><h1 className="t">Kelas {klass.name}<small>{data.length} keluarga · {klass.weekday} {klass.start}</small></h1></div>
      <ClassSwitch classes={classes} current={klass} base="/sk/guru/kelas" />
      {data.length === 0 ? <Empty>Belum ada keluarga di kelas ini.</Empty> : data.map((f) => (
        <div key={f.id} className="evrow"><Avatar text={f.name} lilac /><div className="grow"><b className="purple">Keluarga {f.name}</b><div className="small muted">Anak: {f.children}</div></div>
          <Badge kind={f.status === "in" ? "ok" : f.status === "out" ? "need" : "warn"}>{f.status === "in" ? "Hadir" : f.status === "out" ? "Tidak hadir" : "Belum"}</Badge></div>
      ))}
    </div>
  );
}
