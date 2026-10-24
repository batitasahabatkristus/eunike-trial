"use client";

import { useState } from "react";
import { moveChild, setCapacity } from "@/app/(app)/(shell)/sk/admin/actions";
import { useRun } from "@/components/ui/Toast";

export function MoveChild({ childId, current, classes }: { childId: string; current: string; classes: { id: string; name: string }[] }) {
  const [to, setTo] = useState(current);
  const { run, pending } = useRun();
  return (
    <div className="row"><label className="sr-only" htmlFor={`mv-${childId}`}>Pindahkan ke kelas</label>
      <select id={`mv-${childId}`} className="sel" style={{ minHeight: 40, width: 140 }} value={to} onChange={(e) => setTo(e.target.value)}>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <button type="button" className="btn ghost sm" disabled={pending || to === current} onClick={() => run(() => moveChild(childId, to))}>Pindahkan</button></div>
  );
}

export function CapacityForm({ classId, capacity }: { classId: string; capacity: number }) {
  const [n, setN] = useState(String(capacity));
  const { run, pending } = useRun();
  return (
    <form className="row" onSubmit={(e) => { e.preventDefault(); run(() => setCapacity(classId, Number(n))); }}>
      <div className="field"><label htmlFor={`cap-${classId}`}>Kapasitas keluarga</label><input id={`cap-${classId}`} className="inp" type="number" min={1} max={200} value={n} onChange={(e) => setN(e.target.value)} style={{ width: 110 }} /></div>
      <button className="btn ghost sm" disabled={pending} style={{ alignSelf: "end" }}>Simpan</button></form>
  );
}
