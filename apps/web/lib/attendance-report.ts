import type { Q } from "@/lib/db";
import { isYmd, todayJakarta } from "@/lib/dates";

export interface Matrix { dates: string[]; rows: { family: string; klass: string; cells: ("in" | "out" | null)[]; total: number }[]; stats: { in: number; out: number; none: number }; semester: string; klass: string; classes: string[]; semesters: { id: string; label: string }[]; semesterId: string }

/** AD-02. Used by the page and by both exports, so a file always equals what the screen shows under the same filters. */
export async function loadMatrix(q: Q, f: { semester?: string; klass?: string; date?: string }): Promise<Matrix> {
  const semesters = await q<{ id: string; label: string; active: boolean }>("select id, label, active from public.semesters order by starts_on desc");
  const sem = semesters.find((s) => s.id === f.semester) ?? semesters.find((s) => s.active) ?? semesters[0];
  const classes = (await q<{ name: string }>("select name from public.sk_classes where semester_id = $1 order by name", [sem?.id])).map((c) => c.name);
  const klass = f.klass && classes.includes(f.klass) ? f.klass : "Semua";
  const today = todayJakarta();
  const meetings = await q<{ held_on: string; class_name: string; id: string }>(
    `select mt.held_on::text, c.name class_name, mt.id from public.sk_meetings mt join public.sk_classes c on c.id = mt.class_id
      where c.semester_id = $1 and mt.held_on <= $2::date and ($3 = 'Semua' or c.name = $3) order by mt.held_on`, [sem?.id, today, klass]);
  let dates = [...new Set(meetings.map((m) => m.held_on))];
  if (isYmd(f.date)) dates = dates.filter((d) => d === f.date);
  const fam = await q<{ id: string; name: string; klass: string }>(
    `select f.id, f.name, c.name klass from public.sk_class_members m join public.families f on f.id = m.family_id join public.sk_classes c on c.id = m.class_id
      where c.semester_id = $1 and ($2 = 'Semua' or c.name = $2) order by c.name, f.name`, [sem?.id, klass]);
  const att = await q<{ family_id: string; held_on: string; status: "in" | "out" | null }>(
    `select a.family_id, mt.held_on::text, a.status from public.sk_attendance a join public.sk_meetings mt on mt.id = a.meeting_id join public.sk_classes c on c.id = mt.class_id
      where a.kind = 'family' and c.semester_id = $1`, [sem?.id]);
  const idx = new Map(att.map((a) => [`${a.family_id}|${a.held_on}`, a.status]));
  const held = new Set(meetings.map((m) => `${m.class_name}|${m.held_on}`));
  const stats = { in: 0, out: 0, none: 0 };
  const rows = fam.map((f2) => {
    const cells = dates.map((d) => { const s = idx.get(`${f2.id}|${d}`) ?? null; if (held.has(`${f2.klass}|${d}`)) stats[s ?? "none"]++; return s; });
    return { family: f2.name, klass: f2.klass, cells, total: cells.filter((c) => c === "in").length };
  });
  return { dates, rows, stats, semester: sem?.label ?? "", klass, classes, semesters: semesters.map((s) => ({ id: s.id, label: s.label })), semesterId: sem?.id ?? "" };
}
export const pctOf = (m: Matrix["stats"]) => { const t = m.in + m.out + m.none || 1; return { in: Math.round((m.in / t) * 100), out: Math.round((m.out / t) * 100), none: Math.round((m.none / t) * 100) }; };
