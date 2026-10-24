"use client";

import { useState } from "react";
import { setPrivacyTimeline } from "@/app/(app)/(shell)/beranda/actions";
import { Toggle } from "@/components/ui/Toggle";
import { useRun } from "@/components/ui/Toast";

export function PrivacyToggle({ familyId, on }: { familyId: string; on: boolean }) {
  const [v, setV] = useState(on);
  const { run, pending } = useRun();
  return (
    <div className="card row between">
      <div><b className="purple">Tampilkan Perjalanan keluarga</b><div className="small muted">Hanya Anda dan pihak pastoral yang berwenang yang bisa melihat ini.</div></div>
      <Toggle on={v} label="Tampilkan Perjalanan keluarga" disabled={pending} onChange={(n) => { setV(n); run(() => setPrivacyTimeline(familyId, n)); }} />
    </div>
  );
}
