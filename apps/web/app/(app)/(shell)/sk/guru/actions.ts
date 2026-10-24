"use server";

import { z } from "zod";
import { actionSession, dbFail, fail, ok, type ActionResult } from "@/lib/actions";
import { asUser } from "@/lib/db";
import { isYmd } from "@/lib/dates";

const uuid = z.uuid();
const bad = () => fail("Isian tidak valid.");

const rowSchema = z.object({ kind: z.enum(["family", "pendamping", "pengurus"]), family_id: uuid.optional(), name: z.string().trim().min(1).max(80).optional(), status: z.enum(["in", "out"]).nullable() })
  .refine((r) => (r.kind === "family" ? !!r.family_id : !!r.name));

/** GU-02: opens the meeting if needed and writes every row in one transaction (one round trip, atomic). */
export async function saveAttendance(classId: string, date: string, rows: z.input<typeof rowSchema>[]): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.object({ c: uuid, d: z.string().refine(isYmd), r: z.array(rowSchema).max(300) }).safeParse({ c: classId, d: date, r: rows });
  if (!p.success) return bad();
  try {
    const n = await asUser(s.userId, async (q) => {
      const m = await q.one<{ id: string }>("select public.ensure_meeting($1, $2::date) as id", [p.data.c, p.data.d]);
      const r = await q.one<{ n: number }>("select public.save_attendance($1, $2::jsonb) as n", [m!.id, JSON.stringify(p.data.r.map((x) => ({ ...x, family_id: x.family_id ?? "" })))]);
      return r!.n;
    });
    return ok(`Absensi tersimpan (${n} baris)`);
  } catch (e) { return dbFail(e); }
}

export async function markMarkerRead(markerId: string): Promise<ActionResult> {
  const s = await actionSession();
  if (!uuid.safeParse(markerId).success) return bad();
  try { await asUser(s.userId, (q) => q("update public.memory_markers set is_new = false where id = $1", [markerId])); return ok(); } catch (e) { return dbFail(e); }
}

export async function moderatePost(postId: string, field: "pinned" | "hidden", value: boolean): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.object({ i: uuid, f: z.enum(["pinned", "hidden"]), v: z.boolean() }).safeParse({ i: postId, f: field, v: value });
  if (!p.success) return bad();
  try {
    await asUser(s.userId, (q) => q(`update public.sharing_posts set ${p.data.f} = $2 where id = $1`, [p.data.i, p.data.v]));
    return ok(p.data.f === "hidden" ? (p.data.v ? "Postingan disembunyikan dari orang tua" : "Postingan ditampilkan lagi") : p.data.v ? "Postingan disematkan" : "Sematan dilepas");
  } catch (e) { return dbFail(e); }
}

export async function replyForum(classId: string, lessonId: string, body: string): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.object({ c: uuid, l: uuid, b: z.string().trim().min(1).max(2000) }).safeParse({ c: classId, l: lessonId, b: body });
  if (!p.success) return fail("Tulis balasan dulu.");
  try {
    await asUser(s.userId, async (q) => {
      const name = (await q.one<{ full_name: string }>("select full_name from public.profiles where id = $1", [s.userId]))?.full_name || "Guru";
      await q("insert into public.forum_posts(class_id, lesson_id, author_id, display_name, body) values ($1, $2, $3, $4, $5)", [p.data.c, p.data.l, s.userId, `Kak ${name.split(" ")[0]} (guru)`, p.data.b]);
    });
    return ok("Balasan terkirim");
  } catch (e) { return dbFail(e); }
}

export async function submitTeacherEpk(childId: string, note: string, p4: { a: string; b: string; c: string; d: string }): Promise<ActionResult> {
  const s = await actionSession();
  const p = z.object({ c: uuid, n: z.string().max(3000), p: z.object({ a: z.string().max(2000), b: z.string().max(2000), c: z.string().max(2000), d: z.string().max(2000) }) }).safeParse({ c: childId, n: note, p: p4 });
  if (!p.success) return bad();
  try {
    await asUser(s.userId, (q) => q("select public.submit_teacher_epk($1, (select id from public.semesters where active), $2::jsonb, $3::jsonb)", [p.data.c, JSON.stringify({ note: p.data.n }), JSON.stringify(p.data.p)]));
    return ok("Refleksi guru dan 4P terkirim ke admin");
  } catch (e) { return dbFail(e); }
}
