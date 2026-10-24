"use server";

import { randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { z } from "zod";
import { actionSession, dbFail, fail, ok, type ActionResult } from "@/lib/actions";
import { asUser } from "@/lib/db";
import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { ASSET_MAX_BYTES, ASSET_MIME, safeFileName } from "@/lib/storage";
import { rateLimit } from "@/lib/rate-limit";
import type { UploadTicket } from "@/app/(app)/(shell)/sk/keluarga/actions";
import { TEMPLATE_STEPS, completeness, lessonPayload, type LessonPayload } from "@/lib/lesson-schema";

const uuid = z.uuid();
/** KU-01 "Buat materi baru": a draft with the standard 24-step flow, then straight into the editor. */
export async function createLesson() {
  const s = await actionSession();
  let id: string;
  try {
    id = await asUser(s.userId, async (q) => {
      const n = Number((await q.one<{ n: number }>("select coalesce(max(number), 0) + 1 as n from public.lessons"))!.n);
      const l = await q.one<{ id: string }>("insert into public.lessons(number, title, created_by) values ($1, 'Judul menyusul', $2) returning id", [n, s.userId]);
      for (const [i, [t, k]] of TEMPLATE_STEPS.entries()) {
        await q("insert into public.lesson_steps(lesson_id, position, title, kind, story_scene) values ($1, $2, $3, $4, $5)", [l!.id, i + 1, t, k, k === "story" ? i - 10 : null]);
      }
      return l!.id;
    });
  } catch { redirect("/sk/kurikulum?gagal=1"); }
  redirect(`/sk/kurikulum/materi/${id}`);
}

async function write(q: Parameters<Parameters<typeof asUser>[1]>[0], id: string, d: LessonPayload) {
  await q(`update public.lessons set number = $2, title = $3, short_title = $4, truth = $5, goal = $6, verse_text = $7, verse_ref = $8,
             publish_at = case when $9::text is null then null else ($9::text)::timestamp at time zone 'Asia/Jakarta' end, thumbnail_path = $10 where id = $1`,
    [id, d.number, d.title, d.short_title, d.truth, d.goal, d.verse_text, d.verse_ref, d.publish_local, d.thumbnail_path]);
  await q("delete from public.lesson_steps where lesson_id = $1", [id]);
  for (const [i, s] of d.steps.entries()) await q("insert into public.lesson_steps(lesson_id, position, title, body, kind, story_scene, video_url) values ($1,$2,$3,$4,$5,$6,$7)", [id, i + 1, s.title, s.body, s.kind, s.kind === "story" ? s.story_scene : null, s.video_url]);
  await q("delete from public.lesson_scenes where lesson_id = $1", [id]);
  for (const [i, c] of d.scenes.entries()) await q("insert into public.lesson_scenes(lesson_id, position, title, image_path, zoom, focus, narration_1_2, narration_2_3, narration_3_4) values ($1,$2,$3,$4,$5,$6,$7,$8,$9)", [id, i + 1, c.title, c.image_path, c.zoom, c.focus, c.n12, c.n23, c.n34]);
  await q("delete from public.power_items where lesson_id = $1", [id]);
  for (const [i, t] of d.power.map((x) => x.trim()).filter(Boolean).entries()) await q("insert into public.power_items(lesson_id, position, text) values ($1,$2,$3)", [id, i + 1, t]);
}

/** KU-02: used by both the manual save and the autosave. Only drafts can be written (RLS + trigger). */
export async function saveLesson(id: string, payload: LessonPayload): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.object({ id: uuid, d: lessonPayload }).safeParse({ id, d: payload });
  if (!p.success) return fail("Ada isian yang belum valid. Periksa judul, nomor, dan panjang teks.");
  try {
    await asUser(s.userId, (q) => write(q, p.data.id, p.data.d));
    return ok();
  } catch (e) { return dbFail(e); }
}

export async function sendForReview(id: string, payload: LessonPayload): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.object({ id: uuid, d: lessonPayload }).safeParse({ id, d: payload });
  if (!p.success) return fail("Ada isian yang belum valid.");
  const missing = completeness(p.data.d);
  if (missing.length) return fail(`Lengkapi dulu: ${missing.join(", ")}.`);
  try {
    await asUser(s.userId, async (q) => { await write(q, p.data.id, p.data.d); await q("update public.lessons set status = 'review', admin_note = null where id = $1", [p.data.id]); });
    return ok("Materi dikirim ke Admin SK untuk ditinjau");
  } catch (e) { return dbFail(e); }
}

/** Destination for a lesson image. Same two modes as Memory Marker uploads: Supabase signed URL, or the local dev route. */
export async function prepareAssetUpload(lessonId: string, fileName: string, mime: string, size: number): Promise<UploadTicket> {
  const s = await actionSession();
  const p = z.object({ l: z.union([uuid, z.literal("pustaka")]), n: z.string().min(1).max(200), m: z.string().max(100), z: z.number().int().positive() }).safeParse({ l: lessonId, n: fileName, m: mime, z: size });
  if (!p.success) return { ok: false, message: "Berkas tidak valid." };
  if (!s.roles.some((r) => r === "sk_kurikulum" || r === "sk_admin")) return { ok: false, message: "Anda tidak memiliki izin." };
  if (p.data.z > ASSET_MAX_BYTES) return { ok: false, message: "Gambar terlalu besar. Maksimal 10 MB." };
  if (!ASSET_MIME.test(p.data.m)) return { ok: false, message: "Gunakan gambar JPG, PNG, atau WebP." };
  if (!(await rateLimit(`asset:${s.userId}`, 60, 3600))) return { ok: false, message: "Terlalu banyak unggahan. Coba lagi nanti." };
  const path = `${p.data.l}/${randomUUID()}-${safeFileName(p.data.n)}`;
  if (supabaseConfigured()) {
    const { data, error } = await (await createClient()).storage.from("lesson-assets").createSignedUploadUrl(path);
    if (error || !data) return { ok: false, message: "Unggahan belum bisa dimulai." };
    return { ok: true, mode: "supabase", path, url: data.signedUrl, token: data.token };
  }
  return { ok: true, mode: "local", path, url: `/api/uploads/local?bucket=lesson-assets&path=${encodeURIComponent(path)}` };
}

export async function addLibraryAsset(title: string, kind: "image" | "song" | "video" | "file", path: string): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.object({ t: z.string().trim().min(1).max(120), k: z.enum(["image", "song", "video", "file"]), p: z.string().min(3).max(300) }).safeParse({ t: title, k: kind, p: path });
  if (!p.success) return fail("Isian tidak valid.");
  try { await asUser(s.userId, (q) => q("insert into public.lesson_assets(kind, title, storage_path, created_by) values ($1,$2,$3,$4)", [p.data.k, p.data.t, p.data.p, s.userId])); return ok("Ditambahkan ke Pustaka"); } catch (e) { return dbFail(e); }
}
