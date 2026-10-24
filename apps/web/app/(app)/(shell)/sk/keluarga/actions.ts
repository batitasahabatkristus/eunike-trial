"use server";

import { randomUUID } from "node:crypto";
import { z } from "zod";
import { actionSession, dbFail, fail, ok, type ActionResult } from "@/lib/actions";
import { asUser } from "@/lib/db";
import { loadFamily } from "@/lib/family";
import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { ALLOWED_MIME, MAX_BYTES, MAX_FILES, safeFileName } from "@/lib/storage";
import { openPinGate } from "@/lib/pin-gate";
import { clientIp, rateLimit } from "@/lib/rate-limit";

const uuid = z.uuid();
const bad = () => fail("Isian tidak valid.");

async function myFamilyId(userId: string): Promise<string | null> {
  return asUser(userId, async (q) => (await loadFamily(q, userId))?.id ?? null);
}

/** SK-04: progress is saved per family per lesson. `step` is 0-based; steps before it count as done; finishing sets 24. */
export async function saveLessonProgress(lessonId: string, step: number, finished: boolean): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.object({ l: uuid, s: z.number().int().min(0).max(23) }).safeParse({ l: lessonId, s: step });
  if (!p.success) return bad();
  try {
    await asUser(s.userId, async (q) => {
      const fid = (await loadFamily(q, s.userId))?.id;
      if (!fid) throw Object.assign(new Error("no family"), { code: "42501" });
      if (!(await q.one("select 1 from public.lessons where id = $1", [p.data.l]))) throw Object.assign(new Error("lesson not visible"), { code: "42501" });
      await q(
        `insert into public.lesson_progress(family_id, lesson_id, step, done_steps) values ($1, $2, $3, $4)
         on conflict (family_id, lesson_id) do update set step = excluded.step, done_steps = greatest(public.lesson_progress.done_steps, excluded.done_steps), updated_at = now()`,
        [fid, p.data.l, p.data.s, finished ? 24 : p.data.s]);
    });
    return ok();
  } catch (e) { return dbFail(e); }
}

export async function saveAyat(lessonId: string, items: boolean[], memorized: boolean): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.object({ l: uuid, i: z.array(z.boolean()).length(3), m: z.boolean() }).safeParse({ l: lessonId, i: items, m: memorized });
  if (!p.success) return bad();
  try {
    await asUser(s.userId, async (q) => {
      const fid = await loadFamily(q, s.userId).then((f) => f?.id);
      if (!fid || !(await q.one("select 1 from public.lessons where id = $1", [p.data.l]))) throw Object.assign(new Error("x"), { code: "42501" });
      await q(`insert into public.ayat_progress(family_id, lesson_id, items, memorized) values ($1, $2, $3, $4)
               on conflict (family_id, lesson_id) do update set items = excluded.items, memorized = excluded.memorized, updated_at = now()`, [fid, p.data.l, p.data.i, p.data.m]);
    });
    return p.data.m ? ok("Ayat ditandai sudah dihafal") : ok();
  } catch (e) { return dbFail(e); }
}

export async function savePower(lessonId: string, items: boolean[]): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.object({ l: uuid, i: z.array(z.boolean()).length(3) }).safeParse({ l: lessonId, i: items });
  if (!p.success) return bad();
  try {
    await asUser(s.userId, async (q) => {
      const fid = await loadFamily(q, s.userId).then((f) => f?.id);
      if (!fid || !(await q.one("select 1 from public.lessons where id = $1", [p.data.l]))) throw Object.assign(new Error("x"), { code: "42501" });
      await q(`insert into public.power_progress(family_id, lesson_id, items) values ($1, $2, $3)
               on conflict (family_id, lesson_id) do update set items = excluded.items, updated_at = now()`, [fid, p.data.l, p.data.i]);
    });
    return ok("PoWeR tersimpan");
  } catch (e) { return dbFail(e); }
}

