import type { Metadata } from "next";
import Link from "next/link";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { ageText } from "@/components/ui/bits";
import { loadFamily } from "@/lib/family";
import { ChildClassForm } from "@/components/app/ChildClassForm";

export const metadata: Metadata = { title: "Daftarkan anak ke grup" };

/** CO-05. Full classes cannot be picked; the database enforces capacity as well. */
export default async function AnakGrup() {
  const session = await guard("/beranda/keluarga/anak-grup");
  if (!session) return null;
  const data = await asUser(session.userId, async (q) => {
    const family = await loadFamily(q, session.userId);
    const classes = await q<{ id: string; name: string; weekday: string; start: string; capacity: number }>(
      `select c.id, c.name, c.weekday, to_char(c.start_time, 'HH24.MI') start, c.capacity
         from public.sk_classes c join public.semesters s on s.id = c.semester_id and s.active order by c.name`);
    return { family, classes };
  });
  // RLS only shows a parent their own class membership, so headcounts come from class_load(); the database re-checks capacity on insert.
  const counts = await asUser(session.userId, (q) => q<{ class_id: string; n: string }>("select class_id, public.class_load(class_id)::text n from (select distinct id class_id from public.sk_classes) x"));
  const load = new Map(counts.map((c) => [c.class_id, Number(c.n)]));
  if (!data.family) return <div className="page-narrow"><div className="ghostbox">Keluarga belum terhubung.</div></div>;
  const current: Record<string, string> = {};
  if (data.family.klass) for (const c of data.family.children) current[c.id] = data.family.klass.id;
  return (
    <div className="page-narrow col g14">
      <div className="hdr"><Link className="back" href="/beranda/keluarga" aria-label="Kembali">‹</Link><h1 className="t">Daftarkan anak ke grup</h1></div>
      <ChildClassForm
        kids={data.family.children.map((c) => ({ id: c.id, name: c.name, age: ageText(c.dob) }))}
        classes={data.classes.map((c) => ({ id: c.id, name: c.name, when: `${c.weekday}, ${c.start}`, full: (load.get(c.id) ?? 0) >= c.capacity && current[data.family!.children[0]?.id ?? ""] !== c.id }))}
        current={current} />
    </div>
  );
}
