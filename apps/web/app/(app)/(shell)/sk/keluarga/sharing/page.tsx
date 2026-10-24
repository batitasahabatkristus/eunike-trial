import type { Metadata } from "next";
import { loadSkPage } from "@/lib/sk-page";
import { SharingClient, type FeedItem } from "@/components/app/SkInteractive";
import { Empty } from "@/components/ui/bits";

export const metadata: Metadata = { title: "Sharing" };

/** SK-08: same-class posts only; the feed function returns family display names and nothing else about other families. */
export default async function Sharing({ searchParams }: { searchParams: Promise<{ pel?: string }> }) {
  const ctx = await loadSkPage("/sk/keluarga/sharing", (await searchParams).pel, async (q, { family, lesson }) => {
    if (!family?.klass || !lesson) return [] as FeedItem[];
    const rows = await q<{ id: string; kind: "post" | "reply"; author: string; body: string; pinned: boolean; likes: number; liked: boolean }>(
      "select id, kind, author, body, pinned, likes, liked from public.class_feed($1, $2)", [family.klass.id, lesson.id]);
    return rows;
  });
  if (!ctx) return null;
  const { lesson, family, extra } = ctx;
  if (!family || !lesson) return <Empty>Belum ada pelajaran yang terbit.</Empty>;
  const prompt = lesson.steps.find((s) => s.kind === "sharing")?.body || "Ceritakan satu momen keluarga minggu ini.";
  return (
    <div className="col g14">
      <h1 className="h2" style={{ fontSize: 22 }}>Pelajaran {lesson.number} · Sharing</h1>
      {family.klass ? <SharingClient lessonId={lesson.id} prompt={prompt} feed={extra} className={family.klass.name} /> : <Empty>Daftarkan anak ke sebuah kelas dulu untuk ikut Sharing.</Empty>}
    </div>
  );
}
