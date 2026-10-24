import type { Metadata } from "next";
import Link from "next/link";
import { loadGuru, kq } from "@/lib/guru";
import { fmtYmd, todayJakarta } from "@/lib/dates";
import { Badge, Empty } from "@/components/ui/bits";
import { ClassSwitch } from "@/components/app/ClassSwitch";

export const metadata: Metadata = { title: "Guru SK" };

/** GU-01. The task list is computed from real data, so it cannot drift from what is actually pending. */
export default async function GuruHome({ searchParams }: { searchParams: Promise<{ k?: string }> }) {
  const ctx = await loadGuru("/sk/guru", (await searchParams).k, async (q, klass) => {
    if (!klass) return null;
    const today = todayJakarta();
    const [fam, mm, meet, lesson, epk] = await Promise.all([
      q.one<{ n: string }>("select count(distinct family_id) n from public.sk_class_members where class_id = $1", [klass.id]),
      q.one<{ n: string }>("select count(*) n from public.memory_markers m where m.is_new and exists (select 1 from public.sk_class_members c where c.family_id = m.family_id and c.class_id = $1)", [klass.id]),
      q.one<{ id: string; held_on: string; filled: string; total: string }>(
        `select mt.id, mt.held_on::text, (select count(*) from public.sk_attendance a where a.meeting_id = mt.id and a.kind = 'family' and a.status is not null) filled,
                (select count(distinct family_id) from public.sk_class_members where class_id = $1) total
           from public.sk_meetings mt where mt.class_id = $1 and mt.held_on >= $2::date - 1 order by mt.held_on limit 1`, [klass.id, today]),
      q.one<{ number: number }>("select number from public.lessons where status = 'published' order by publish_at desc nulls last, number desc limit 1"),
      q.one<{ n: string }>(
        `select count(*) n from public.children ch join public.sk_class_members m on m.child_id = ch.id and m.class_id = $1
          where not exists (select 1 from public.epk_reports e where e.child_id = ch.id and e.semester_id = (select id from public.semesters where active) and e.teacher_sent_at is not null)`, [klass.id]),
    ]);
    return { families: Number(fam?.n ?? 0), newMarkers: Number(mm?.n ?? 0), meeting: meet, lessonNo: lesson?.number, epkTodo: Number(epk?.n ?? 0) };
  });
  if (!ctx) return null;
  const { classes, klass, data, session } = ctx;
  if (!klass || !data) return <div className="page-narrow"><Empty>Anda belum ditugaskan ke kelas mana pun. Hubungi admin SK.</Empty></div>;
  const s = kq(klass, classes);
  const open = data.meeting ? Number(data.meeting.filled) < Number(data.meeting.total) : false;
  const tiles = [
    ["/sk/guru/kelas", "👥", "Kelas Saya", `${data.families} keluarga`], ["/sk/guru/absensi", "📅", "Absensi", ""],
    ["/sk/guru/memory-marker", "📖", "Memory Marker", `${data.newMarkers} baru`], ["/sk/guru/pelajaran", "📝", "Pelajaran Minggu Ini", data.lessonNo ? `Pelajaran ${data.lessonNo}` : ""],
    ["/sk/guru/forum", "💬", "Forum", ""], ["/sk/guru/refleksi", "📄", "Refleksi 5G dan 4P", ""],
  ];
  const tasks = [
    { t: "Isi absensi kelas", done: !open && !!data.meeting, sub: open ? "Belum diisi" : "Selesai dikerjakan" },
    { t: `Periksa Memory Marker baru (${data.newMarkers})`, done: data.newMarkers === 0, sub: data.newMarkers ? "Belum dikerjakan" : "Selesai dikerjakan" },
    { t: `Isi refleksi 5G dan 4P (${data.epkTodo} anak belum)`, done: data.epkTodo === 0, sub: data.epkTodo ? "Belum dikerjakan" : "Selesai dikerjakan" },
  ];
  return (
    <div className="page-narrow col g14">
      <ClassSwitch classes={classes} current={klass} base="/sk/guru" />
      <div><h1 className="h1" style={{ fontSize: 32 }}>Halo, Kak {session.name.split(" ")[0]}</h1><p className="muted" style={{ fontWeight: 700, margin: "4px 0 0" }}>Mari terus melayani, ditolong Tuhan hari ini.</p></div>
      <section className="card row" aria-label="Hari ini">
        <div className="ic-c" aria-hidden="true">📅</div>
        <div className="grow"><h2 className="h3">Hari ini</h2><b className="purple">Absensi Kelas {klass.name}</b>
          <div className="small muted">{data.meeting ? `${fmtYmd(data.meeting.held_on, { weekday: "long", day: "numeric", month: "short" })}, ${open ? "siap dibuka" : "sudah diisi"}` : "Belum ada pertemuan terjadwal"}</div></div>
        <Link className="btn purple sm" href={`/sk/guru/absensi${s}`}>Buka absensi</Link>
      </section>
      <div className="tiles2">
        {tiles.map(([href, icon, label, chip]) => (
          <Link key={href} className="tile" href={`${href}${s}`}><span className="ic" aria-hidden="true">{icon}</span><span className="grow">{label}{chip ? <><br /><Badge kind="interview">{chip}</Badge></> : null}</span></Link>
        ))}
      </div>
      <section className="card" aria-labelledby="tg"><h2 className="h2" id="tg">Tugas saya</h2>
        {tasks.map((t) => (
          <div key={t.t} className="kv"><span className={`cb sq${t.done ? " on" : ""}`} aria-hidden="true">{t.done ? "✓" : ""}</span>
            <span className="grow"><b className="purple">{t.t}</b><div className="small muted">{t.sub}</div></span></div>
        ))}
      </section>
    </div>
  );
}