export async function postSharing(lessonId: string, body: string): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.object({ l: uuid, b: z.string().trim().min(1).max(2000) }).safeParse({ l: lessonId, b: body });
  if (!p.success) return fail("Tulis ceritanya dulu.");
  if (!(await rateLimit(`share:${s.userId}`, 20, 3600))) return fail("Terlalu banyak kiriman. Coba lagi nanti.");
  try {
    await asUser(s.userId, async (q) => {
      const fid = await loadFamily(q, s.userId).then((f) => f?.id);
      if (!fid) throw Object.assign(new Error("x"), { code: "42501" });
      await q("insert into public.sharing_posts(class_id, lesson_id, family_id, body) values (public.family_class_id($1), $2, $1, $3)", [fid, p.data.l, p.data.b]);
    });
    return ok("Cerita terkirim");
  } catch (e) { return dbFail(e); }
}

export async function likePost(postId: string): Promise<ActionResult> {
  const s = await actionSession();
  if (!uuid.safeParse(postId).success) return bad();
  try {
    await asUser(s.userId, async (q) => {
      const fid = await loadFamily(q, s.userId).then((f) => f?.id);
      if (!fid) throw Object.assign(new Error("x"), { code: "42501" });
      await q("insert into public.sharing_likes(post_id, family_id) values ($1, $2) on conflict do nothing", [postId, fid]);
    });
    return ok();
  } catch (e) { return dbFail(e); }
}

export async function confirmFamilyData(): Promise<ActionResult> {
  const s = await actionSession();
  try {
    await asUser(s.userId, async (q) => { const fid = (await loadFamily(q, s.userId))?.id; if (fid) await q("select public.confirm_family_data($1)", [fid]); });
    return ok("Terima kasih, data sudah dikonfirmasi");
  } catch (e) { return dbFail(e); }
}

export async function submitCorrection(text: string): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.string().trim().min(3).max(2000).safeParse(text);
  if (!p.success) return fail("Tulis apa yang perlu dikoreksi.");
  try {
    await asUser(s.userId, async (q) => { const fid = (await loadFamily(q, s.userId))?.id; if (fid) await q("select public.submit_family_correction($1, $2)", [fid, p.data]); });
    return ok("Koreksi terkirim ke admin");
  } catch (e) { return dbFail(e); }
}

export async function sendFeedback(text: string): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.string().trim().min(3).max(2000).safeParse(text);
  if (!p.success) return fail("Tulis masukan Anda.");
  try {
    await asUser(s.userId, (q) => q("insert into public.sk_feedback(profile_id, body) values ($1, $2)", [s.userId, p.data]));
    return ok("Terima kasih atas masukannya");
  } catch (e) { return dbFail(e); }
}

// ---------------------------------------------------------------- Memory Marker (SK-11)
export interface UploadTicket { ok: boolean; message?: string; path?: string; mode?: "local" | "supabase"; url?: string; token?: string }

/** Validates a file BEFORE the browser sends it and hands back where to put it. The file itself never passes through a server action. */
export async function prepareUpload(lessonId: string, fileName: string, mime: string, size: number): Promise<UploadTicket> {
  const s = await actionSession();
  const p = z.object({ l: uuid, n: z.string().min(1).max(200), m: z.string().max(100), z: z.number().int().positive() }).safeParse({ l: lessonId, n: fileName, m: mime, z: size });
  if (!p.success) return { ok: false, message: "Berkas tidak valid." };
  if (p.data.z > MAX_BYTES) return { ok: false, message: "Berkas terlalu besar. Maksimal 50 MB per berkas." };
  if (!ALLOWED_MIME.test(p.data.m)) return { ok: false, message: "Hanya foto atau video yang bisa diunggah." };
  const fid = await myFamilyId(s.userId);
  if (!fid) return { ok: false, message: "Keluarga belum terhubung." };
  if (!(await rateLimit(`upload:${s.userId}`, 30, 3600))) return { ok: false, message: "Terlalu banyak unggahan. Coba lagi nanti." };
  const path = `${fid}/${p.data.l}/${randomUUID()}-${safeFileName(p.data.n)}`;
  if (supabaseConfigured()) {
    const { data, error } = await (await createClient()).storage.from("memory-markers").createSignedUploadUrl(path);
    if (error || !data) return { ok: false, message: "Unggahan belum bisa dimulai. Coba lagi." };
    return { ok: true, mode: "supabase", path, url: data.signedUrl, token: data.token };
  }
  return { ok: true, mode: "local", path, url: `/api/uploads/local?path=${encodeURIComponent(path)}` };
}

