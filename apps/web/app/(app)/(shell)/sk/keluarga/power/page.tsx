import type { Metadata } from "next";
import { loadSkPage } from "@/lib/sk-page";
import { PowerClient } from "@/components/app/SkInteractive";
import { Empty } from "@/components/ui/bits";

export const metadata: Metadata = { title: "PoWeR" };

/** SK-09 */
export default async function Power({ searchParams }: { searchParams: Promise<{ pel?: string }> }) {
  const ctx = await loadSkPage("/sk/keluarga/power", (await searchParams).pel, async (q, { family, lesson }) =>
    family && lesson ? await q.one<{ items: boolean[] }>("select items from public.power_progress where family_id = $1 and lesson_id = $2", [family.id, lesson.id]) : null);
  if (!ctx) return null;
  const { lesson, family, extra } = ctx;
  if (!family || !lesson) return <Empty>Belum ada pelajaran yang terbit.</Empty>;
  return (
    <div className="col g14">
      <h1 className="h2" style={{ fontSize: 22 }}>Pelajaran {lesson.number} · PoWeR</h1>
      <PowerClient lessonId={lesson.id} labels={lesson.power.length ? lesson.power : ["Berdoa bersama", "Bernyanyi bersama", "Berbagi dengan orang lain"]} items={extra?.items ?? []} />
    </div>
  );
}
