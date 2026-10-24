"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitParentEpk, verifyReportPin } from "@/app/(app)/(shell)/sk/keluarga/actions";
import { useRun } from "@/components/ui/Toast";

const FIELDS = [["g", "Growth", "Pertumbuhan anak semester ini"], ["gl", "Gladness", "Yang membuat kami bersukacita"], ["gr", "Gratitude", "Yang kami syukuri"], ["go", "God", "Tentang Tuhan dan keluarga kami"], ["gd", "Guidance", "Bimbingan yang kami butuhkan"]] as const;
type G = { g: string; gl: string; gr: string; go: string; gd: string };

export function ParentEpkForm({ childId, initial, locked }: { childId: string; initial: Partial<G> | null; locked: boolean }) {
  const [v, setV] = useState<G>({ g: "", gl: "", gr: "", go: "", gd: "", ...(initial ?? {}) });
  const { run, pending } = useRun();
  return (
    <div className="col g14">
      {FIELDS.map(([k, a, b]) => (
        <div className="field" key={k}><label htmlFor={`g-${k}`}>{a}: {b}</label>
          <textarea id={`g-${k}`} className="ta" value={v[k]} disabled={locked} maxLength={2000} onChange={(e) => setV({ ...v, [k]: e.target.value })} /></div>
      ))}
      {locked ? null : <button type="button" className="btn red block" disabled={pending || !v.g.trim()} onClick={() => run(() => submitParentEpk(childId, v))}>{initial ? "Perbarui refleksi" : "Kirim refleksi"}</button>}
    </div>
  );
}

export function PinGate({ familyId, hasPin }: { familyId: string; hasPin: boolean }) {
  const [pin, setPin] = useState("");
  const router = useRouter();
  const { run, pending } = useRun();
  if (!hasPin) return <div className="banner warn">🔒 Atur PIN keluarga dulu di <a href="/beranda/pengaturan" style={{ color: "inherit" }}>Pengaturan</a> untuk membuka laporan.</div>;
  return (
    <form className="card col" onSubmit={(e) => { e.preventDefault(); run(() => verifyReportPin(familyId, pin), { after: (r) => { if (r && r.ok) router.refresh(); } }); }}>
      <h2 className="h2">🔒 Masukkan PIN keluarga</h2>
      <div className="field"><label htmlFor="rp">PIN (4 angka)</label>
        <input id="rp" className="inp" inputMode="numeric" autoComplete="one-time-code" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} /></div>
      <button className="btn red block" disabled={pending || pin.length !== 4}>Buka laporan</button>
    </form>
  );
}
