import "server-only";
import { guard, type Session } from "@/lib/auth/session";
import { asUser, type Q } from "@/lib/db";

export interface GuruClass { id: string; name: string; weekday: string; start: string; capacity: number }
export interface GuruCtx<T> { session: Session; classes: GuruClass[]; klass: GuruClass | null; data: T }

/** Shared loader for every /sk/guru screen. A guru may teach several classes; `?k=` (class name) picks one, default is the first. */
export async function loadGuru<T>(path: string, k: string | undefined, fn: (q: Q, klass: GuruClass | null, session: Session) => Promise<T>): Promise<GuruCtx<T> | null> {
  const session = await guard(path);
  if (!session) return null;
  return asUser(session.userId, async (q) => {
    const classes = await q<GuruClass>(
      `select c.id, c.name, c.weekday, to_char(c.start_time, 'HH24.MI') "start", c.capacity
         from public.sk_classes c join public.semesters s on s.id = c.semester_id and s.active
         join public.user_roles ur on ur.scope_id = c.id and ur.profile_id = $1 and ur.role = 'sk_guru' and ur.active and ur.scope_type = 'class'
        order by c.name`, [session.userId]);
    const klass = classes.find((c) => c.name === k) ?? classes[0] ?? null;
    return { session, classes, klass, data: await fn(q, klass, session) };
  });
}
export const kq = (klass: GuruClass | null, classes: GuruClass[]) => (klass && classes.length > 1 ? `?k=${encodeURIComponent(klass.name)}` : "");
