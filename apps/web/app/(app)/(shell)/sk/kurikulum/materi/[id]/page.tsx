import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import type { LessonPayload } from "@/lib/lesson-schema";
import { LessonEditor } from "@/components/app/LessonEditor";

export const metadata: Metadata = { title: "Editor materi" };

/** KU-02 */
export default async function Editor({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await guard(`/sk/kurikulum/materi/${id}`);
  if (!session || !z.uuid().safeParse(id).success) return notFound();
  const data = await asUser(session.userId, async (q) => {
    const l = await q.one<{ number: number; title: string; short_title: string; truth: string; goal: string; verse_text: string; verse_ref: string; thumbnail_path: string | null; status: string; admin_note: string | null; publish_local: string | null }>(
      `select number, title, short_title, truth, goal, verse_text, verse_ref, thumbnail_path, status::text, admin_note,
              to_char(publish_at at time zone 'Asia/Jakarta', 'YYYY-MM-DD"T"HH24:MI') publish_local from public.lessons where id = $1`, [id]);
    if (!l) return null;
    const [steps, scenes, power] = await Promise.all([
      q<LessonPayload["steps"][number]>("select title, body, kind, story_scene, video_url from public.lesson_steps where lesson_id = $1 order by position", [id]),
      q<LessonPayload["scenes"][number]>("select title, image_path, zoom::float8 zoom, focus, narration_1_2 n12, narration_2_3 n23, narration_3_4 n34 from public.lesson_scenes where lesson_id = $1 order by position", [id]),
      q<{ text: string }>("select text from public.power_items where lesson_id = $1 order by position", [id]),
    ]);
    return { l, steps, scenes, power: power.map((p) => p.text) };
  });
  if (!data) return notFound();
  const { l } = data;
  const payload: LessonPayload = { number: l.number, title: l.title, short_title: l.short_title, truth: l.truth, goal: l.goal, verse_text: l.verse_text, verse_ref: l.verse_ref, publish_local: l.publish_local, thumbnail_path: l.thumbnail_path, steps: data.steps, scenes: data.scenes, power: data.power };
  return (
    <div className="col g14">
      <div className="hdr"><Link className="back" href="/sk/kurikulum" aria-label="Kembali ke daftar materi">‹</Link><h1 className="t">Pelajaran {l.number}<small>{l.title}</small></h1></div>
      <LessonEditor lessonId={id} initial={payload} status={l.status} adminNote={l.admin_note} editable={l.status === "draft"} />
    </div>
  );
}
