"use client";

import { useRef, useState } from "react";
import { addLibraryAsset, prepareAssetUpload } from "@/app/(app)/(shell)/sk/kurikulum/actions";
import { putFile } from "@/lib/upload-client";
import { useRun, useToast } from "@/components/ui/Toast";

/** Images are uploaded; songs, videos and other files are linked (videos stay on Google Drive at first, D4). */
export function PustakaUpload() {
  const [kind, setKind] = useState<"image" | "song" | "video" | "file">("image");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [pct, setPct] = useState<number | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const { run, pending } = useRun();
  const toast = useToast();
  const reset = () => { setTitle(""); setUrl(""); if (input.current) input.current.value = ""; };
  const submit = async () => {
    if (kind !== "image") return run(() => addLibraryAsset(title, kind, url), { after: (r) => { if (r && r.ok) reset(); } });
    const f = input.current?.files?.[0];
    if (!f) return toast("Pilih gambar dulu.", "err");
    setPct(0);
    try {
      const t = await prepareAssetUpload("pustaka", f.name, f.type, f.size);
      if (!t.ok) throw new Error(t.message);
      await putFile(t, f, setPct);
      run(() => addLibraryAsset(title || f.name, "image", t.path!), { after: (r) => { if (r && r.ok) reset(); } });
    } catch (e) { toast(e instanceof Error ? e.message : "Unggahan gagal.", "err"); }
    setPct(null);
  };
  return (
    <form className="card col" onSubmit={(e) => { e.preventDefault(); void submit(); }} aria-label="Tambah ke Pustaka">
      <h2 className="h3">Tambah ke Pustaka</h2>
      <div className="grid2"><div className="field"><label htmlFor="pk-t">Judul</label><input id="pk-t" className="inp" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} required={kind !== "image"} /></div>
        <div className="field"><label htmlFor="pk-k">Jenis</label><select id="pk-k" className="sel" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}><option value="image">Gambar (unggah)</option><option value="song">Lagu (tautan)</option><option value="video">Video (tautan)</option><option value="file">Berkas (tautan)</option></select></div></div>
      {kind === "image" ? <div className="field"><label htmlFor="pk-f">Gambar (JPG, PNG, WebP, maks 10 MB)</label><input id="pk-f" ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="inp" /></div>
        : <div className="field"><label htmlFor="pk-u">Tautan (Google Drive)</label><input id="pk-u" className="inp" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://drive.google.com/…" required /></div>}
      {pct !== null ? <div className="prog" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Mengunggah"><i style={{ width: `${pct}%` }} /></div> : null}
      <button className="btn purple" disabled={pending || pct !== null}>Tambah</button>
    </form>
  );
}