const mmSchema = z.object({
  lessonId: uuid, childId: uuid,
  q1: z.string().max(2000), q2: z.string().max(2000), q3: z.string().max(2000), q4: z.string().max(2000),
  love: z.array(z.enum(["Melayani", "Memberi", "Mengampuni"])).max(3), faith: z.boolean(), couch: z.boolean(),
  files: z.array(z.object({ path: z.string().min(10).max(300), mime: z.string().regex(ALLOWED_MIME), size: z.number().int().positive().max(MAX_BYTES) })).max(MAX_FILES),
});
export async function saveMemoryMarker(input: z.input<typeof mmSchema>): Promise<ActionResult> {
  const s = await actionSession();
  const p = mmSchema.safeParse(input);
  if (!p.success) return bad();
  const d = p.data;
  try {
    await asUser(s.userId, async (q) => {
      const fid = await loadFamily(q, s.userId).then((f) => f?.id);
      if (!fid) throw Object.assign(new Error("x"), { code: "42501" });
      // files must live under this family's own folder
      for (const f of d.files) if (!f.path.startsWith(`${fid}/${d.lessonId}/`)) throw Object.assign(new Error("path"), { code: "42501" });
      const m = await q.one<{ id: string }>(
        `insert into public.memory_markers(family_id, child_id, lesson_id, q1, q2, q3, q4, love_in_action, faith_talk, couch_time, is_new)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,true)
         on conflict (family_id, lesson_id) do update set q1 = excluded.q1, q2 = excluded.q2, q3 = excluded.q3, q4 = excluded.q4,
           love_in_action = excluded.love_in_action, faith_talk = excluded.faith_talk, couch_time = excluded.couch_time, is_new = true
         returning id`, [fid, d.childId, d.lessonId, d.q1, d.q2, d.q3, d.q4, d.love, d.faith, d.couch]);
      for (const f of d.files) await q("insert into public.memory_marker_files(marker_id, storage_path, mime, size_bytes) values ($1,$2,$3,$4)", [m!.id, f.path, f.mime, f.size]);
    });
    return ok("Memory Marker terkirim ke guru kelas");
  } catch (e) { return dbFail(e); }
}

// ---------------------------------------------------------------- EPK (SK-12)
export async function submitParentEpk(childId: string, g: { g: string; gl: string; gr: string; go: string; gd: string }): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.object({ c: uuid, v: z.object({ g: z.string().max(2000), gl: z.string().max(2000), gr: z.string().max(2000), go: z.string().max(2000), gd: z.string().max(2000) }) }).safeParse({ c: childId, v: g });
  if (!p.success) return bad();
  try {
    await asUser(s.userId, (q) => q("select public.submit_parent_epk($1, (select id from public.semesters where active), $2::jsonb)", [p.data.c, JSON.stringify(p.data.v)]));
    return ok("Refleksi 5G terkirim");
  } catch (e) { return dbFail(e); }
}

/** Opens the published report for 15 minutes. Five wrong tries per family per 15 minutes. */
export async function verifyReportPin(familyId: string, pin: string): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.object({ f: uuid, pin: z.string().regex(/^\d{4}$/) }).safeParse({ f: familyId, pin });
  if (!p.success) return fail("PIN harus empat angka.");
  const ip = await clientIp();
  if (!(await rateLimit(`pin:${p.data.f}`, 5, 900)) || !(await rateLimit(`pin-ip:${ip}`, 30, 900))) return fail("Terlalu banyak percobaan. Coba lagi dalam beberapa menit.");
  const okPin = await asUser(s.userId, async (q) => (await q.one<{ v: boolean }>("select public.verify_family_pin($1, $2) v", [p.data.f, p.data.pin]))?.v === true);
  if (!okPin) return fail("PIN belum cocok.");
  await openPinGate(p.data.f, s.userId);
  return ok();
}
