import type { Q } from "@/lib/db";

export interface Step { position: number; title: string; body: string; kind: "text" | "video" | "story" | "ayat" | "sharing" | "power" | "memory_marker"; story_scene: number | null; video_url: string | null }
export interface Scene { position: number; title: string; image_path: string | null; zoom: number; focus: string; n12: string; n23: string; n34: string }
export interface LessonLite { id: string; number: number; title: string; short_title: string; truth: string; thumbnail_path: string | null; publish_at: string | null }
export interface LessonBundle extends LessonLite { goal: string; verse_text: string; verse_ref: string; steps: Step[]; scenes: Scene[]; power: string[] }
export interface Progress { step: number; done: number }

/** Where lesson images live. Public seed art starts with "/"; anything else is a private storage path served through /api/files. */
export const assetUrl = (path: string | null | undefined): string => (!path ? "" : /^(\/|https?:)/.test(path) ? path : `/api/files/lesson-assets/${path}`);

export async function listLessons(q: Q): Promise<LessonLite[]> {
  return q<LessonLite>("select id, number, title, short_title, truth, thumbnail_path, publish_at::text from public.lessons where status = 'published' order by number");
}

/** SK-02: default is the latest published lesson by publish_at. */
export function defaultLesson(lessons: LessonLite[]): LessonLite | undefined {
  return [...lessons].sort((a, b) => (b.publish_at ?? "").localeCompare(a.publish_at ?? "") || b.number - a.number)[0];
}
export const pickLesson = (lessons: LessonLite[], pel: string | undefined) => lessons.find((l) => String(l.number) === pel) ?? defaultLesson(lessons);

export async function loadBundle(q: Q, lessonId: string): Promise<LessonBundle | null> {
  const l = await q.one<LessonLite & { goal: string; verse_text: string; verse_ref: string }>(
    "select id, number, title, short_title, truth, goal, verse_text, verse_ref, thumbnail_path, publish_at::text from public.lessons where id = $1", [lessonId]);
  if (!l) return null;
  const [steps, scenes, power] = await Promise.all([
    q<Step>("select position, title, body, kind, story_scene, video_url from public.lesson_steps where lesson_id = $1 order by position", [lessonId]),
    q<Scene>("select position, title, image_path, zoom::float8 zoom, focus, narration_1_2 n12, narration_2_3 n23, narration_3_4 n34 from public.lesson_scenes where lesson_id = $1 order by position", [lessonId]),
    q<{ text: string }>("select text from public.power_items where lesson_id = $1 order by position", [lessonId]),
  ]);
  return { ...l, steps, scenes, power: power.map((p) => p.text) };
}

export async function loadProgress(q: Q, familyId: string, lessonId: string): Promise<Progress> {
  const r = await q.one<{ step: number; done_steps: number }>("select step, done_steps from public.lesson_progress where family_id = $1 and lesson_id = $2", [familyId, lessonId]);
  return { step: r?.step ?? 0, done: r?.done_steps ?? 0 };
}

export const pelQuery = (n: number) => `?pel=${n}`;
