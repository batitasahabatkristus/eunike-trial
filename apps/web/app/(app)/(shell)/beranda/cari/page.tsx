import type { Metadata } from "next";
import Link from "next/link";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { SearchRecents } from "@/components/app/SearchRecents";

export const metadata: Metadata = { title: "Pencarian" };

/** CO-07. Results come through RLS, so they only contain what this person may see (PL-02). */
export default async function Cari({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const session = await guard("/beranda/cari");
  if (!session) return null;
  const q = ((await searchParams).q ?? "").trim().slice(0, 80);
  const like = `%${q.replace(/[%_\\]/g, "\\$&")}%`;
  const res = q ? await asUser(session.userId, async (db) => ({
    lessons: await db<{ number: number; title: string }>("select number, title from public.lessons where status = 'published' and (title ilike $1 or short_title ilike $1 or truth ilike $1) order by number desc limit 10", [like]),
    docs: await db<{ title: string; summary: string; url: string | null }>("select title, summary, url from public.content_items where status = 'published' and (title ilike $1 or summary ilike $1) order by published_at desc limit 10", [like]),
  })) : null;
  const none = res && res.lessons.length === 0 && res.docs.length === 0;
  return (
    <div className="page-narrow col g14">
      <div className="hdr"><Link className="back" href="/beranda" aria-label="Kembali">‹</Link><h1 className="t">Pencarian</h1></div>
      <form role="search" action="/beranda/cari"><input className="inp" name="q" defaultValue={q} placeholder="🔍 Cari pelajaran, acara, dokumen" aria-label="Cari" autoFocus /></form>
      <SearchRecents current={q} />
      {res?.lessons.length ? <section className="col" aria-label="Pelajaran"><h2 className="h2">Pelajaran</h2>
        {res.lessons.map((l) => <Link key={l.number} className="evrow" href={`/sk/keluarga?pel=${l.number}`}><div className="ic-c" aria-hidden="true">📖</div><div className="grow"><b className="purple">{l.title}</b><div className="small muted">Pelajaran {l.number} · Sahabat Kristus</div></div>›</Link>)}</section> : null}
      {res?.docs.length ? <section className="col" aria-label="Dokumen"><h2 className="h2">Dokumen</h2>
        {res.docs.map((d) => <Link key={d.title} className="evrow" href="/beranda/parenting"><div className="ic-c" aria-hidden="true">📄</div><div className="grow"><b className="purple">{d.title}</b><div className="small muted">{d.summary}</div></div>›</Link>)}</section> : null}
      {none ? <div className="ghostbox">Tidak ada hasil.</div> : null}
      {!q ? <p className="muted small center">Ketik kata kunci untuk mencari pelajaran, acara, atau dokumen.</p> : null}
    </div>
  );
}
