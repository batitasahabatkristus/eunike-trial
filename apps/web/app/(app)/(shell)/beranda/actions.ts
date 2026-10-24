"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { actionSession, dbFail, fail, ok, type ActionResult } from "@/lib/actions";
import { asUser } from "@/lib/db";
import { safeNext } from "@/lib/routes";

const uuid = z.uuid();

export async function reportFamilyAttendance(meetingId: string, familyId: string, report: Record<string, boolean>): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.object({ m: uuid, f: uuid, r: z.record(z.string().max(40), z.boolean()) }).safeParse({ m: meetingId, f: familyId, r: report });
  if (!p.success) return fail("Isian tidak valid.");
  try {
    await asUser(s.userId, (q) => q("select public.report_family_attendance($1, $2, $3::jsonb)", [p.data.m, p.data.f, JSON.stringify(p.data.r)]));
    return ok("Absensi keluarga tersimpan");
  } catch (e) { return dbFail(e); }
}

export async function setPrivacyTimeline(familyId: string, on: boolean): Promise<ActionResult> {
  const s = await actionSession();
  if (!uuid.safeParse(familyId).success) return fail("Isian tidak valid.");
  try {
    await asUser(s.userId, (q) => q("update public.families set privacy_timeline = $2 where id = $1", [familyId, on]));
    return ok(on ? "Perjalanan keluarga ditampilkan" : "Perjalanan keluarga disembunyikan");
  } catch (e) { return dbFail(e); }
}

export async function registerChild(childId: string, classId: string, status: string): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.object({ c: uuid, k: uuid, s: z.enum(["anggota_baru", "pindahan"]) }).safeParse({ c: childId, k: classId, s: status });
  if (!p.success) return fail("Isian tidak valid.");
  try {
    await asUser(s.userId, (q) => q("select public.register_child_to_class($1, $2, $3)", [p.data.c, p.data.k, p.data.s]));
    return ok("Anak berhasil didaftarkan");
  } catch (e) { return dbFail(e); }
}

export async function markAllRead(): Promise<ActionResult> {
  const s = await actionSession();
  await asUser(s.userId, (q) => q("update public.notifications set read_at = now() where profile_id = $1 and read_at is null", [s.userId]));
  return ok();
}

/** Marks one notification read, then goes where it points. Only same-site paths are followed. */
export async function openNotification(formData: FormData) {
  const s = await actionSession();
  const id = uuid.safeParse(String(formData.get("id")));
  let to = "/beranda/notifikasi";
  if (id.success) {
    const row = await asUser(s.userId, (q) =>
      q.one<{ action_url: string | null }>("update public.notifications set read_at = coalesce(read_at, now()) where id = $1 and profile_id = $2 returning action_url", [id.data, s.userId]));
    to = safeNext(row?.action_url) ?? to;
  }
  redirect(to);
}

export async function updateProfile(name: string, phone: string): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.object({ n: z.string().trim().min(2).max(120), ph: z.string().trim().max(30) }).safeParse({ n: name, ph: phone });
  if (!p.success) return fail("Nama minimal 2 huruf.");
  try {
    await asUser(s.userId, (q) => q("update public.profiles set full_name = $2, phone = nullif($3, '') where id = $1", [s.userId, p.data.n, p.data.ph]));
    return ok("Profil tersimpan");
  } catch (e) { return dbFail(e); }
}

export async function setFamilyPin(familyId: string, pin: string): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.object({ f: uuid, pin: z.string().regex(/^\d{4}$/) }).safeParse({ f: familyId, pin });
  if (!p.success) return fail("PIN harus empat angka.");
  try {
    await asUser(s.userId, (q) => q("select public.set_family_pin($1, $2)", [p.data.f, p.data.pin]));
    return ok("PIN laporan keluarga tersimpan");
  } catch (e) { return dbFail(e); }
}
