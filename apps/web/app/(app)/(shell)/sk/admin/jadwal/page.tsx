import type { Metadata } from "next";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { calendarLessons, dayOf, monthOf } from "@/lib/calendar";
import { PublishCalendar } from "@/components/app/PublishCalendar";

export const metadata: Metadata = { title: "Jadwal terbit" };

export default async function AdminJadwal({ searchParams }: { searchParams: Promise<{ bln?: string; hari?: string }> }) {
  const session = await guard("/sk/admin/jadwal");
  if (!session) return null;
  const sp = await searchParams;
  const lessons = await asUser(session.userId, calendarLessons);
  return (
    <div className="col g14"><div><h1 className="h1" style={{ fontSize: 32 }}>Jadwal terbit</h1><p className="muted" style={{ margin: 0 }}>Setujui, jadwalkan, atau batalkan jadwal materi.</p></div>
      <PublishCalendar month={monthOf(sp.bln)} selected={dayOf(sp.hari)} lessons={lessons} base="/sk/admin/jadwal" admin /></div>
  );
}
