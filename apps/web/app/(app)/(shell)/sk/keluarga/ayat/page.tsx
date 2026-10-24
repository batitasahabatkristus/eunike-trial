import type { Metadata } from "next";
import { loadSkPage } from "@/lib/sk-page";
import { AyatClient } from "@/components/app/SkInteractive";
import { Empty } from "@/components/ui/bits";

export const metadata: Metadata = { title: "Ayat" };

/** SK-07 */
export default async function Ayat({ searchParams }: { searchParams: Promise<{ pel?: string }> }) {
  const ctx = await loadSkPage("/sk/keluarga/ayat", (await searchParams).pel, async (q, { family, lesson }) =>
    family && lesson ? await q.one<{ items: boolean[]; memorized: boolean }>("select items, memorized from public.ayat_progress where family_id = $1 and lesson_id = $2", [family.id, lesson.id]) : null);
  if (!ctx) return null;
  const { lesson, family, extra } = ctx;
  if (!family || !lesson) return <Empty>Belum ada pelajaran yang terbit.</Empty>;
  return (
    <div className="col g14">
      <h1 className="h2" style={{ fontSize: 22 }}>Pelajaran {lesson.number} · Ayat</h1>
      <AyatClient lessonId={lesson.id} text={lesson.verse_text || "Ayat pelajaran ini belum diisi."} reference={lesson.verse_ref} items={extra?.items ?? [false, false, false]} memorized={extra?.memorized ?? false} />
    </div>
  );
}
