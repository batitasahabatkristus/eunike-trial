import type { Metadata } from "next";
import Link from "next/link";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { createLesson } from "./actions";
import { FILTERS, MaterialTable, type Material } from "@/components/app/MaterialTable";
import { Banner } from "@/components/ui/bits";
import { SubmitButton } from "@/components/ui/SubmitButton";

export const metadata: Metadata = { title: "Materi" };

/** KU-01 */
export default async function Materi({ searchParams }: { searchParams: Promise<{ f?: string; gagal?: string }> }) {
  const session = await guard("/sk/kurikulum");
  if (!session) return null;
  const sp = await searchParams;
  const all = await asUser(session.userId, (q) => q<Material>("select id, number, title, status::text, publish_at::text, updated_at::text, thumbnail_path from public.lessons order by number desc"));
  const f = FILTERS.some(([, v]) => v === sp.f) ? sp.f! : null;
  const rows = f ? all.filter((m) => m.status === f) : all;
  const count = (v: string | null) => (v ? all.filter((m) => m.status === v).length : all.length);
  return (
    <div className="col g14">
      <div className="row between wrap"><div><h1 className="h1" style={{ fontSize: 32 }}>Materi</h1><p className="muted" style={{ margin: 0 }}>Kelola materi pembelajaran untuk anak-anak.</p></div>
        <form action={createLesson}><SubmitButton className="btn purple" pendingText="Membuat…">＋ Buat materi baru</SubmitButton></form></div>
      {sp.gagal ? <Banner kind="err">Materi baru belum bisa dibuat. Coba lagi.</Banner> : null}
      <nav className="chips" aria-label="Filter status">{FILTERS.map(([l, v]) => <Link key={l} className={`chip${(f ?? null) === v ? " on" : ""}`} href={v ? `/sk/kurikulum?f=${v}` : "/sk/kurikulum"}>{l} <b>{count(v)}</b></Link>)}</nav>
      <MaterialTable rows={rows} base="/sk/kurikulum/materi" action="✎ Edit" />
    </div>
  );
}
