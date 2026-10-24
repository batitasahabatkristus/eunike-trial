"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmFamilyData, submitCorrection } from "@/app/(app)/(shell)/sk/keluarga/actions";
import { useRun } from "@/components/ui/Toast";

export function DataKeluargaForm() {
  const [open, setOpen] = useState(false);
  const [t, setT] = useState("");
  const { run, pending } = useRun();
  const router = useRouter();
  return (
    <div className="col g14">
      {open ? (
        <div className="card">
          <div className="field"><label htmlFor="kor">Apa yang perlu dikoreksi?</label>
            <textarea id="kor" className="ta" placeholder="Contoh: nomor WhatsApp Papa berubah" value={t} onChange={(e) => setT(e.target.value)} maxLength={2000} /></div>
          <div className="mt8"><button type="button" className="btn red block" disabled={pending || t.trim().length < 3} onClick={() => run(() => submitCorrection(t), { after: (r) => { if (r && r.ok) { setOpen(false); setT(""); } } })}>Kirim koreksi</button></div>
        </div>
      ) : <button type="button" className="btn ghost block" onClick={() => setOpen(true)}>Ada yang perlu dikoreksi</button>}
      <button type="button" className="btn red block" disabled={pending} onClick={() => run(() => confirmFamilyData(), { after: (r) => { if (r && r.ok) router.push("/sk/keluarga"); } })}>Data sudah benar</button>
    </div>
  );
}
