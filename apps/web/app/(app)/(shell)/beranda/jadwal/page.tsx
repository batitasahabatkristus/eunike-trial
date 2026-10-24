import type { Metadata } from "next";
import Link from "next/link";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { addDays, fmtYmd, isYmd, todayJakarta, weekOf } from "@/lib/dates";
import { loadFamily, relLabel } from "@/lib/family";
import { AttendanceSheet } from "@/components/app/AttendanceSheet";
import { Badge, Empty } from "@/components/ui/bits";

export const metadata: Metadata = { title: "Jadwal" };
const FILTERS = ["Semua", "SK", "KTB", "Event"] as const;

/** CO-02. Week strip, filter chips, rows by type. Only SK has data until KTB and Events ship (Phase 4). */
export default async function Jadwal({ searchParams }: { searchParams: Promise<{ tgl?: string; f?: string }> }) {
  const session = await guard("/beranda/jadwal");
  if (!session) return null;
  const sp = await searchParams;
  const today = todayJakarta();
  const sel = isYmd(sp.tgl) ? sp.tgl : today;
  const filter = (FILTERS as readonly string[]).includes(sp.f ?? "") ? sp.f! : "Semua";
  const week = weekOf(sel);

  const data = await asUser(session.userId, async (q) => {
    const family = await loadFamily(q, session.userId);
    if (!family?.klass) return { family, meetings: [] as Meeting[] };
    const meetings = await q<Meeting>(
      `select mt.id, mt.held_on::text, l.number lesson_no, c.name class_name, to_char(c.start_time, 'HH24.MI') start_time, a.family_report
         from public.sk_meetings mt join public.sk_classes c on c.id = mt.class_id
         left join public.lessons l on l.id = mt.lesson_id
         left join public.sk_attendance a on a.meeting_id = mt.id and a.family_id = $1 and a.kind = 'family'
        where mt.class_id = $2 and mt.held_on >= $3 order by mt.held_on limit 12`, [family.id, family.klass.id, week[0].ymd]);
    return { family, meetings };
  });

  const people = data.family ? [...data.family.members.filter((x) => x.relation !== "anak").map((x) => ({ key: x.relation === "wali" ? `wali-${x.id}` : x.relation, label: relLabel(x.relation) })), ...data.family.children.map((c) => ({ key: `anak-${c.id}`, label: c.name }))] : [];
  const href = (over: { tgl?: string; f?: string }) => `/beranda/jadwal?tgl=${over.tgl ?? sel}&f=${over.f ?? filter}`;
  const showSk = filter === "Semua" || filter === "SK";

  return (
    <div className="page-narrow col g14">
      <h1 className="h1" style={{ fontSize: 30 }}>Jadwal</h1>
      <nav className="dayrow" aria-label="Pekan ini">
        {week.map((d) => (
          <Link key={d.ymd} href={href({ tgl: d.ymd })} className={d.ymd === sel ? "on" : undefined} aria-current={d.ymd === sel ? "date" : undefined} aria-label={fmtYmd(d.ymd)}>{d.dow}<b>{d.day}</b></Link>
        ))}
      </nav>
      <div className="row between small">
        <Link href={href({ tgl: addDays(sel, -7) })} className="btn text sm">‹ Pekan lalu</Link>
        <Link href={href({ tgl: today })} className="btn text sm">Hari ini</Link>
        <Link href={href({ tgl: addDays(sel, 7) })} className="btn text sm">Pekan depan ›</Link>
      </div>
      <div className="chips">{FILTERS.map((x) => <Link key={x} href={href({ f: x })} className={`chip${filter === x ? " on" : ""}`} aria-current={filter === x ? "true" : undefined}>{x}</Link>)}</div>

      {showSk && data.meetings.length > 0 ? data.meetings.map((e) => (
        <div key={e.id} className="evrow">
          <div className="tag sk" aria-hidden="true">SK</div>
          <div className="grow">
            <div className="small muted" style={{ fontWeight: 800 }}>{fmtYmd(e.held_on, { weekday: "long", day: "numeric", month: "short" })}</div>
            <b className="purple">Kelas {e.class_name}{e.lesson_no ? ` · Pelajaran ${e.lesson_no}` : ""}</b>
            <div className="small muted">🕘 {e.start_time}</div>
          </div>
          {data.family ? (
            <AttendanceSheet meetingId={e.id} familyId={data.family.id} people={people} initial={e.family_report}
              subtitle={`Kelas ${e.class_name}${e.lesson_no ? ` · Pelajaran ${e.lesson_no}` : ""} · ${fmtYmd(e.held_on, { weekday: "long", day: "numeric", month: "short" })}`}
              label={e.family_report ? "Sudah isi absensi" : "Isi absensi"} className={e.family_report ? "badge b-ok" : "btn red sm"} />
          ) : <Badge kind="ok">Terjadwal</Badge>}
        </div>
      )) : <Empty>Belum ada jadwal untuk filter ini.</Empty>}
    </div>
  );
}

interface Meeting { id: string; held_on: string; lesson_no: number | null; class_name: string; start_time: string; family_report: Record<string, boolean> | null }
