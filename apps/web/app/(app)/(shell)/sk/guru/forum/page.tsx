import type { Metadata } from "next";
import Link from "next/link";
import { loadGuru } from "@/lib/guru";
import { listLessons, pickLesson } from "@/lib/sk";
import { Badge, Empty } from "@/components/ui/bits";
import { ClassSwitch } from "@/components/app/ClassSwitch";
import { ForumBoard, type FPost } from "@/components/app/GuruClients";

export const metadata: Metadata = { title: "Forum kelas" };

/** GU-04: pin and hide (hidden posts vanish for parents; the guru sees them with Restore), reply bar. */
export default async function Forum({ searchParams }: { searchParams: Promise<{ k?: string; pel?: string }> }) {
  const sp = await searchParams;
  const ctx = await loadGuru("/sk/guru/forum", sp.k, async (q, klass) => {
    const lessons = await listLessons(q);
    const lesson = pickLesson(lessons, sp.pel);
    if (!klass || !lesson) return { lessons, lesson, posts: [] as FPost[] };
    const posts = await q<FPost>("select id, kind, author, body, pinned, hidden, likes, created_at::text at from public.class_feed($1, $2)", [klass.id, lesson.id]);
    return { lessons, lesson, posts };
  });
  if (!ctx) return null;
  const { classes, klass, data } = ctx;
  if (!klass || !data.lesson) return <Empty>Anda belum ditugaskan ke kelas mana pun.</Empty>;
  const kk = classes.length > 1 ? `&k=${encodeURIComponent(klass.name)}` : "";
  return (
    <div className="theme-sk page-narrow col g14">
      <div className="hdr"><Link className="back" href="/sk/guru" aria-label="Kembali">‹</Link><h1 className="t">Forum · Kelas {klass.name}<small><Badge kind="need">SK Batita</Badge> <Badge kind="interview">Guru SK</Badge></small></h1></div>
      <ClassSwitch classes={classes} current={klass} base="/sk/guru/forum" />
      <section className="card"><h2 className="h3">Pelajaran {data.lesson.number}: {data.lesson.title}</h2>
        <nav className="pills mt8" aria-label="Pilih pelajaran">{data.lessons.map((l) => <Link key={l.id} className={`pill${l.number === data.lesson?.number ? " on" : ""}`} href={`/sk/guru/forum?pel=${l.number}${kk}`}>Pel. {l.number}</Link>)}</nav></section>
      <ForumBoard key={`${klass.id}-${data.lesson.id}`} classId={klass.id} lessonId={data.lesson.id} posts={data.posts} />
    </div>
  );
}
