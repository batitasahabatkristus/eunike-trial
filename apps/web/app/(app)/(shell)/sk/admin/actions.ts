"use server";

import { z } from "zod";
import { actionSession, dbFail, fail, ok, type ActionResult } from "@/lib/actions";
import { asUser } from "@/lib/db";
import { applyRows, classify, MAX_ROWS, parseWorkbook, type Classified } from "@/lib/family-import";

const uuid = z.uuid();
const bad = () => fail("Isian tidak valid.");

/** AD-06 approve: schedules at the date Kurikulum chose and tells them. Only SK staff pass the database checks. */
export async function approveLesson(id: string): Promise<ActionResult> {
  const s = await actionSession();
  if (!uuid.safeParse(id).success) return bad();
  try {
    await asUser(s.userId, (q) => q("select public.approve_lesson($1)", [id]));
    return ok("Materi disetujui dan dijadwalkan");
  } catch (e) {
    return /publish date/.test(e instanceof Error ? e.message : "") ? fail("Tanggal terbit belum diisi oleh Kurikulum.") : dbFail(e);
  }
}

export async function requestRevision(id: string, note: string): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.object({ id: uuid, n: z.string().trim().min(3).max(1000) }).safeParse({ id, n: note });
  if (!p.success) return fail("Tulis catatan revisi untuk Kurikulum.");
  try {
    await asUser(s.userId, (q) => q("select public.request_lesson_revision($1, $2)", [p.data.id, p.data.n]));
    return ok("Revisi diminta; catatan dikirim ke Kurikulum");
  } catch (e) { return dbFail(e); }
}

export async function cancelSchedule(id: string): Promise<ActionResult> {
  const s = await actionSession();
  if (!uuid.safeParse(id).success) return bad();
  try { await asUser(s.userId, (q) => q("update public.lessons set status = 'draft' where id = $1 and status = 'scheduled'", [id])); return ok("Jadwal dibatalkan, kembali ke draf"); } catch (e) { return dbFail(e); }
}

export async function scheduleLesson(id: string): Promise<ActionResult> {
  return approveLesson(id);
}

// ---------------------------------------------------------------- families (AD-04)
export async function resolveCorrection(familyId: string): Promise<ActionResult> {
  const s = await actionSession();
  if (!uuid.safeParse(familyId).success) return bad();
  try { await asUser(s.userId, (q) => q("select public.resolve_family_correction($1)", [familyId])); return ok("Koreksi diselesaikan"); } catch (e) { return dbFail(e); }
}

// ---------------------------------------------------------------- EPK approval (AD-05)
export async function publishEpk(reportId: string): Promise<ActionResult> {
  const s = await actionSession();
  if (!uuid.safeParse(reportId).success) return bad();
  try { await asUser(s.userId, (q) => q("select public.publish_epk($1)", [reportId])); return ok("Laporan terbit; orang tua mendapat notifikasi"); } catch (e) { return dbFail(e); }
}

// ---------------------------------------------------------------- accounts and roles (AD-03)
const SK_ROLES = ["parent", "sk_guru", "sk_kurikulum", "sk_admin"] as const;
export async function saveRoles(profileId: string, roles: string[], classIds: string[]): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.object({ p: uuid, r: z.array(z.enum(SK_ROLES)).max(4), c: z.array(uuid).max(10) }).safeParse({ p: profileId, r: roles, c: classIds });
  if (!p.success) return bad();
  try {
    await asUser(s.userId, async (q) => {
      // every change goes through the user's own session: RLS limits an SK admin to the four SK roles and the audit trigger records it
      const cur = await q<{ id: string; role: string; scope_id: string | null; active: boolean }>("select id, role::text, scope_id::text, active from public.user_roles where profile_id = $1 and role::text = any($2)", [p.data.p, [...SK_ROLES]]);
      const want = new Set<string>();
      for (const r of p.data.r) { if (r === "sk_guru") for (const c of p.data.c) want.add(`sk_guru|${c}`); else want.add(`${r}|`); }
      for (const row of cur) {
        const key = `${row.role}|${row.scope_id ?? ""}`;
        if (want.has(key)) { if (!row.active) await q("update public.user_roles set active = true where id = $1", [row.id]); want.delete(key); }
        else if (row.active) await q("update public.user_roles set active = false where id = $1", [row.id]);
      }
      for (const key of want) {
        const [role, scope] = key.split("|");
        await q("insert into public.user_roles(profile_id, role, scope_type, scope_id, created_by) values ($1, $2, $3, $4, $5)", [p.data.p, role, scope ? "class" : "global", scope || null, s.userId]);
      }
    });
    return ok("Peran disimpan dan dicatat di audit");
  } catch (e) { return dbFail(e); }
}

