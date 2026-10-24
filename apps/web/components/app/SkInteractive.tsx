"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { likePost, postSharing, saveAyat, saveLessonProgress, savePower } from "@/app/(app)/(shell)/sk/keluarga/actions";
import { useRun } from "@/components/ui/Toast";
import { ProgressBar } from "@/components/ui/bits";

const NAMES = ["Baca bersama", "Ulangi tiga kali", "Ucapkan dari hati"];

export function AyatClient({ lessonId, text, reference, items: init, memorized: mem }: { lessonId: string; text: string; reference: string; items: boolean[]; memorized: boolean }) {
  const [items, setItems] = useState(init);
  const [memorized, setMemorized] = useState(mem);
  const { run, pending } = useRun();
  const n = items.filter(Boolean).length;
  const toggle = (i: number) => { const next = items.map((v, k) => (k === i ? !v : v)); setItems(next); void saveAyat(lessonId, next, memorized && next.every(Boolean)); if (memorized && !next.every(Boolean)) setMemorized(false); };
  return (
    <div className="col g14">
      <div className="card center"><p className="h1" style={{ fontSize: 27, lineHeight: 1.15 }}>{text}</p><div className="muted mt8" style={{ fontWeight: 800 }}>{reference}</div></div>
      {NAMES.map((t, i) => (
        <button key={t} type="button" role="checkbox" aria-checked={items[i]} className="checkrow" onClick={() => toggle(i)}><span className={`cb${items[i] ? " on" : ""}`} aria-hidden="true">{items[i] ? "✓" : ""}</span>{t}</button>
      ))}
      <div className="row"><b className="purple">{n} dari 3</b><div className="grow"><ProgressBar value={(n / 3) * 100} label="Kemajuan ayat" /></div></div>
      <button type="button" className="btn red block" disabled={pending} onClick={() => { setItems([true, true, true]); setMemorized(true); run(() => saveAyat(lessonId, [true, true, true], true), { refresh: false }); }}>{memorized ? "✓ Sudah dihafal" : "Tandai sudah dihafal"}</button>
    </div>
  );
}

export function PowerClient({ lessonId, labels, items: init }: { lessonId: string; labels: string[]; items: boolean[] }) {
  const [items, setItems] = useState(init.length === 3 ? init : [false, false, false]);
  const { run, pending } = useRun();
  const n = items.filter(Boolean).length;
  const toggle = (i: number) => { const next = items.map((v, k) => (k === i ? !v : v)); setItems(next); void savePower(lessonId, next); };
  return (
    <div className="col g14">
      <div className="banner info">Pilih tindakan kecil yang keluarga lakukan minggu ini.</div>
      {labels.map((t, i) => (
        <button key={t} type="button" role="checkbox" aria-checked={items[i]} className="checkrow" onClick={() => toggle(i)}><span className={`cb${items[i] ? " on" : ""}`} aria-hidden="true">{items[i] ? "✓" : ""}</span>{t}</button>
      ))}
      <div className="row"><b className="purple">{n} dari {labels.length} selesai</b><div className="grow"><ProgressBar value={(n / Math.max(labels.length, 1)) * 100} label="Kemajuan PoWeR" /></div></div>
      <button type="button" className="btn red block" disabled={pending} onClick={() => run(() => savePower(lessonId, items), { refresh: false })}>Simpan</button>
    </div>
  );
}

export interface FeedItem { id: string; kind: "post" | "reply"; author: string; body: string; pinned: boolean; likes: number; liked: boolean }
export function SharingClient({ lessonId, prompt, feed, className }: { lessonId: string; prompt: string; feed: FeedItem[]; className: string | null }) {
  const [t, setT] = useState("");
  const { run, pending } = useRun();
  return (
    <div className="col g14">
      <section className="card">
        <h2 className="h2" style={{ fontSize: 22 }}>{prompt}</h2>
        <div className="mt8"><label className="sr-only" htmlFor="sh">Cerita keluarga Anda</label><textarea id="sh" className="ta" placeholder="Tulis cerita keluarga Anda..." value={t} onChange={(e) => setT(e.target.value)} maxLength={2000} /></div>
        <div className="mt8"><button type="button" className="btn red block" disabled={pending} onClick={() => run(() => postSharing(lessonId, t), { after: (r) => { if (r && r.ok) setT(""); } })}>Kirim</button></div>
      </section>
      <h2 className="h2">Cerita keluarga</h2>
      {feed.length === 0 ? <div className="ghostbox">Belum ada cerita. Jadilah yang pertama.</div> : feed.map((p) => (
        <div key={p.id} className="post">
          <div className="avatar lilac" aria-hidden="true">{p.author.replace("Keluarga ", "").charAt(0)}</div>
          <div className="grow">
            <b className="purple">{p.author}</b>{p.pinned ? <span className="badge b-baru" style={{ marginLeft: 8 }}>📌 Tersemat</span> : null}
            <div className="small mt8" style={{ whiteSpace: "pre-wrap" }}>{p.body}</div>
            {p.kind === "post" ? <button type="button" className="chip sm mt8" disabled={p.liked || pending} aria-pressed={p.liked} onClick={() => run(() => likePost(p.id))}>👍 Ikut bersukacita {p.likes}</button> : null}
          </div>
        </div>
      ))}
      <div className="small muted center">🔒 Hanya keluarga di {className ? `Kelas ${className}` : "kelas Anda"} yang melihat ini.</div>
    </div>
  );
}

export function FinishButtons({ lessonId, q }: { lessonId: string; q: string }) {
  const router = useRouter();
  const { run, pending } = useRun();
  return (
    <button type="button" className="btn purple block" disabled={pending} onClick={() => run(async () => { await saveLessonProgress(lessonId, 0, false); }, { refresh: false, after: () => router.push(`/sk/keluarga/alur${q}`) })}>Tinjau pelajaran</button>
  );
}
