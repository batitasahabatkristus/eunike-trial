import type { Metadata } from "next";
import Link from "next/link";
import { loadGuru } from "@/lib/guru";
import { listLessons, pickLesson } from "@/lib/sk";
import { idDateTime, Badge, Banner, Empty } from "@/components/ui/bits";
import { ClassSwitch } from "@/components/app/ClassSwitch";
import { MarkRead, WhatsAppMama } from "@/components/app/GuruClients";

export const metadata: Metadata = { title: "Memory Marker kelas" };

interface M { id: string; family: string; wa: string | null; child: string; at: string; q1: string; q2: string; q3: string; q4: string; love: string[]; faith: boolean; couch: boolean; is_new: boolean; files: { path: string; mime: string }[] }

/** GU-03. Only this teacher's classes arrive here (RLS); files come through the permission-checked file route. */
export default async function GuruMm({ searchParams }: { searchParams: Promise<{ k?: string; pel?: string }> }) {
  const sp = await searchParams;
  const ctx = await loadGuru("/sk/guru/memory-marker", sp.k, async (q, klass) => {
    const lessons = await listLessons(q);
    const lesson = pickLesson(lessons, sp.pel);
    if (!klass || !lesson) return { lessons, lesson, list: [] as M[] };
    const list = await q<M>(
      `select m.id, f.name family, f.wa_number wa, ch.name child, m.created_at::text at, m.q1, m.q2, m.q3, m.q4, m.love_in_action love, m.faith_talk faith, m.couch_time couch, m.is_new,
              coalesce((select json_agg(json_build_object('path', x.storage_path, 'mime', x.mime) order by x.created_at) from public.memory_marker_files x where x.marker_id = m.id), '[]'::json) files
         from public.memory_markers m join public.families f on f.id = m.family_id join public.children ch on ch.id = m.child_id
         join public.sk_class_members cm on cm.family_id = m.family_id and cm.class_id = $1
        where m.lesson_id = $2 order by m.is_new desc, m.created_at desc`, [klass.id, lesson.id]);
    return { lessons, lesson, list };
  });
  if (!ctx) return null;
  const { classes, klass, data } = ctx;
  if (!klass) return <Empty>Anda belum ditugaskan ke kelas mana pun.</Empty>;
  const kk = classes.length > 1 ? `&k=${encodeURIComponent(klass.name)}` : "";
  return (
    <div className="theme-sk page-narrow col g14">
      <div className="hdr"><Link className="back" href="/sk/guru" aria-label="Kembali">‹</Link><h1 className="t">Memory Marker · Kelas {klass.name}<small><Badge kind="need">SK</Badge> <Badge kind="interview">Guru SK</Badge></small></h1></div>
      <ClassSwitch classes={classes} current={klass} base="/sk/guru/memory-marker" />
      <nav className="pills" aria-label="Pilih pelajaran">{data.lessons.map((l) => <Link key={l.id} className={`pill${l.number === data.lesson?.number ? " on" : ""}`} href={`/sk/guru/memory-marker?pel=${l.number}${kk}`}>Pel. {l.number}</Link>)}</nav>
      {data.lesson ? <Banner kind="info">Pelajaran {data.lesson.number}: {data.lesson.title}</Banner> : null}
      {data.list.length === 0 ? <Empty>Belum ada Memory Marker untuk pelajaran ini.</Empty> : data.list.map((m) => {
        const img = m.files.find((f) => f.mime.startsWith("image/"));
        return (
          <article key={m.id} className="card row" style={{ alignItems: "flex-start" }}>
            <div style={{ position: "relative", flex: "none" }}>
              {img ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={`/api/files/memory-markers/${img.path}`} alt={`Foto dari Keluarga ${m.family}`} style={{ width: 92, height: 92, objectFit: "cover", borderRadius: 14 }} />
                : <div className="photo" style={{ width: 92, height: 92 }} aria-hidden="true">{m.files.length ? "▶" : "—"}</div>}
              {m.files.length > 1 ? <span className="badge b-ok" style={{ position: "absolute", right: 4, bottom: 4 }}>+{m.files.length - 1}</span> : null}
            </div>
            <div className="grow">
              <div className="row between"><b className="purple">Keluarga {m.family}</b>{m.is_new ? <Badge kind="baru">Baru</Badge> : null}</div>
              <div className="small muted"><b>{m.child}</b> · {idDateTime(m.at)}</div>
              <div className="small mt8">{m.q1 || <span className="muted">Tanpa catatan</span>}</div>
              <details className="small mt8"><summary style={{ cursor: "pointer", fontWeight: 800, color: "var(--purple)", minHeight: 32 }}>Jawaban lengkap</summary>
                {[m.q2, m.q3, m.q4].filter(Boolean).map((t, i) => <p key={i} style={{ margin: "6px 0" }}>{t}</p>)}
                <p style={{ margin: "6px 0" }}>Love in Action: {m.love.join(", ") || "-"} · Faith Talk: {m.faith ? "ya" : "belum"} · Couch Time: {m.couch ? "ya" : "belum"}</p>
                {m.files.filter((f) => f.mime.startsWith("video/")).map((f) => <p key={f.path} style={{ margin: "6px 0" }}><a href={`/api/files/memory-markers/${f.path}`} target="_blank" rel="noreferrer">▶ Putar video</a></p>)}
              </details>
              <div className="row mt8 wrap"><WhatsAppMama markerId={m.id} wa={m.wa} family={m.family} isNew={m.is_new} />{m.is_new ? <MarkRead markerId={m.id} /> : null}</div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
