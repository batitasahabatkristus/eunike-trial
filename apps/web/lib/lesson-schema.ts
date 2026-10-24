import { z } from "zod";

// Shared by the editor (client) and the save/review actions (server).
export const TEMPLATE_STEPS: [string, string][] = [
  ["Sambutan", "text"], ["Doa pembuka", "text"], ["Lagu pembuka", "text"], ["Mari bergerak", "text"], ["Kata kunci", "text"], ["Pertanyaan pembuka", "text"],
  ["Video pengantar", "video"], ["Siapkan benda cerita", "text"], ["Siapkan hati", "text"], ["Sebelum bercerita", "text"], ["Pengantar cerita", "text"],
  ["Cerita Alkitab", "story"], ["Cerita Alkitab", "story"], ["Cerita Alkitab", "story"], ["Cerita Alkitab", "story"], ["Cerita Alkitab", "story"],
  ["Bicara tentang cerita", "text"], ["Ayat hafalan", "ayat"], ["Ulangi ayat", "ayat"], ["Sharing keluarga", "sharing"], ["Aktivitas bersama anak", "text"],
  ["PoWeR", "power"], ["Doa penutup", "text"], ["Memory Marker", "memory_marker"],
];

const step = z.object({ title: z.string().trim().min(1).max(120), body: z.string().max(3000), kind: z.enum(["text", "video", "story", "ayat", "sharing", "power", "memory_marker"]), story_scene: z.number().int().min(1).max(5).nullable(), video_url: z.string().max(500).nullable() });
const scene = z.object({ title: z.string().trim().min(1).max(120), image_path: z.string().max(300).nullable(), zoom: z.number().min(0.5).max(4), focus: z.string().regex(/^\d{1,3}% \d{1,3}%$/), n12: z.string().max(2000), n23: z.string().max(2000), n34: z.string().max(2000) });
export const lessonPayload = z.object({
  number: z.number().int().min(1).max(999), title: z.string().trim().min(1).max(120), short_title: z.string().trim().max(40), truth: z.string().max(200), goal: z.string().max(300),
  verse_text: z.string().max(500), verse_ref: z.string().max(60), publish_local: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).nullable(), thumbnail_path: z.string().max(300).nullable(),
  steps: z.array(step).max(24), scenes: z.array(scene).max(5), power: z.array(z.string().max(120)).max(3),
});
export type LessonPayload = z.infer<typeof lessonPayload>;

/** The checklist an admin reviewer would otherwise bounce back. */
export function completeness(d: LessonPayload): string[] {
  const out: string[] = [];
  if (!d.title.trim() || d.title === "Judul menyusul") out.push("judul");
  if (d.steps.length !== 24) out.push(`alur 24 langkah (sekarang ${d.steps.length})`);
  if (d.steps.some((x) => x.kind === "story") && d.scenes.length !== 5) out.push("5 adegan cerita");
  if (!d.verse_text.trim()) out.push("ayat hafalan");
  if (!d.publish_local) out.push("tanggal terbit");
  return out;
}

