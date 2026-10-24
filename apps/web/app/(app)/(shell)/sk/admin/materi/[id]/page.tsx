import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { loadBundle } from "@/lib/sk";
import { sceneSources } from "@/lib/sk-scenes";
import { fmtYmd } from "@/lib/dates";
import { Badge, Banner } from "@/components/ui/bits";
import { STATUS } from "@/components/app/MaterialTable";
import { ScheduleActions } from "@/components/app/ScheduleActions";

export const metadata: Metadata = { title: "Tinjau materi" };

/** AD-06: read what Kurikulum wrote, then approve and schedule, or send it back with a note. */
export default async function Tinjau({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await guard(`/sk/admin/materi/${id}`);
  if (!session || !z.uuid().safeParse(id).success) return notFound();
  const d = await asUser(session.userId, async (q) => {
    const meta = await q.one<{ status: string; admin_note: string | null; day: string | null }>("select status::text, admin_note, (publish_at at time zone 'Asia/Jakarta')::date::text day from public.lessons where id = $1", [id]);
    return meta ? { meta, l: await loadBundle(q, id) } : null;
  });
  if (!d?.l) return notFound();
  const { l, meta } = d;
  const src = sceneSources(l);
  const [label, kind] = STATUS[meta.status] ?? ["Draf", "draft" as const];
  return (
    <div className="col g14">
      <div className="hdr"><Link className="back" href="/sk/admin/materi" aria-label="Kembali">‹</Link><h1 className="t">Pelajaran {l.number}<small>{l.title}</small></h1></div>
      <div className="row"><Badge kind={kind}>{label}</Badge><span className="small muted">Terbit: {meta.day ? fmtYmd(meta.day, { day: "numeric", month: "long", year: "numeric" }) : "belum diisi"}</span></div>
      {meta.admin_note ? <Banner kind="warn"><span><b>Catatan revisi sebelumnya:</b> {meta.admin_note}</span></Banner> : null}
      <Banner kind="info">Alur {l.steps.length} langkah · {l.scenes.length} adegan · narasi tiga usia{l.power.length ? ` · ${l.power.length} tindakan PoWeR` : ""}</Banner>
      <div className="g21">
        <section className="card"><h2 className="h2">{l.title}</h2><p className="muted">{l.truth}</p><p><b>Ayat:</b> {l.verse_text || "-"} <i>{l.verse_ref}</i></p>
          <ol className="col" style={{ paddingLeft: 0, listStyle: "none", gap: 6 }}>{l.steps.map((s) => <li key={s.position} className="small"><span className="badge b-interview" style={{ marginRight: 8 }}>{s.position}</span><b>{s.title}</b>{s.body ? ` — ${s.body}` : ""}</li>)}</ol></section>
        <aside className="col">
          <section className="card"><h2 className="h3">Adegan cerita</h2>
            {l.scenes.map((s) => (<div key={s.position} className="mt8"><div className="story-img" style={{ aspectRatio: "16/9" }}>{src[s.position] /* eslint-disable-next-line @next/next/no-img-element */ ? <img src={src[s.position]} alt={s.title} style={{ transform: `scale(${s.zoom})`, transformOrigin: s.focus }} /> : <div className="photo" style={{ height: "100%", borderRadius: 0 }}>FOTO</div>}</div><b className="purple small">{s.position}. {s.title}</b></div>))}</section>
          <section className="card"><h2 className="h3">Keputusan</h2><ScheduleActions id={id} status={meta.status} /></section>
        </aside>
      </div>
    </div>
  );
}
