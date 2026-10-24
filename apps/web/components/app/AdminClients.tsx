"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { publishEpk, resolveCorrection, saveRoles } from "@/app/(app)/(shell)/sk/admin/actions";
import { Overlay } from "@/components/ui/Overlay";
import { useRun } from "@/components/ui/Toast";

export function PublishEpkButton({ reportId, ready }: { reportId: string | null; ready: boolean }) {
  const { run, pending } = useRun();
  return (
    <div className="col mt12">
      <button type="button" className="btn purple block" disabled={!ready || !reportId || pending} onClick={() => reportId && run(() => publishEpk(reportId))}>Setujui dan terbitkan</button>
      {!ready ? <div className="small muted">Tombol aktif setelah refleksi orang tua dan guru terkirim.</div> : null}
    </div>
  );
}

export function ResolveButton({ familyId }: { familyId: string }) {
  const { run, pending } = useRun();
  return <button type="button" className="btn red sm" disabled={pending} onClick={() => run(() => resolveCorrection(familyId))}>Selesaikan</button>;
}

export interface AccountRow { id: string; name: string; email: string; roles: { role: string; scope: string | null; active: boolean }[]; me: boolean }
export interface ClassOpt { id: string; name: string }
const LABEL: Record<string, string> = { parent: "Orang tua", sk_guru: "Guru SK", sk_kurikulum: "Kurikulum", sk_admin: "Admin SK" };
const KIND: Record<string, string> = { parent: "need", sk_guru: "interview", sk_kurikulum: "pending", sk_admin: "active" };

/** AD-03. Role changes are recorded in the audit log; an admin cannot remove their own admin role. */
export function AccountsTable({ rows, classes }: { rows: AccountRow[]; classes: ClassOpt[] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<AccountRow | null>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [cls, setCls] = useState<Set<string>>(new Set());
  const { run, pending } = useRun();
  const router = useRouter();
  const shown = useMemo(() => rows.filter((r) => `${r.name} ${r.email}`.toLowerCase().includes(q.toLowerCase())), [rows, q]);
  const start = (r: AccountRow) => {
    const act = r.roles.filter((x) => x.active);
    setSel(new Set(act.map((x) => x.role))); setCls(new Set(act.filter((x) => x.role === "sk_guru" && x.scope).map((x) => x.scope!))); setOpen(r);
  };
  const flip = (s: Set<string>, v: string) => { const n = new Set(s); if (n.has(v)) n.delete(v); else n.add(v); return n; };
  return (
    <div className="col g14">
      <input className="inp" type="search" placeholder="🔍 Cari nama atau email" aria-label="Cari nama atau email" value={q} onChange={(e) => setQ(e.target.value)} />
      <div className="tblwrap"><table className="tbl">
        <thead><tr><th scope="col">Nama</th><th scope="col">Email</th><th scope="col">Peran</th><th scope="col">Aksi</th></tr></thead>
        <tbody>{shown.map((r) => (
          <tr key={r.id}><td><b className="purple">{r.name}</b>{r.me ? " (Anda)" : ""}</td><td>{r.email}</td>
            <td className="row wrap" style={{ gap: 4 }}>{r.roles.filter((x) => x.active).length ? r.roles.filter((x) => x.active).map((x, i) => <span key={i} className={`badge b-${KIND[x.role] ?? "batal"}`}>{LABEL[x.role] ?? x.role}{x.scope ? ` ${classes.find((c) => c.id === x.scope)?.name ?? ""}` : ""}</span>) : "-"}</td>
            <td><button type="button" className="btn ghost sm" onClick={() => start(r)}>Ubah peran</button></td></tr>
        ))}</tbody></table></div>
      {open ? (
        <Overlay kind="drawer" title={`Ubah peran ${open.name}`} onClose={() => setOpen(null)}>
          <div className="row between"><h2 className="h2">Ubah peran: {open.name}</h2><button type="button" className="iconbtn" aria-label="Tutup" onClick={() => setOpen(null)}>✕</button></div>
          <div className="banner info mt8">ℹ Perubahan peran dicatat di audit.</div>
          <h3 className="h3 mt16 mb8">Pilih peran</h3>
          <div className="col">{Object.entries(LABEL).map(([r, l]) => {
            const locked = open.me && r === "sk_admin"; const on = sel.has(r);
            return (<div key={r} className="col" style={{ gap: 6 }}>
              <button type="button" className="checkrow" role="checkbox" aria-checked={on} disabled={locked} onClick={() => setSel(flip(sel, r))}><span className={`cb sq${on ? " on" : ""}`} aria-hidden="true">{on ? "✓" : ""}</span>{l}{locked ? <span className="small muted"> (tidak dapat dicabut sendiri)</span> : null}</button>
              {r === "sk_guru" && on ? <div className="chips" style={{ paddingLeft: 12 }} role="group" aria-label="Kelas yang diajar">{classes.map((c) => <button key={c.id} type="button" aria-pressed={cls.has(c.id)} className={`chip sm${cls.has(c.id) ? " on" : ""}`} onClick={() => setCls(flip(cls, c.id))}>Kelas {c.name}</button>)}</div> : null}
            </div>);
          })}</div>
          <div className="row mt16"><button type="button" className="btn ghost grow" onClick={() => setOpen(null)}>Batal</button>
            <button type="button" className="btn purple grow" disabled={pending} onClick={() => run(() => saveRoles(open.id, [...sel], [...cls]), { after: (r) => { if (r && r.ok) { setOpen(null); router.refresh(); } } })}>Simpan</button></div>
        </Overlay>
      ) : null}
    </div>
  );
}
