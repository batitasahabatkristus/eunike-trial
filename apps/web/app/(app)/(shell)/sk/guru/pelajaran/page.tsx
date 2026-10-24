import type { Metadata } from "next";
import Link from "next/link";
import { loadGuru } from "@/lib/guru";
import { loadBundle, listLessons, pickLesson } from "@/lib/sk";
import { Empty } from "@/components/ui/bits";

export const metadata: Metadata = { title: "Pelajaran minggu ini" };

/** For lesson prep: the published lesson read-only, so a teacher sees what families see. */
export default async function PelajaranGuru({ searchParams }: { searchParams: Promise<{ pel?: string }> }) {
  const sp = await searchParams;
  const ctx = await loadGuru("/sk/guru/pelajaran", undefined, async (q) => {
    const lesson = pickLesson(await listLessons(q), sp.pel);
    return lesson ? loadBundle(q, lesson.id) : null;
  });
  if (!ctx) return null;
  const l = ctx.data;
  if (!l) return <Empty>Belum ada pelajaran yang terbit.</Empty>;
  return (
    <div className="page-narrow col g14">
      <div className="hdr"><Link className="back" href="/sk/guru" aria-label="Kembali">‹</Link><h1 className="t">Pelajaran {l.number}<small>{l.title}</small></h1></div>
      <section className="card"><div className="small muted">{l.truth}</div><p className="mt8"><b>Ayat:</b> {l.verse_text} <i>{l.verse_ref}</i></p></section>
      <ol className="col" style={{ paddingLeft: 0, listStyle: "none" }}>
        {l.steps.map((s) => <li key={s.position} className="card"><div className="small muted">Langkah {s.position}</div><b className="purple">{s.title}</b>{s.body ? <p className="small" style={{ margin: "4px 0 0" }}>{s.body}</p> : null}</li>)}
      </ol>
    </div>
  );
}
