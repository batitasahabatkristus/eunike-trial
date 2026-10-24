"use client";

import { useRef, useState } from "react";
import { applyImport, previewImport, type PreviewResult } from "@/app/(app)/(shell)/sk/admin/actions";
import { Overlay } from "@/components/ui/Overlay";
import { useRun, useToast } from "@/components/ui/Toast";

const LABEL: Record<string, string> = { baru: "Baru", duplikat: "Duplikat", ganda_di_berkas: "Ganda di berkas", kelas_tidak_ada: "Kelas tidak ada", tidak_valid: "Tidak valid" };
const KIND: Record<string, string> = { baru: "ok", duplikat: "warn", ganda_di_berkas: "warn", kelas_tidak_ada: "need", tidak_valid: "need" };

/** AD-04: upload -> preview with duplicate detection -> apply. Nothing is written until "Impor" is pressed. */
export function ImportFamilies() {
  const [open, setOpen] = useState(false);
  const [prev, setPrev] = useState<PreviewResult | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const { run, pending } = useRun();
  const close = () => { setOpen(false); setPrev(null); };
  const upload = async () => {
    const f = input.current?.files?.[0];
    if (!f) return toast("Pilih berkas Excel dulu.", "err");
    const fd = new FormData(); fd.append("file", f);
    setBusy(true);
    try { const r = await previewImport(fd); setPrev(r); if (!r.ok) toast(r.message ?? "Berkas tidak dapat dibaca.", "err"); } catch { toast("Pratinjau gagal. Coba lagi.", "err"); }
    setBusy(false);
  };
  const fresh = prev?.rows?.filter((r) => r.status === "baru") ?? [];
  return (
    <>
      <button type="button" className="btn ghost" onClick={() => setOpen(true)}>⬆ Impor dari Excel</button>
      {open ? (
        <Overlay kind="modal" title="Impor keluarga dari Excel" onClose={close}>
          <h2 className="h2 mb8">Impor keluarga dari Excel</h2>
          <p className="small muted">Kolom: <b>Keluarga, Papa, Mama, Anak, Tanggal lahir, WhatsApp, Kelas</b>. Baris yang sudah ada dilewati; tidak ada yang ditulis sebelum Anda menekan Impor.</p>
          <div className="row mt8"><input ref={input} className="inp" type="file" accept=".xlsx" aria-label="Berkas Excel" /><button type="button" className="btn ghost sm" disabled={busy} onClick={() => void upload()}>{busy ? "Membaca…" : "Pratinjau"}</button></div>
          {prev?.ok && prev.rows ? (
            <div className="mt12">
              <div className="chips" aria-label="Ringkasan">{Object.entries(prev.counts ?? {}).map(([k, n]) => <span key={k} className={`badge b-${KIND[k]}`}>{LABEL[k]}: {n}</span>)}</div>
              <div className="tblwrap mt8" style={{ maxHeight: 260, overflow: "auto" }}><table className="tbl"><thead><tr><th scope="col">Baris</th><th scope="col">Keluarga</th><th scope="col">Anak</th><th scope="col">Status</th></tr></thead>
                <tbody>{prev.rows.slice(0, 200).map((r) => <tr key={r.line}><td>{r.line}</td><td>{r.family}</td><td>{r.child}</td><td><span className={`badge b-${KIND[r.status]}`}>{LABEL[r.status]}</span>{r.note ? <div className="xs muted">{r.note}</div> : null}</td></tr>)}</tbody></table></div>
              <div className="row mt12" style={{ justifyContent: "flex-end" }}>
                <button type="button" className="btn ghost" onClick={close}>Batal</button>
                <button type="button" className="btn purple" disabled={pending || fresh.length === 0} onClick={() => run(() => applyImport(fresh.map(({ status: _s, note: _n, ...r }) => r)), { after: (r) => { if (r && r.ok) close(); } })}>Impor {fresh.length} keluarga</button>
              </div>
            </div>
          ) : null}
        </Overlay>
      ) : null}
    </>
  );
}
