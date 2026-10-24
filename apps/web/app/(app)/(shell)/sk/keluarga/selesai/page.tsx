import type { Metadata } from "next";
import Link from "next/link";
import { loadSkPage } from "@/lib/sk-page";
import { assetUrl } from "@/lib/sk";
import { Badge, Empty } from "@/components/ui/bits";
import { FinishButtons } from "@/components/app/SkInteractive";

export const metadata: Metadata = { title: "Pelajaran selesai" };

/** SK-10 */
export default async function Selesai({ searchParams }: { searchParams: Promise<{ pel?: string }> }) {
  const ctx = await loadSkPage("/sk/keluarga/selesai", (await searchParams).pel);
  if (!ctx) return null;
  const { lesson, lessons } = ctx;
  if (!lesson) return <Empty>Belum ada pelajaran yang terbit.</Empty>;
  const q = `?pel=${lesson.number}`;
  return (
    <div className="col g14" style={{ paddingTop: 12 }}>
      <section className="card center">
        <div style={{ fontSize: 64 }} aria-hidden="true">🏅</div><Badge kind="ok">Sudah dikerjakan</Badge>
        <h1 className="h1 mt8" style={{ fontSize: 30 }}>Hebat! Pelajaran {lesson.number} sudah selesai.</h1>
        <p className="muted mt8">Satu langkah kecil lagi: abadikan momen keluarga.</p>
      </section>
      <FinishButtons lessonId={lesson.id} q={q} />
      <Link className="btn red block" href={`/sk/keluarga/memory-marker${q}`}>Kirim Memory Marker</Link>
      <Link className="btn ghost block" href="/sk/keluarga">Kembali ke Beranda</Link>
      <nav className="lstrip" aria-label="Pelajaran lain">
        {lessons.map((l) => (
          <Link key={l.id} href={`/sk/keluarga?pel=${l.number}`} className={`lit${l.number === lesson.number ? " on" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetUrl(l.thumbnail_path)} alt="" width={110} height={68} loading="lazy" /><div className="n">Pel. {l.number}</div><div className="s">{l.short_title}</div>
          </Link>
        ))}
      </nav>
    </div>
  );
}
