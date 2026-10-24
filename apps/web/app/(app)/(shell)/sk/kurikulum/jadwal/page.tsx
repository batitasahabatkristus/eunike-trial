import type { Metadata } from "next";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { calendarLessons, dayOf, monthOf } from "@/lib/calendar";
import { PublishCalendar } from "@/components/app/PublishCalendar";

export const metadata: Metadata = { title: "Jadwal terbit" };

/** KU-03. Kurikulum sees what is planned; scheduling itself is the admin's approval (PRD §11.2). Publishing runs at publish_at. */
export default async function Jadwal({ searchParams }: { searchParams: Promise<{ bln?: string; hari?: string }> }) {
  const session = await guard("/sk/kurikulum/jadwal");
  if (!session) return null;
  const sp = await searchParams;
  const lessons = await asUser(session.userId, calendarLessons);
  return (
    <div className="col g14"><div><h1 className="h1" style={{ fontSize: 32 }}>Jadwal terbit</h1><p className="muted" style={{ margin: 0 }}>Kelola jadwal terbit materi untuk anak-anak. Admin SK menyetujui dan menjadwalkan.</p></div>
      <PublishCalendar month={monthOf(sp.bln)} selected={dayOf(sp.hari)} lessons={lessons} base="/sk/kurikulum/jadwal" admin={false} /></div>
  );
}
