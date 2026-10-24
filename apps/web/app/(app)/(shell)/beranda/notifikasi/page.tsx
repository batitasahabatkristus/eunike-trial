import type { Metadata } from "next";
import Link from "next/link";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { relDay } from "@/components/ui/bits";
import { NotificationList, type Notif } from "@/components/app/NotificationList";

export const metadata: Metadata = { title: "Notifikasi" };

export default async function Notifikasi({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const session = await guard("/beranda/notifikasi");
  if (!session) return null;
  const filter = (await searchParams).f === "belum" ? "belum" : "semua";
  const rows = await asUser(session.userId, (q) => q<{ id: string; title: string; body: string | null; action_url: string | null; read_at: string | null; created_at: string }>(
    `select id, title, body, action_url, read_at::text, created_at::text from public.notifications where profile_id = $1 ${filter === "belum" ? "and read_at is null" : ""} order by created_at desc limit 100`, [session.userId]));
  const items: Notif[] = rows.map((r) => ({ id: r.id, title: r.title, body: r.body, action_url: r.action_url, read: !!r.read_at, at: r.created_at, group: relDay(r.created_at) }));
  return (
    <div className="page-narrow col g14">
      <div className="hdr"><Link className="back" href="/beranda" aria-label="Kembali">‹</Link><h1 className="t">Notifikasi</h1></div>
      <NotificationList items={items} filter={filter} />
    </div>
  );
}
