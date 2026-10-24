import type { Metadata } from "next";
import Link from "next/link";
import { loadGuru } from "@/lib/guru";
import { fmtYmd, isYmd, todayJakarta } from "@/lib/dates";
import { Badge, Empty } from "@/components/ui/bits";
import { AttendanceBoard, type Row } from "@/components/app/AttendanceBoard";
import { ClassSwitch } from "@/components/app/ClassSwitch";

export const metadata: Metadata = { title: "Absensi" };

export default async function Absensi({ searchParams }: { searchParams: Promise<{ k?: string; tgl?: string }> }) {
  const sp = await searchParams;
  const ctx = await loadGuru("/sk/guru/absensi", sp.k, async (q, klass) => {
    if (!klass) return null;
    const today = todayJakarta();
    const meetings = await q<{ held_on: string; lesson_no: number | null }>(
      `select mt.held_on::text, l.number lesson_no from public.sk_meetings mt left join public.lessons l on l.id = mt.lesson_id where mt.class_id = $1 order by mt.held_on desc limit 14`, [klass.id]);
    const chosen = isYmd(sp.tgl) ? sp.tgl : ([...meetings].reverse().find((m) => m.held_on >= today)?.held_on ?? meetings[0]?.held_on ?? today);
    const fam = await q<{ id: string; name: string; status: "in" | "out" | null }>(
      `select f.id, f.name, a.status from public.sk_class_members m join public.families f on f.id = m.family_id
         left join public.sk_meetings mt on mt.class_id = m.class_id and mt.held_on = $2::date
         left join public.sk_attendance a on a.meeting_id = mt.id and a.family_id = f.id and a.kind = 'family'
        where m.class_id = $1 group by f.id, f.name, a.status order by f.name`, [klass.id, chosen]);
    const people = await q<{ kind: "pendamping" | "pengurus"; name: string; status: "in" | "out" | null }>(
      `select p.kind, p.person_name name, (select a.status from public.sk_attendance a join public.sk_meetings mt on mt.id = a.meeting_id
                 where a.kind = p.kind and a.person_name = p.person_name and mt.class_id = $1 and mt.held_on = $2::date) status
         from (select distinct a.kind, a.person_name from public.sk_attendance a join public.sk_meetings mt on mt.id = a.meeting_id
                where mt.class_id = $1 and a.kind <> 'family') p order by p.person_name`, [klass.id, chosen]);
    const lessonNo = meetings.find((m) => m.held_on === chosen)?.lesson_no ?? null;
    const rows: Row[] = [...fam.map((f) => ({ key: `f:${f.id}`, kind: "family" as const, family_id: f.id, name: f.name, status: f.status })), ...people.map((p) => ({ key: `${p.kind}:${p.name}`, kind: p.kind, name: p.name, status: p.status }))];
    return { meetings, chosen, rows, lessonNo };
  });
  if (!ctx) return null;
  const { classes, klass, data } = ctx;
  if (!klass || !data) return <Empty>Anda belum ditugaskan ke kelas mana pun.</Empty>;
  const base = `/sk/guru/absensi?${classes.length > 1 ? `k=${encodeURIComponent(klass.name)}&` : ""}`;
  return (
    <div className="page-narrow col g14">
      <div className="hdr"><Link className="back" href="/sk/guru" aria-label="Kembali">‹</Link>
        <h1 className="t">Absensi<small>{data.lessonNo ? `Pelajaran ${data.lessonNo} · ` : ""}{fmtYmd(data.chosen, { weekday: "long", day: "numeric", month: "short" })} <Badge kind="need">SK</Badge> <Badge kind="interview">Guru SK</Badge></small></h1></div>
      <ClassSwitch classes={classes} current={klass} base="/sk/guru/absensi" />
      <nav className="chips nowrap" aria-label="Pilih pertemuan">
        {[...data.meetings].reverse().map((m) => <Link key={m.held_on} href={`${base}tgl=${m.held_on}`} className={`chip sm${m.held_on === data.chosen ? " on" : ""}`}>{fmtYmd(m.held_on, { day: "numeric", month: "short" })}</Link>)}
      </nav>
      <AttendanceBoard key={`${klass.id}-${data.chosen}`} classId={klass.id} date={data.chosen} initial={data.rows} />
    </div>
  );
}
