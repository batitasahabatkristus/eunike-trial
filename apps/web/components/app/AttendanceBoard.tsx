"use client";

import { useMemo, useState } from "react";
import { saveAttendance } from "@/app/(app)/(shell)/sk/guru/actions";
import { useRun } from "@/components/ui/Toast";

type St = "in" | "out" | null;
export interface Row { key: string; kind: "family" | "pendamping" | "pengurus"; family_id?: string; name: string; status: St }
const TABS = [["family", "Anggota"], ["pendamping", "Pendamping"], ["pengurus", "Pengurus"]] as const;

/** GU-02: Anggota / Pendamping / Pengurus, search, Masuk/Tidak per row, live counters, one save. */
export function AttendanceBoard({ classId, date, initial }: { classId: string; date: string; initial: Row[] }) {
  const [rows, setRows] = useState(initial);
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("family");
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(true);
  const { run, pending } = useRun();
  const shown = useMemo(() => rows.filter((r) => r.kind === tab && (tab !== "family" || r.name.toLowerCase().includes(q.toLowerCase()))), [rows, tab, q]);
  const fam = rows.filter((r) => r.kind === "family");
  const cnt = { in: fam.filter((r) => r.status === "in").length, out: fam.filter((r) => r.status === "out").length, none: fam.filter((r) => !r.status).length };
  const set = (key: string, v: "in" | "out") => { setRows(rows.map((r) => (r.key === key ? { ...r, status: r.status === v ? null : v } : r))); setSaved(false); };
  const add = () => { const n = name.trim(); if (!n || rows.some((r) => r.kind === tab && r.name.toLowerCase() === n.toLowerCase())) return; setRows([...rows, { key: `${tab}:${n}`, kind: tab as "pendamping" | "pengurus", name: n, status: "in" }]); setName(""); setSaved(false); };
  return (
    <div className="col g14">
      <div className="seg" role="tablist" aria-label="Jenis kehadiran">
        {TABS.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={tab === k ? "on" : undefined} onClick={() => setTab(k)}>{l}</button>)}
      </div>
      {tab === "family" ? <input className="inp" type="search" placeholder="🔍 Cari nama" aria-label="Cari nama" value={q} onChange={(e) => setQ(e.target.value)} /> : (
        <form className="row" onSubmit={(e) => { e.preventDefault(); add(); }}><input className="inp" placeholder="Tambah nama" aria-label="Tambah nama" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} /><button className="btn ghost sm" type="submit">Tambah</button></form>
      )}
      <ul className="col" style={{ gap: 8, listStyle: "none", padding: 0, margin: 0 }}>
        {shown.length === 0 ? <li className="ghostbox">Belum ada nama.</li> : shown.map((r) => (
          <li key={r.key} className="card row" style={{ padding: 10 }}>
            <b className="purple grow">{r.kind === "family" ? `Keluarga ${r.name}` : r.name}</b>
            <div className="seg" style={{ width: 190 }} role="radiogroup" aria-label={`Kehadiran ${r.name}`}>
              <button type="button" role="radio" aria-checked={r.status === "in"} className={r.status === "in" ? "on" : undefined} onClick={() => set(r.key, "in")}>Masuk</button>
              <button type="button" role="radio" aria-checked={r.status === "out"} className={r.status === "out" ? "on" : undefined} style={r.status === "out" ? { background: "var(--red)" } : undefined} onClick={() => set(r.key, "out")}>Tidak</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="grid3" style={{ gap: 8 }} aria-live="polite">
        <div className="card center lilac"><div className="small muted">Masuk</div><div className="stat">{cnt.in}</div></div>
        <div className="card center blush"><div className="small muted">Tidak masuk</div><div className="stat" style={{ color: "var(--red)" }}>{cnt.out}</div></div>
        <div className="card center peach"><div className="small muted">Belum</div><div className="stat" style={{ color: "#a8570c" }}>{cnt.none}</div></div>
      </div>
      <button type="button" className="btn purple block" disabled={pending}
        onClick={() => run(() => saveAttendance(classId, date, rows.map((r) => ({ kind: r.kind, family_id: r.family_id, name: r.kind === "family" ? undefined : r.name, status: r.status }))), { after: (r) => { if (r && r.ok) setSaved(true); } })}>
        {saved && !pending ? "✓ Absensi tersimpan" : "Simpan absensi"}
      </button>
    </div>
  );
}
