"use client";

import { useState } from "react";
import { registerChild } from "@/app/(app)/(shell)/beranda/actions";
import { useRun } from "@/components/ui/Toast";
import { Badge } from "@/components/ui/bits";

interface Opt { id: string; name: string; when: string; full: boolean }
export function ChildClassForm({ kids, classes, current }: { kids: { id: string; name: string; age: string }[]; classes: Opt[]; current: Record<string, string | undefined> }) {
  const [child, setChild] = useState(kids[0]?.id ?? "");
  const [klass, setKlass] = useState(current[kids[0]?.id ?? ""] ?? "");
  const [status, setStatus] = useState<"anggota_baru" | "pindahan">("anggota_baru");
  const [done, setDone] = useState<string | null>(null);
  const { run, pending } = useRun();
  const ch = kids.find((c) => c.id === child);
  return (
    <div className="col g14">
      {done ? <div className="banner ok" role="status">✓ {done}</div> : null}
      <section className="card" aria-labelledby="s1">
        <h2 className="h3" id="s1">1  Pilih anak</h2>
        <div className="col mt8" role="radiogroup" aria-labelledby="s1">
          {kids.map((c) => (
            <button key={c.id} type="button" role="radio" aria-checked={child === c.id} className="card row" style={child === c.id ? { border: "2px solid var(--purple)", background: "var(--lilac)" } : undefined}
              onClick={() => { setChild(c.id); setKlass(current[c.id] ?? ""); }}>
              <div className="avatar sm" aria-hidden="true">{c.name[0]}</div>
              <div className="grow"><b className="purple">{c.name}</b><div className="small muted">{c.age}</div></div>
              <div className={`cb${child === c.id ? " on" : ""}`} aria-hidden="true">{child === c.id ? "✓" : ""}</div>
            </button>
          ))}
        </div>
      </section>
      <section className="card" aria-labelledby="s2">
        <h2 className="h3" id="s2">2  Pilih grup</h2>
        <div className="col mt8" role="radiogroup" aria-labelledby="s2">
          {classes.map((k) => (
            <button key={k.id} type="button" role="radio" aria-checked={klass === k.id} aria-disabled={k.full} className="card row"
              style={{ ...(klass === k.id ? { border: "2px solid var(--purple)", background: "var(--lilac)" } : {}), ...(k.full ? { opacity: 0.55, borderStyle: "dashed", cursor: "not-allowed" } : {}) }}
              onClick={() => { if (!k.full) setKlass(k.id); }}>
              <div className={`cb${klass === k.id ? " on" : ""}`} aria-hidden="true">{klass === k.id ? "●" : ""}</div>
              <div className="grow"><b className="purple">Kelas {k.name}</b><div className="small muted">{k.when}</div></div>
              <Badge kind={k.full ? "need" : "ok"}>{k.full ? "Penuh" : "Terbuka"}</Badge>
            </button>
          ))}
        </div>
      </section>
      <section className="card" aria-labelledby="s3">
        <h2 className="h3" id="s3">3  Status</h2>
        <div className="seg mt8" role="radiogroup" aria-labelledby="s3">
          {([["anggota_baru", "Anggota baru"], ["pindahan", "Pindahan"]] as const).map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={status === v} className={status === v ? "on" : undefined} onClick={() => setStatus(v)}>{l}</button>
          ))}
        </div>
      </section>
      <button type="button" className="btn purple block" disabled={pending || !child || !klass}
        onClick={() => run(() => registerChild(child, klass, status), { after: (r) => { if (r && r.ok) setDone(`${ch?.name} terdaftar di Kelas ${classes.find((k) => k.id === klass)?.name} sebagai ${status === "pindahan" ? "Pindahan" : "Anggota baru"}.`); } })}>
        Daftarkan {ch?.name ?? "anak"}
      </button>
    </div>
  );
}
