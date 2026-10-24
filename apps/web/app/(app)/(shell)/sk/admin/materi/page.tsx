import type { Metadata } from "next";
import Link from "next/link";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { FILTERS, MaterialTable, type Material } from "@/components/app/MaterialTable";

export const metadata: Metadata = { title: "Tinjau materi" };

/** AD-06 list: lessons waiting for review come first. */
export default async function AdminMateri({ searchParams }: { searchParams: Promise<{ f?: string }> }) {
  const session = await guard("/sk/admin/materi");
  if (!session) return null;
  const f = (await searchParams).f ?? "review";
  const all = await asUser(session.userId, (q) => q<Material>("select id, number, title, status::text, publish_at::text, updated_at::text, thumbnail_path from public.lessons order by (status = 'review') desc, number desc"));
  const rows = FILTERS.some(([, v]) => v === f) ? all.filter((m) => m.status === f) : all;
  return (
    <div className="col g14"><div><h1 className="h1" style={{ fontSize: 32 }}>Tinjau materi</h1><p className="muted" style={{ margin: 0 }}>Materi yang dikirim Kurikulum menunggu persetujuan Anda.</p></div>
      <nav className="chips" aria-label="Filter status">{FILTERS.filter(([, v]) => v).map(([l, v]) => <Link key={l} className={`chip${f === v ? " on" : ""}`} href={`/sk/admin/materi?f=${v}`}>{l} <b>{all.filter((m) => m.status === v).length}</b></Link>)}</nav>
      <MaterialTable rows={rows} base="/sk/admin/materi" action="Tinjau" /></div>
  );
}
