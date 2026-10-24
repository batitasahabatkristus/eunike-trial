import type { Metadata } from "next";
import Link from "next/link";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { Badge, Empty } from "@/components/ui/bits";

export const metadata: Metadata = { title: "Parenting" };
const FORMATS = [["", "Semua"], ["article", "Artikel"], ["podcast", "Podcast"], ["guide", "Panduan"]] as const;
const LABEL: Record<string, string> = { article: "Artikel", podcast: "Podcast", guide: "Panduan" };
const ICON: Record<string, string> = { article: "📰", podcast: "🎧", guide: "📄" };

/** CO-09: published items from content_items. */
export default async function Parenting({ searchParams }: { searchParams: Promise<{ f?: string; q?: string }> }) {
  const session = await guard("/beranda/parenting");
  if (!session) return null;
  const sp = await searchParams;
  const f = FORMATS.some(([v]) => v === sp.f) ? sp.f ?? "" : "";
  const q = (sp.q ?? "").trim().slice(0, 80);
  const items = await asUser(session.userId, (db) => db<{ id: string; title: string; summary: string; format: string; url: string | null }>(
    `select id, title, summary, format, url from public.content_items where status = 'published' and format in ('article','podcast','guide')
       and ($1 = '' or format = $1) and ($2 = '' or title ilike '%' || $2 || '%' or summary ilike '%' || $2 || '%') order by published_at desc nulls last`, [f, q]));
  const [hero, ...rest] = items;
  return (
    <div className="page-narrow col g14">
      <div className="hdr"><Link className="back" href="/beranda" aria-label="Kembali">‹</Link><h1 className="t">Parenting</h1></div>
      <form role="search"><input className="inp" name="q" defaultValue={q} placeholder="🔍 Cari artikel atau panduan" aria-label="Cari artikel atau panduan" />{f ? <input type="hidden" name="f" value={f} /> : null}</form>
      <div className="chips">{FORMATS.map(([v, l]) => <Link key={l} className={`chip${f === v ? " on" : ""}`} href={`/beranda/parenting?f=${v}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>{l}</Link>)}</div>
      {!hero ? <Empty>Belum ada bacaan untuk filter ini.</Empty> : (
        <>
          <article className="card"><div className="photo" style={{ height: 140 }} aria-hidden="true">FOTO</div><h2 className="h2 mt8">{hero.title}</h2><div className="small muted">{hero.summary}</div>
            {hero.url ? <div className="mt8"><a className="btn red sm" href={hero.url} target="_blank" rel="noreferrer">Baca</a></div> : <div className="mt8"><Badge kind="draft">Segera hadir</Badge></div>}</article>
          {rest.map((i) => {
            const body = (<><div className="ic-c" aria-hidden="true">{ICON[i.format]}</div><div className="grow"><b className="purple">{i.title}</b><div className="small muted">{i.summary}</div></div><Badge kind="interview">{LABEL[i.format]}</Badge></>);
            return i.url ? <a key={i.id} className="evrow" href={i.url} target="_blank" rel="noreferrer">{body}</a> : <div key={i.id} className="evrow">{body}</div>;
          })}
        </>
      )}
    </div>
  );
}
