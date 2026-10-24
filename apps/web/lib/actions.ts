import "server-only";
import { getSession, type Session } from "@/lib/auth/session";
import { pgCode, pgMessage } from "@/lib/db";

export interface ActionResult { ok: boolean; message?: string }
export const ok = (message?: string): ActionResult => ({ ok: true, message });
export const fail = (message: string): ActionResult => ({ ok: false, message });

/** Every server action starts here. The role check is RLS in Postgres; this only makes sure someone is signed in. */
export async function actionSession(): Promise<Session> {
  const s = await getSession();
  if (!s) throw new Error("UNAUTHENTICATED");
  return s;
}

/** Turns database errors into plain Indonesian without leaking internals. */
export function dbFail(e: unknown): ActionResult {
  const code = pgCode(e), msg = pgMessage(e);
  if (code === "42501") return fail("Anda tidak memiliki izin untuk tindakan ini.");
  if (code === "23514" && /class is full/.test(msg)) return fail("Kelas ini sudah penuh.");
  if (code === "23514" && /3 files/.test(msg)) return fail("Maksimal 3 berkas.");
  if (code === "23514" && /both parent and teacher/.test(msg)) return fail("Refleksi orang tua dan guru harus terkirim dulu.");
  if (code === "23514" && /last sk_admin/.test(msg)) return fail("Tidak bisa menghapus admin SK terakhir.");
  if (code === "23505") return fail("Data ini sudah ada.");
  if (code === "22023") return fail("Isian tidak valid.");
  console.error("action error", code); // code only: never log row data (PRD §0.1)
  return fail("Terjadi kesalahan. Coba lagi.");
}
