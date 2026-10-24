import type { Metadata } from "next";
import { loadSkPage } from "@/lib/sk-page";
import { assetUrl } from "@/lib/sk";
import { sceneSources } from "@/lib/sk-scenes";
import { LessonPlayer } from "@/components/app/LessonPlayer";
import { Empty } from "@/components/ui/bits";

export const metadata: Metadata = { title: "Cerita Alkitab" };

export default async function Page({ searchParams }: { searchParams: Promise<{ pel?: string }> }) {
  const ctx = await loadSkPage("/sk/keluarga/cerita", (await searchParams).pel);
  if (!ctx) return null;
  const { lesson, progress, family } = ctx;
  if (!family) return <Empty>Keluarga belum terhubung.</Empty>;
  if (!lesson) return <Empty>Belum ada pelajaran yang terbit.</Empty>;
  const firstStory = Math.max(lesson.steps.findIndex((s) => s.kind === "story"), 0);
  const cur = lesson.steps[progress.step];
  const start = cur?.kind !== "story" ? firstStory : progress.step; // the big story screen always opens on a scene
  return (
    <LessonPlayer lessonId={lesson.id} number={lesson.number} title={lesson.title} steps={lesson.steps} scenes={lesson.scenes}
      initialStep={start} initialDone={progress.done} mode="cerita" thumb={assetUrl(lesson.thumbnail_path)} sceneSrc={sceneSources(lesson)} />
  );
}
