"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { saveLessonProgress } from "@/app/(app)/(shell)/sk/keluarga/actions";
import { useToast } from "@/components/ui/Toast";
import type { Scene, Step } from "@/lib/sk";

type Age = "1-2" | "2-3" | "3-4";
const AGES: Age[] = ["1-2", "2-3", "3-4"];
const narr = (s: Scene, a: Age) => (a === "1-2" ? s.n12 : a === "3-4" ? s.n34 : s.n23);
const KIND_LINK: Record<string, [string, string]> = { ayat: ["/sk/keluarga/ayat", "Buka bagian ini"], sharing: ["/sk/keluarga/sharing", "Buka bagian ini"], power: ["/sk/keluarga/power", "Buka bagian ini"], memory_marker: ["/sk/keluarga/memory-marker", "Buka bagian ini"] };

function SceneImage({ scene, src }: { scene: Scene; src: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={scene.title} style={{ transform: `scale(${scene.zoom})`, transformOrigin: scene.focus }} />;
}

/**
 * SK-04 to SK-06. All 24 steps are sent once; moving between them is instant and the position is saved in the background
 * with retries, so a dropped connection never loses progress or blocks the lesson.
 */
export function LessonPlayer({ lessonId, number, title, steps, scenes, initialStep, initialDone, mode, thumb, sceneSrc }: {
  lessonId: string; number: number; title: string; steps: Step[]; scenes: Scene[]; initialStep: number; initialDone: number; mode: "alur" | "cerita"; thumb: string; sceneSrc: Record<number, string>;
}) {
  const total = steps.length;
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(Math.min(initialStep, total - 1));
  const [age, setAge] = useState<Age>("2-3");
  const [fs, setFs] = useState(false);
  const [unsaved, setUnsaved] = useState(false);
  const complete = initialDone >= total;
  const q = `?pel=${number}`;

  // eslint-disable-next-line react-hooks/set-state-in-effect -- browser-only preference, read after mount to avoid hydration mismatch
  useEffect(() => { try { const a = localStorage.getItem("eunike.age"); if (a && (AGES as string[]).includes(a)) setAge(a as Age); } catch { /* storage blocked */ } }, []);
  const chooseAge = (a: Age) => { setAge(a); try { localStorage.setItem("eunike.age", a); } catch { /* ignore */ } };

  const latest = useRef<{ step: number; finished: boolean } | null>(null);
  const saving = useRef(false);
  const flush = useCallback(async () => {
    if (saving.current) return;
    saving.current = true;
    while (latest.current) {
      const job = latest.current; latest.current = null;
      let okSave = false;
      for (let attempt = 0; attempt < 4 && !okSave; attempt++) {
        try { const r = await saveLessonProgress(lessonId, job.step, job.finished); okSave = r.ok; } catch { okSave = false; }
        if (!okSave) await new Promise((r) => setTimeout(r, 800 * 2 ** attempt));
      }
      setUnsaved(!okSave);
      if (!okSave && !latest.current) latest.current = job; // keep trying on the next move
      if (!okSave) break;
    }
    saving.current = false;
  }, [lessonId]);
  const save = useCallback((s: number, finished = false) => { latest.current = { step: s, finished }; void flush(); }, [flush]);
  useEffect(() => { const online = () => { if (latest.current) void flush(); }; window.addEventListener("online", online); return () => window.removeEventListener("online", online); }, [flush]);

  const cur = steps[step];
  const scene = cur?.kind === "story" && cur.story_scene ? scenes.find((s) => s.position === cur.story_scene) : undefined;
  const storyIdx = steps.filter((s) => s.kind === "story");

  const move = (d: 1 | -1) => {
    const n = step + d;
    if (n < 0) return;
    if (n >= total) { save(total - 1, true); router.push(`/sk/keluarga/selesai${q}`); return; }
    setStep(n); save(n);
    // leaving the story steps from the big story screen goes back to the flow
    if (mode === "cerita" && steps[n].kind !== "story") router.push(`/sk/keluarga/alur${q}`);
  };

  // fullscreen (best effort: Fullscreen API + landscape lock where the browser allows it)
  const openFs = () => {
    setFs(true);
    try { void document.documentElement.requestFullscreen?.().then(() => (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.("landscape").catch(() => undefined)).catch(() => undefined); } catch { /* not supported */ }
  };
  const closeFs = useCallback(() => { setFs(false); try { if (document.fullscreenElement) void document.exitFullscreen(); } catch { /* ignore */ } }, []);
  useEffect(() => {
    if (!fs) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeFs(); };
    const onFs = () => { if (!document.fullscreenElement) setFs(false); };
    document.addEventListener("keydown", onKey); document.addEventListener("fullscreenchange", onFs);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("fullscreenchange", onFs); };
  }, [fs, closeFs]);
  useEffect(() => { if (unsaved) toast("Kemajuan belum tersimpan. Kami coba lagi saat tersambung.", "err"); }, [unsaved, toast]);

  const ages = (
    <div className="pills" role="radiogroup" aria-label="Usia anak">
      {AGES.map((a) => <button key={a} type="button" role="radio" aria-checked={age === a} className={`pill${age === a ? " on" : ""}`} onClick={() => chooseAge(a)}>{a.replace("-", "–")}</button>)}
    </div>
  );
  const nav = (
    <div className="row">
      <button type="button" className="btn ghost grow" disabled={step === 0} onClick={() => move(-1)}>‹ Sebelumnya</button>
      <button type="button" className="btn red grow" onClick={() => move(1)}>{step === total - 1 ? "Selesai" : "Lanjut"} ›</button>
    </div>
  );

  if (mode === "cerita") {
    const s = scene ?? scenes[2] ?? scenes[0];
    if (!s) return <div className="ghostbox">Pelajaran ini belum punya cerita.</div>;
    const idx = Math.max(storyIdx.findIndex((x) => x.position === cur?.position), 0);
    return (
      <div className="col g14">
        <div className="hdr"><Link className="back" href={`/sk/keluarga/alur${q}`} aria-label="Kembali ke alur">‹</Link><h1 className="t">Cerita Alkitab<small>Pelajaran {number} · {title}</small></h1></div>
        <div className="storywrap">
          <div className="story-img"><SceneImage scene={s} src={sceneSrc[s.position]} /><button type="button" className="exp" onClick={openFs} aria-label="Buka layar penuh">⤢</button></div>
          <div className="col">
            <div className="row">{ages}<span className="small muted" style={{ fontWeight: 800, whiteSpace: "nowrap" }}>Adegan {idx + 1} dari {storyIdx.length || 5}</span></div>
            <div className="narr" aria-live="polite"><b>{s.title}</b>{narr(s, age)}</div>
            {nav}
          </div>
        </div>
        {fs ? (
          <div className="fs" role="dialog" aria-modal="true" aria-label="Cerita layar penuh">
            <button type="button" className="min" onClick={closeFs}>⤡ Perkecil</button>
            <div className="fsimg"><SceneImage scene={s} src={sceneSrc[s.position]} /></div>
            <div className="panel">{ages}<div className="small muted mt8" style={{ fontWeight: 800 }}>Adegan {idx + 1} dari {storyIdx.length || 5}</div>
              <div className="mt8"><b style={{ fontFamily: "var(--font-baloo), 'Baloo 2'", fontSize: 19, color: "#5b2590" }}>{s.title}</b></div><div className="mt8">{narr(s, age)}</div></div>
            <div className="rot"><div className="ph" aria-hidden="true">📱</div><h2 className="h2" style={{ color: "#fff" }}>Putar HP ke horizontal</h2><div style={{ opacity: 0.8 }}>Agar gambar cerita tampil besar.</div>
              <button type="button" className="btn ghost sm" onClick={closeFs}>Lanjut tanpa memutar</button></div>
          </div>
        ) : null}
      </div>
    );
  }

  const strip = steps.map((_, i) => <i key={i} className={complete || i < step ? "d" : i === step ? "c" : undefined} />);
  const [kindHref, kindLabel] = cur ? KIND_LINK[cur.kind] ?? [] : [];
  return (
    <div className="col g14">
      <div className="hdr"><Link className="back" href={`/sk/keluarga${q}`} aria-label="Kembali ke beranda">‹</Link><h1 className="t" style={{ fontSize: 20 }}>Pelajaran {number} · {title}</h1></div>
      <div className="strip" role="img" aria-label={`Langkah ${step + 1} dari ${total}`}>{strip}</div>
      <div className="row between small" style={{ fontWeight: 800, color: "var(--purple)" }}>
        <span>Langkah {step + 1} dari {total}</span>
        <span className="muted">{scene ? `Cerita Alkitab · ${storyIdx.findIndex((x) => x.position === cur.position) + 1} dari ${storyIdx.length}` : cur?.title}</span>
      </div>
      {cur ? (
        scene ? (
          <section className="card"><h2 className="h2">Cerita Alkitab</h2>
            <Link className="story-img mt8" href={`/sk/keluarga/cerita${q}`} style={{ display: "block" }}><SceneImage scene={scene} src={sceneSrc[scene.position]} /><span className="exp" aria-hidden="true" style={{ display: "flex" }}>⤢</span></Link>
            <p className="mt8" style={{ fontSize: 17, lineHeight: 1.5 }}>{narr(scene, age)}</p>
            <div className="mt8"><Link className="btn ghost sm" href={`/sk/keluarga/cerita${q}`}>Buka cerita besar</Link></div></section>
        ) : (
          <section className="card"><h2 className="h2">{cur.title}</h2>
            <div className="story-img mt8" style={{ aspectRatio: "16/8" }}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={thumb} alt="" style={{ objectPosition: "center" }} /></div>
            <p className="mt8" style={{ fontSize: 17, lineHeight: 1.5 }}>{cur.body}</p>
            {cur.kind === "video" ? (cur.video_url ? <div className="mt8"><a className="btn ghost sm" href={cur.video_url} target="_blank" rel="noreferrer">▶ Tonton video</a></div> : null) : null}
            {kindHref ? <div className="mt8"><Link className="btn ghost sm" href={`${kindHref}${q}`}>{kindLabel}</Link></div> : null}</section>
        )
      ) : <div className="ghostbox">Pelajaran ini belum punya langkah.</div>}
      {nav}
    </div>
  );
}
