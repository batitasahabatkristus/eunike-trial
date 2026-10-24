"use client";

import { useState } from "react";
import { reportFamilyAttendance } from "@/app/(app)/(shell)/beranda/actions";
import { Overlay } from "@/components/ui/Overlay";
import { useRun } from "@/components/ui/Toast";

export interface Person { key: string; label: string }

/** CO-02: family ticks who came. Writes the family's self-report; the teacher's Masuk/Tidak stays separate. */
export function AttendanceSheet({ meetingId, familyId, people, initial, subtitle, label, className = "btn red sm" }: {
  meetingId: string; familyId: string; people: Person[]; initial: Record<string, boolean> | null; subtitle: string; label: string; className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<Record<string, boolean>>(initial ?? Object.fromEntries(people.map((p) => [p.key, true])));
  const { run, pending } = useRun();
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>{label}</button>
      {open ? (
        <Overlay title="Absensi keluarga" onClose={() => setOpen(false)}>
          <h2 className="h2">Absensi keluarga</h2>
          <p className="muted small mb8">{subtitle}</p>
          <div className="col">
            {people.map((p) => (
              <button key={p.key} type="button" className="checkrow" role="checkbox" aria-checked={!!sel[p.key]} onClick={() => setSel({ ...sel, [p.key]: !sel[p.key] })}>
                <span className={`cb${sel[p.key] ? " on" : ""}`} aria-hidden="true">{sel[p.key] ? "✓" : ""}</span>{p.label} hadir
              </button>
            ))}
            <button type="button" className="btn red block" disabled={pending}
              onClick={() => run(() => reportFamilyAttendance(meetingId, familyId, sel), { after: (r) => { if (r && r.ok) setOpen(false); } })}>Simpan absensi</button>
          </div>
        </Overlay>
      ) : null}
    </>
  );
}
