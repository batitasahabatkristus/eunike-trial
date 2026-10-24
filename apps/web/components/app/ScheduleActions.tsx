"use client";

import Link from "next/link";
import { useState } from "react";
import { approveLesson, cancelSchedule, requestRevision } from "@/app/(app)/(shell)/sk/admin/actions";
import { Overlay } from "@/components/ui/Overlay";
import { useRun } from "@/components/ui/Toast";

/** AD-06 / KU-03 admin buttons. The database decides who may do what; these only call it. */
export function ScheduleActions({ id, status, review }: { id: string; status: string; review?: boolean }) {
  const { run, pending } = useRun();
  const [rev, setRev] = useState(false);
  const [note, setNote] = useState("");
  return (
    <div className="col mt12">
      {review ? <Link className="btn ghost block" href={`/sk/admin/materi/${id}`}>Tinjau materi</Link> : null}
      {status === "review" || status === "draft" ? <button type="button" className="btn purple block" disabled={pending} onClick={() => run(() => approveLesson(id))}>{status === "review" ? "Setujui dan jadwalkan" : "Jadwalkan"}</button> : null}
      {status === "review" || status === "scheduled" ? <button type="button" className="btn ghost block" disabled={pending} onClick={() => (status === "scheduled" ? run(() => cancelSchedule(id)) : setRev(true))}>{status === "scheduled" ? "Batalkan jadwal" : "Minta revisi"}</button> : null}
      {rev ? (
        <Overlay kind="modal" title="Minta revisi" onClose={() => setRev(false)}>
          <h2 className="h2 mb8">Minta revisi</h2>
          <div className="field"><label htmlFor="rv">Catatan untuk Kurikulum</label><textarea id="rv" className="ta" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Contoh: tolong perpendek ayat hafalan" maxLength={1000} /></div>
          <div className="row mt12" style={{ justifyContent: "flex-end" }}>
            <button type="button" className="btn ghost" onClick={() => setRev(false)}>Batal</button>
            <button type="button" className="btn purple" disabled={pending || note.trim().length < 3} onClick={() => run(() => requestRevision(id, note), { after: (r) => { if (r && r.ok) setRev(false); } })}>Kirim revisi</button>
          </div>
        </Overlay>
      ) : null}
    </div>
  );
}
