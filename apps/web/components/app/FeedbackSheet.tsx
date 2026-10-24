"use client";

import { useState } from "react";
import { sendFeedback } from "@/app/(app)/(shell)/sk/keluarga/actions";
import { Overlay } from "@/components/ui/Overlay";
import { useRun } from "@/components/ui/Toast";

export function FeedbackSheet() {
  const [open, setOpen] = useState(false);
  const [t, setT] = useState("");
  const { run, pending } = useRun();
  return (
    <>
      <button type="button" className="btn text sm" onClick={() => setOpen(true)}>Beri masukan</button>
      {open ? (
        <Overlay title="Beri masukan" onClose={() => setOpen(false)}>
          <h2 className="h2">Beri masukan</h2><p className="muted mb8">Apa yang bisa kami perbaiki?</p>
          <div className="col">
            <textarea className="ta" aria-label="Masukan Anda" placeholder="Tulis masukan Anda" value={t} onChange={(e) => setT(e.target.value)} maxLength={2000} />
            <button type="button" className="btn red block" disabled={pending || t.trim().length < 3} onClick={() => run(() => sendFeedback(t), { after: (r) => { if (r && r.ok) { setOpen(false); setT(""); } } })}>Kirim masukan</button>
          </div>
        </Overlay>
      ) : null}
    </>
  );
}
