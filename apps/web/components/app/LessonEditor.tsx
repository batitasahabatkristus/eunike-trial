"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { prepareAssetUpload, saveLesson, sendForReview } from "@/app/(app)/(shell)/sk/kurikulum/actions";
import { completeness, type LessonPayload } from "@/lib/lesson-schema";
import { putFile } from "@/lib/upload-client";
import { assetUrl } from "@/lib/sk";
import { useRun, useToast } from "@/components/ui/Toast";
import { Badge, Banner } from "@/components/ui/bits";
import { STATUS } from "@/components/app/MaterialTable";

type Scene = LessonPayload["scenes"][number];
type Step = LessonPayload["steps"][number];
const KINDS: [Step["kind"], string][] = [["text", "Teks"], ["video", "Video"], ["story", "Cerita"], ["ayat", "Ayat"], ["sharing", "Sharing"], ["power", "PoWeR"], ["memory_marker", "Memory Marker"]];
const AGES = [["n12", "Narasi 1–2"], ["n23", "Narasi 2–3"], ["n34", "Narasi 3–4"]] as const;
const blankScene = (n: number): Scene => ({ title: `Adegan ${n}`, image_path: null, zoom: 1, focus: "50% 50%", n12: "", n23: "", n34: "" });

function ImageField({ lessonId, value, onChange, label, disabled }: { lessonId: string; value: string | null; onChange: (p: string | null) => void; label: string; disabled: boolean }) {
  const toast = useToast();
  const [pct, setPct] = useState<number | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const pick = async (f: File | undefined) => {
    if (!f) return;
    setPreview(URL.createObjectURL(f)); setPct(0);
    try {
      const t = await prepareAssetUpload(lessonId, f.name, f.type, f.size);
      if (!t.ok) throw new Error(t.message);
      await putFile(t, f, setPct);
      onChange(t.path!);
    } catch (e) { toast(e instanceof Error ? e.message : "Unggahan gagal.", "err"); setPreview(null); }
    setPct(null);
    if (input.current) input.current.value = "";
  };
  const src = preview ?? (value ? assetUrl(value) : null);
  return (
    <div className="field"><span className="lbl">{label}</span>
      <div className="drop center muted" style={{ padding: 12 }}>
        {src /* eslint-disable-next-line @next/next/no-img-element */ ? <img src={src} alt={label} style={{ maxHeight: 120, maxWidth: "100%", borderRadius: 12, margin: "0 auto 8px", display: "block" }} /> : <div style={{ padding: "10px 0" }}>🖼 Belum ada gambar</div>}
        {pct !== null ? <div className="prog" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Mengunggah ${label}`}><i style={{ width: `${pct}%` }} /></div> : null}
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" hidden aria-label={`Pilih ${label}`} onChange={(e) => void pick(e.target.files?.[0])} />
        <div className="row" style={{ justifyContent: "center" }}>
          <button type="button" className="btn ghost sm" disabled={disabled || pct !== null} onClick={() => input.current?.click()}>{value ? "Ganti gambar" : "Unggah gambar"}</button>
          {value && !disabled ? <button type="button" className="btn text sm" onClick={() => { onChange(null); setPreview(null); }}>Hapus</button> : null}
        </div>
      </div>
    </div>
  );
}

export function LessonEditor({ lessonId, initial, status, adminNote, editable }: { lessonId: string; initial: LessonPayload; status: string; adminNote: string | null; editable: boolean }) {
  const router = useRouter();
  const { run, pending } = useRun();
  const [d, setD] = useState<LessonPayload>(initial);
  const [tab, setTab] = useState<"umum" | "cerita" | "alur" | "power">("umum");
  const [sceneIdx, setSceneIdx] = useState(0);
  const [age, setAge] = useState<"n12" | "n23" | "n34">("n12");
  const [note, setNote] = useState(!!adminNote);
  const [saveState, setSaveState] = useState<"saved" | "dirty" | "saving" | "error">("saved");
  const first = useRef(true);
  const lastJson = useRef(JSON.stringify(initial));
  const set = <K extends keyof LessonPayload>(k: K, v: LessonPayload[K]) => setD((x) => ({ ...x, [k]: v }));
  const missing = useMemo(() => completeness(d), [d]);

  // KU-02 autosave: 1.5 s after the last change, drafts only
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    const json = JSON.stringify(d);
    if (!editable || json === lastJson.current) return;
    setSaveState("dirty");
    const t = setTimeout(async () => {
      setSaveState("saving");
      try { const r = await saveLesson(lessonId, d); if (r.ok) { lastJson.current = json; setSaveState("saved"); } else setSaveState("error"); } catch { setSaveState("error"); }
    }, 1500);
    return () => clearTimeout(t);
  }, [d, editable, lessonId]);
  useEffect(() => { const h = (e: BeforeUnloadEvent) => { if (saveState === "dirty" || saveState === "saving") e.preventDefault(); }; window.addEventListener("beforeunload", h); return () => window.removeEventListener("beforeunload", h); }, [saveState]);

  const scene = d.scenes[sceneIdx];
  const setScene = (p: Partial<Scene>) => set("scenes", d.scenes.map((s, i) => (i === sceneIdx ? { ...s, ...p } : s)));
  const setStep = (i: number, p: Partial<Step>) => set("steps", d.steps.map((s, k) => (k === i ? { ...s, ...p } : s)));
  const move = (i: number, dir: -1 | 1) => { const n = i + dir; if (n < 0 || n >= d.steps.length) return; const a = [...d.steps]; [a[i], a[n]] = [a[n], a[i]]; set("steps", a); };
  const [fx, fy] = (scene?.focus ?? "50% 50%").split(" ").map((x) => parseInt(x, 10));
  const [stLabel, stKind] = STATUS[status] ?? ["Draf", "draft"];

  return (
    <div className="col g14">
      <div className="row between wrap">
        <div className="row"><Badge kind={stKind}>{stLabel}</Badge><span className="small muted" aria-live="polite">{!editable ? "Hanya baca" : saveState === "saving" ? "Menyimpan…" : saveState === "dirty" ? "Belum tersimpan" : saveState === "error" ? "Gagal menyimpan, coba lagi" : "✓ Tersimpan"}</span></div>
        <div className="row wrap">
          <button type="button" className="btn ghost sm" disabled={!editable || pending} onClick={() => run(async () => { const r = await saveLesson(lessonId, d); if (r.ok) { lastJson.current = JSON.stringify(d); setSaveState("saved"); return { ok: true, message: "Draf tersimpan" }; } return r; }, { refresh: false })}>Simpan draf</button>
          <button type="button" className="btn purple sm" disabled={!editable || pending} onClick={() => run(() => sendForReview(lessonId, d), { after: (r) => { if (r && r.ok) router.push("/sk/kurikulum"); } })}>Kirim ke admin untuk ditinjau</button>
        </div>
      </div>
      {!editable ? <Banner kind="warn">ℹ Materi ini {status === "review" ? "sedang ditinjau admin" : status === "scheduled" ? "sudah dijadwalkan" : "sudah terbit"} dan tidak dapat diedit.</Banner> : null}
      {adminNote && note ? <Banner kind="warn">ℹ <span><b>Catatan admin:</b> {adminNote} <button type="button" className="btn text sm" onClick={() => setNote(false)}>Tutup</button></span></Banner> : null}
      {editable && missing.length ? <div className="small muted" role="status">Sebelum dikirim, lengkapi: {missing.join(", ")}.</div> : null}

      <div className="g21">
        <fieldset disabled={!editable} style={{ border: 0, padding: 0, margin: 0, minWidth: 0 }} className="col g14">
          <div className="tabs2" role="tablist">{([["umum", "Umum"], ["cerita", "Cerita (5 adegan)"], ["alur", `Alur (${d.steps.length}/24)`], ["power", "PoWeR"]] as const).map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "on" : undefined} onClick={() => setTab(k)}>{l}</button>)}</div>

          {tab === "umum" ? (
            <div className="col g14">
              <div className="grid2"><div className="field"><label htmlFor="e-title">Judul</label><input id="e-title" className="inp" value={d.title} maxLength={120} onChange={(e) => set("title", e.target.value)} /></div>
                <div className="field"><label htmlFor="e-num">Nomor</label><input id="e-num" className="inp" type="number" min={1} value={d.number} onChange={(e) => set("number", Number(e.target.value) || 1)} /></div></div>
              <div className="grid2"><div className="field"><label htmlFor="e-short">Judul pendek (kartu pelajaran)</label><input id="e-short" className="inp" value={d.short_title} maxLength={40} onChange={(e) => set("short_title", e.target.value)} /></div>
                <div className="field"><label htmlFor="e-date">Tanggal terbit (WIB)</label><input id="e-date" className="inp" type="datetime-local" value={d.publish_local ?? ""} onChange={(e) => set("publish_local", e.target.value || null)} /></div></div>
              <div className="field"><label htmlFor="e-truth">Kebenaran (subjudul)</label><input id="e-truth" className="inp" value={d.truth} maxLength={200} onChange={(e) => set("truth", e.target.value)} /></div>
              <div className="field"><label htmlFor="e-goal">Tujuan belajar</label><input id="e-goal" className="inp" value={d.goal} maxLength={300} onChange={(e) => set("goal", e.target.value)} /></div>
              <div className="grid2"><div className="field"><label htmlFor="e-verse">Ayat hafalan</label><textarea id="e-verse" className="ta" value={d.verse_text} maxLength={500} onChange={(e) => set("verse_text", e.target.value)} /></div>
                <div className="field"><label htmlFor="e-ref">Rujukan ayat</label><input id="e-ref" className="inp" value={d.verse_ref} maxLength={60} onChange={(e) => set("verse_ref", e.target.value)} /></div></div>
              <ImageField lessonId={lessonId} label="Thumbnail" value={d.thumbnail_path} onChange={(p) => set("thumbnail_path", p)} disabled={!editable} />
            </div>
          ) : null}

          {tab === "cerita" ? (
            <div className="col g14">
              <div className="chips" role="tablist" aria-label="Adegan">{d.scenes.map((s, i) => <button key={i} type="button" role="tab" aria-selected={i === sceneIdx} className={`chip${i === sceneIdx ? " on" : ""}`} onClick={() => setSceneIdx(i)}>{i + 1}. {s.title.slice(0, 18)}</button>)}
                {d.scenes.length < 5 ? <button type="button" className="chip" onClick={() => { set("scenes", [...d.scenes, blankScene(d.scenes.length + 1)]); setSceneIdx(d.scenes.length); }}>＋ Tambah adegan</button> : null}</div>
              {scene ? (
                <div className="col g14">
                  <div className="field"><label htmlFor="s-title">Judul adegan {sceneIdx + 1}</label><input id="s-title" className="inp" value={scene.title} maxLength={120} onChange={(e) => setScene({ title: e.target.value })} /></div>
                  <ImageField lessonId={lessonId} label={`Gambar adegan ${sceneIdx + 1}`} value={scene.image_path} onChange={(p) => setScene({ image_path: p })} disabled={!editable} />
                  <div className="grid3"><div className="field"><label htmlFor="s-zoom">Perbesaran</label><input id="s-zoom" className="inp" type="number" step="0.1" min={0.5} max={4} value={scene.zoom} onChange={(e) => setScene({ zoom: Math.min(4, Math.max(0.5, Number(e.target.value) || 1)) })} /></div>
                    <div className="field"><label htmlFor="s-fx">Fokus X (%)</label><input id="s-fx" className="inp" type="number" min={0} max={100} value={fx} onChange={(e) => setScene({ focus: `${Math.min(100, Math.max(0, Number(e.target.value) || 0))}% ${fy}%` })} /></div>
                    <div className="field"><label htmlFor="s-fy">Fokus Y (%)</label><input id="s-fy" className="inp" type="number" min={0} max={100} value={fy} onChange={(e) => setScene({ focus: `${fx}% ${Math.min(100, Math.max(0, Number(e.target.value) || 0))}%` })} /></div></div>
                  <div className="tabs2" role="tablist" aria-label="Usia">{AGES.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={age === k} className={age === k ? "on" : undefined} onClick={() => setAge(k)}>{l}</button>)}</div>
                  <div className="field"><label htmlFor="s-narr">Narasi usia {age.slice(1, 2)}–{age.slice(2)}</label><textarea id="s-narr" className="ta" style={{ minHeight: 140 }} value={scene[age]} maxLength={2000} onChange={(e) => setScene({ [age]: e.target.value } as Partial<Scene>)} /></div>
                  <button type="button" className="btn text sm" onClick={() => { set("scenes", d.scenes.filter((_, i) => i !== sceneIdx)); setSceneIdx(0); }}>Hapus adegan ini</button>
                </div>
              ) : <div className="ghostbox">Belum ada adegan. Tambahkan sampai 5 adegan.</div>}
            </div>
          ) : null}

          {tab === "alur" ? (
            <div className="col">
              {d.steps.map((s, i) => (
                <details key={i} className="card" style={{ padding: 12 }}>
                  <summary style={{ cursor: "pointer", fontWeight: 800, color: "var(--purple)", minHeight: 36, display: "flex", alignItems: "center", gap: 8 }}><span className="badge b-interview">{i + 1}</span>{s.title || "(tanpa judul)"}<span className="small muted">· {KINDS.find(([k]) => k === s.kind)?.[1]}</span></summary>
                  <div className="col mt8">
                    <div className="grid2"><div className="field"><label htmlFor={`st-${i}`}>Judul langkah</label><input id={`st-${i}`} className="inp" value={s.title} maxLength={120} onChange={(e) => setStep(i, { title: e.target.value })} /></div>
                      <div className="field"><label htmlFor={`sk-${i}`}>Jenis</label><select id={`sk-${i}`} className="sel" value={s.kind} onChange={(e) => setStep(i, { kind: e.target.value as Step["kind"], story_scene: e.target.value === "story" ? s.story_scene ?? 1 : null })}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div></div>
                    {s.kind === "story" ? <div className="field"><label htmlFor={`ss-${i}`}>Adegan yang ditampilkan</label><select id={`ss-${i}`} className="sel" value={s.story_scene ?? 1} onChange={(e) => setStep(i, { story_scene: Number(e.target.value) })}>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Adegan {n}</option>)}</select></div> : <div className="field"><label htmlFor={`sb-${i}`}>Isi langkah</label><textarea id={`sb-${i}`} className="ta" value={s.body} maxLength={3000} onChange={(e) => setStep(i, { body: e.target.value })} /></div>}
                    {s.kind === "video" ? <div className="field"><label htmlFor={`sv-${i}`}>Tautan video (Google Drive)</label><input id={`sv-${i}`} className="inp" type="url" value={s.video_url ?? ""} maxLength={500} onChange={(e) => setStep(i, { video_url: e.target.value || null })} /></div> : null}
                    <div className="row"><button type="button" className="btn ghost sm" onClick={() => move(i, -1)} disabled={i === 0}>↑ Naik</button><button type="button" className="btn ghost sm" onClick={() => move(i, 1)} disabled={i === d.steps.length - 1}>↓ Turun</button><span className="grow" /><button type="button" className="btn text sm" onClick={() => set("steps", d.steps.filter((_, k) => k !== i))}>Hapus</button></div>
                  </div>
                </details>
              ))}
              {d.steps.length < 24 ? <button type="button" className="btn ghost" onClick={() => set("steps", [...d.steps, { title: `Langkah ${d.steps.length + 1}`, body: "", kind: "text", story_scene: null, video_url: null }])}>＋ Tambah langkah</button> : null}
            </div>
          ) : null}

          {tab === "power" ? (
            <div className="col g14"><p className="muted small">Tiga tindakan kecil yang dipilih keluarga minggu ini.</p>
              {[0, 1, 2].map((i) => <div className="field" key={i}><label htmlFor={`pw-${i}`}>Tindakan {i + 1}</label><input id={`pw-${i}`} className="inp" value={d.power[i] ?? ""} maxLength={120} onChange={(e) => { const a = [0, 1, 2].map((k) => (k === i ? e.target.value : d.power[k] ?? "")); while (a.length && !a[a.length - 1].trim()) a.pop(); set("power", a); }} /></div>)}
            </div>
          ) : null}
        </fieldset>

        <aside className="card" aria-label="Pratinjau tampilan orang tua">
          <h2 className="h3">Pratinjau tampilan orang tua</h2>
          <div style={{ borderRadius: 26, border: "7px solid #2a1740", padding: 12, marginTop: 10, background: "#fff2f6" }} className="theme-sk">
            <div className="h2">Pelajaran {d.number}</div>
            <div style={{ fontFamily: "var(--font-baloo), 'Baloo 2'", fontWeight: 800, fontSize: 22, color: "var(--purple)" }}>{d.title}</div>
            <div className="small">{d.truth}</div>
            <div className="story-img mt8" style={{ aspectRatio: "16/9" }}>{scene?.image_path /* eslint-disable-next-line @next/next/no-img-element */ ? <img src={assetUrl(scene.image_path)} alt="" style={{ transform: `scale(${scene.zoom})`, transformOrigin: scene.focus }} /> : d.thumbnail_path /* eslint-disable-next-line @next/next/no-img-element */ ? <img src={assetUrl(d.thumbnail_path)} alt="" /> : <div className="photo" style={{ height: "100%", borderRadius: 0 }}>FOTO</div>}</div>
            <div className="pills mt8">{AGES.map(([k, l]) => <button key={k} type="button" className={`pill${age === k ? " on" : ""}`} style={{ padding: "6px 2px", fontSize: 13, minHeight: 36 }} onClick={() => setAge(k)}>{l.replace("Narasi ", "")}</button>)}</div>
            <div className="mt8 small">{scene?.[age] || "Narasi belum ditulis."}</div>
          </div>
        </aside>
      </div>
    </div>
  );
}
