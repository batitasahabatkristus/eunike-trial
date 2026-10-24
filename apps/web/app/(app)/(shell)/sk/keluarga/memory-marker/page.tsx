import type { Metadata } from "next";
import Link from "next/link";
import { loadSkPage } from "@/lib/sk-page";
import { Empty } from "@/components/ui/bits";
import { MemoryMarkerForm, type ExistingFile } from "@/components/app/MemoryMarkerForm";

export const metadata: Metadata = { title: "Memory Marker" };

/** SK-11: four questions, Love in Action, Faith Talk, Couch Time, up to 3 files of 50 MB. One per family per lesson. */
export default async function MemoryMarker({ searchParams }: { searchParams: Promise<{ pel?: string }> }) {
  const ctx = await loadSkPage("/sk/keluarga/memory-marker", (await searchParams).pel, async (q, { family, lesson }) => {
    if (!family || !lesson) return null;
    const m = await q.one<{ id: string; q1: string; q2: string; q3: string; q4: string; love_in_action: string[]; faith_talk: boolean; couch_time: boolean }>(
      "select id, q1, q2, q3, q4, love_in_action, faith_talk, couch_time from public.memory_markers where family_id = $1 and lesson_id = $2", [family.id, lesson.id]);
    const files = m ? await q<ExistingFile>("select storage_path as path, mime from public.memory_marker_files where marker_id = $1 order by created_at", [m.id]) : [];
    return { m, files };
  });
  if (!ctx) return null;
  const { lesson, family, extra } = ctx;
  if (!family || !lesson) return <Empty>Belum ada pelajaran yang terbit.</Empty>;
  const child = family.children[0];
  if (!child) return <Empty>Belum ada data anak di keluarga ini.</Empty>;
  const m = extra?.m;
  return (
    <div className="col g14">
      <div className="hdr"><Link className="back" href={`/sk/keluarga?pel=${lesson.number}`} aria-label="Kembali">‹</Link><h1 className="t">Memory Marker<small>Pelajaran {lesson.number} · {lesson.title}</small></h1></div>
      {m ? <div className="banner ok">✓ Memory Marker sudah terkirim. Anda boleh memperbaruinya.</div> : null}
      <MemoryMarkerForm key={lesson.id} lessonId={lesson.id} lessonNo={lesson.number} childId={child.id} existing={extra?.files ?? []}
        defaults={m ? { q1: m.q1, q2: m.q2, q3: m.q3, q4: m.q4, love: m.love_in_action, faith: m.faith_talk, couch: m.couch_time } : null} />
    </div>
  );
}
