import "server-only";
import { guard, type Session } from "@/lib/auth/session";
import { asUser, type Q } from "@/lib/db";
import { loadFamily, type FamilyCtx } from "@/lib/family";
import { loadBundle, listLessons, pickLesson, loadProgress, type LessonBundle, type LessonLite, type Progress } from "@/lib/sk";

export interface SkPage { session: Session; family: FamilyCtx | null; lessons: LessonLite[]; lesson: LessonBundle | null; progress: Progress }

/** Shared loader for every /sk/keluarga screen: the parent's family, the published lessons, the chosen lesson and its progress. */
export async function loadSkPage<T = undefined>(path: string, pel: string | undefined, extra?: (q: Q, ctx: { family: FamilyCtx | null; lesson: LessonBundle | null }) => Promise<T>): Promise<(SkPage & { extra: T }) | null> {
  const session = await guard(path);
  if (!session) return null;
  const out = await asUser(session.userId, async (q) => {
    const family = await loadFamily(q, session.userId);
    const lessons = await listLessons(q);
    const pick = pickLesson(lessons, pel);
    const lesson = pick ? await loadBundle(q, pick.id) : null;
    const progress = family && lesson ? await loadProgress(q, family.id, lesson.id) : { step: 0, done: 0 };
    const ex = extra ? await extra(q, { family, lesson }) : (undefined as T);
    return { family, lessons, lesson, progress, extra: ex };
  });
  return { session, ...out };
}
