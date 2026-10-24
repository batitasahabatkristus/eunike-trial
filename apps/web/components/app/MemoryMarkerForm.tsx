"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { prepareUpload, saveMemoryMarker } from "@/app/(app)/(shell)/sk/keluarga/actions";
import { useRun, useToast } from "@/components/ui/Toast";
import { TOO_BIG, putFile } from "@/lib/upload-client";

const LIA = ["Melayani", "Memberi", "Mengampuni"] as const;
const MAX = 50 * 1024 * 1024;
interface Item { id: string; name: string; size: number; mime: string; progress: number; status: "uploading" | "done" | "error"; path?: string; preview?: string; error?: string }
export interface ExistingFile { path: string; mime: string }

export function MemoryMarkerForm({ lessonId, lessonNo, childId, existing, defaults }: {
  lessonId: string; lessonNo: number; childId: string; existing: ExistingFile[];
  defaults: { q1: string; q2: string; q3: string; q4: string; love: string[]; faith: boolean; couch: boolean } | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const { run, pending } = useRun();
  const [f, setF] = useState(defaults ?? { q1: "", q2: "", q3: "", q4: "", love: [] as string[], faith: false, couch: false });
  const [items, setItems] = useState<Item[]>([]);
  const [err, setErr] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const room = 3 - existing.length - items.length;
  const busy = items.some((i) => i.status === "uploading");
  const set = (k: keyof typeof f, v: unknown) => setF({ ...f, [k]: v } as typeof f);
  const patch = (id: string, p: Partial<Item>) => setItems((l) => l.map((i) => (i.id === id ? { ...i, ...p } : i)));

  const add = async (files: FileList | null) => {
    if (!files) return;
    setErr("");
    for (const file of Array.from(files)) {
      if (3 - existing.length - items.length <= 0) { toast("Maksimal 3 berkas", "err"); break; }
      if (file.size > MAX) { setErr(TOO_BIG); continue; }
      const id = crypto.randomUUID();
      setItems((l) => [...l, { id, name: file.name, size: file.size, mime: file.type, progress: 0, status: "uploading", preview: file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined }]);
      try {
        const t = await prepareUpload(lessonId, file.name, file.type, file.size);
        if (!t.ok) throw new Error(t.message);
        await putFile(t, file, (p) => patch(id, { progress: p }));
        patch(id, { status: "done", progress: 100, path: t.path });
      } catch (e) { patch(id, { status: "error", error: e instanceof Error ? e.message : "Unggahan gagal." }); }
    }
    if (input.current) input.current.value = "";
  };

  const send = () => run(() => saveMemoryMarker({
    lessonId, childId, q1: f.q1, q2: f.q2, q3: f.q3, q4: f.q4, love: f.love as ("Melayani" | "Memberi" | "Mengampuni")[], faith: f.faith, couch: f.couch,
    files: items.filter((i) => i.status === "done" && i.path).map((i) => ({ path: i.path!, mime: i.mime, size: i.size })),
  }), { after: (r) => { if (r && r.ok) router.push("/sk/keluarga"); } });

  return (
    <div className="col g14">
      {[1, 2, 3, 4].map((i) => {
        const k = `q${i}` as "q1" | "q2" | "q3" | "q4";
        return <div className="field" key={k}><label htmlFor={k}>Pertanyaan {i}</label><textarea id={k} className="ta" value={f[k]} onChange={(e) => set(k, e.target.value)} maxLength={2000} /></div>;
      })}
      <h2 className="h3">Love in Action</h2>
      <div className="chips" role="group" aria-label="Love in Action">
        {LIA.map((x) => { const on = f.love.includes(x); return <button key={x} type="button" aria-pressed={on} className={`chip${on ? " on" : ""}`} onClick={() => set("love", on ? f.love.filter((y) => y !== x) : [...f.love, x])}>{on ? "✓ " : ""}{x}</button>; })}
      </div>
      {([["faith", "Sudah Faith Talk"], ["couch", "Sudah Couch Time"]] as const).map(([k, l]) => (
        <div key={k} className="card row between"><span id={`l-${k}`}>{l}</span>
          <button type="button" role="switch" aria-checked={f[k]} aria-labelledby={`l-${k}`} className="tog" onClick={() => set(k, !f[k])} /></div>
      ))}
      <div className={`drop${err || items.some((i) => i.status === "error") ? " err" : ""}`}>
        <div className="small" style={{ fontWeight: 800, color: "var(--purple)" }}>☁ Unggah foto atau video (maksimal 3 berkas, 50 MB)</div>
        <ul className="col mt8" style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {existing.map((e) => <li key={e.path} className="row small"><span className="ic-c" aria-hidden="true">{e.mime.startsWith("video/") ? "🎬" : "🖼"}</span><span className="grow">Sudah terkirim</span><span className="badge b-ok">✓</span></li>)}
          {items.map((i) => (
            <li key={i.id} className="row small">
              {i.preview ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={i.preview} alt="" style={{ width: 44, height: 44, objectFit: "cover", borderRadius: 10 }} /> : <span className="ic-c" aria-hidden="true">🎬</span>}
              <div className="grow"><div style={{ fontWeight: 700 }}>{i.name}</div>
                {i.status === "uploading" ? <div className="prog" role="progressbar" aria-valuenow={i.progress} aria-valuemin={0} aria-valuemax={100} aria-label={`Mengunggah ${i.name}`}><i style={{ width: `${i.progress}%` }} /></div> : null}
                {i.status === "error" ? <div className="errmsg">⚠ {i.error}</div> : null}</div>
              {i.status === "done" ? <span className="badge b-ok">✓</span> : null}
              {i.status !== "uploading" ? <button type="button" className="btn text sm" onClick={() => setItems((l) => l.filter((x) => x.id !== i.id))} aria-label={`Hapus ${i.name}`}>✕</button> : null}
            </li>
          ))}
        </ul>
        {err ? <div className="errmsg mt8" role="alert">⚠ {err}</div> : null}
        <div className="row mt8 wrap">
          <input ref={input} id="mmfile" type="file" accept="image/*,video/*" multiple hidden onChange={(e) => void add(e.target.files)} />
          <button type="button" className="btn ghost sm" disabled={room <= 0 || busy} onClick={() => input.current?.click()}>+ Foto atau video</button>
          <span className="small muted">{room > 0 ? `${room} berkas lagi` : "Batas 3 berkas tercapai"}</span>
        </div>
      </div>
      <button type="button" className="btn red block" disabled={pending || busy} onClick={send}>{busy ? "Menunggu unggahan…" : "Kirim"}</button>
      <p className="small muted center">Pelajaran {lessonNo}. Guru kelas akan menerima Memory Marker ini.</p>
    </div>
  );
}