// ---------------------------------------------------------------- Excel import (AD-04): preview first, then apply
export interface PreviewResult { ok: boolean; message?: string; rows?: Classified[]; counts?: Record<string, number> }

export async function previewImport(formData: FormData): Promise<PreviewResult> {
  const s = await actionSession();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "Pilih berkas Excel (.xlsx) dulu." };
  if (file.size > 2 * 1024 * 1024) return { ok: false, message: "Berkas terlalu besar. Maksimal 2 MB." };
  if (!/\.xlsx$/i.test(file.name)) return { ok: false, message: "Gunakan berkas .xlsx." };
  try {
    const parsed = await parseWorkbook(Buffer.from(await file.arrayBuffer()));
    if (parsed.errors.length && parsed.rows.length === 0) return { ok: false, message: parsed.errors[0] };
    const rows = await asUser(s.userId, (q) => classify(q, parsed.rows));
    const counts: Record<string, number> = {};
    for (const r of rows) counts[r.status] = (counts[r.status] ?? 0) + 1;
    return { ok: true, rows, counts, message: parsed.errors[0] };
  } catch (e) { return e instanceof Error && /zip|xlsx|end of central/i.test(e.message) ? { ok: false, message: "Berkas tidak dapat dibaca sebagai Excel." } : { ok: false, message: dbFail(e).message }; }
}

const rowSchema = z.object({ line: z.number().int(), family: z.string().trim().min(1).max(80), papa: z.string().trim().max(80), mama: z.string().trim().max(80), child: z.string().trim().min(1).max(80), dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), wa: z.string().regex(/^62\d{7,13}$/), klass: z.string().trim().max(40) });
export async function applyImport(rows: unknown): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.array(rowSchema).max(MAX_ROWS).safeParse(rows);
  if (!p.success) return bad();
  try {
    const out = await asUser(s.userId, async (q) => applyRows(q, await classify(q, p.data)));   // re-classified on the server: the browser's labels are never trusted
    return ok(`${out.created} keluarga ditambahkan, ${out.skipped} dilewati`);
  } catch (e) { return dbFail(e); }
}

// ---------------------------------------------------------------- groups
export async function moveChild(childId: string, classId: string): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.object({ c: uuid, k: uuid }).safeParse({ c: childId, k: classId });
  if (!p.success) return bad();
  try {
    await asUser(s.userId, async (q) => {
      const ch = await q.one<{ family_id: string }>("select family_id from public.children where id = $1", [p.data.c]);
      if (!ch) throw Object.assign(new Error("no child"), { code: "42501" });
      await q("delete from public.sk_class_members m using public.sk_classes c, public.semesters s where m.child_id = $1 and c.id = m.class_id and s.id = c.semester_id and s.active", [p.data.c]);
      await q("insert into public.sk_class_members(class_id, family_id, child_id) values ($1, $2, $3)", [p.data.k, ch.family_id, p.data.c]);
    });
    return ok("Anak dipindahkan");
  } catch (e) { return dbFail(e); }
}

export async function setCapacity(classId: string, capacity: number): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.object({ c: uuid, n: z.number().int().min(1).max(200) }).safeParse({ c: classId, n: capacity });
  if (!p.success) return fail("Kapasitas harus 1 sampai 200.");
  try { await asUser(s.userId, (q) => q("update public.sk_classes set capacity = $2 where id = $1", [p.data.c, p.data.n])); return ok("Kapasitas disimpan"); } catch (e) { return dbFail(e); }
}
