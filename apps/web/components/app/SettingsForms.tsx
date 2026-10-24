"use client";

import { useState } from "react";
import { setFamilyPin, updateProfile } from "@/app/(app)/(shell)/beranda/actions";
import { Overlay } from "@/components/ui/Overlay";
import { useRun } from "@/components/ui/Toast";

export function ProfileRow({ name, phone }: { name: string; phone: string }) {
  const [open, setOpen] = useState(false);
  const [n, setN] = useState(name), [p, setP] = useState(phone);
  const { run, pending } = useRun();
  return (
    <>
      <button type="button" className="kv" style={{ width: "100%", textAlign: "left", background: "none", border: 0, cursor: "pointer", font: "inherit" }} onClick={() => setOpen(true)}>
        <span className="grow" style={{ fontWeight: 700 }}>Ubah nama dan nomor HP</span><span className="muted">{name}</span><span className="purple" aria-hidden="true">›</span>
      </button>
      {open ? (
        <Overlay title="Ubah profil" onClose={() => setOpen(false)}>
          <h2 className="h2 mb8">Ubah profil</h2>
          <div className="col">
            <div className="field"><label htmlFor="pn">Nama</label><input id="pn" className="inp" value={n} onChange={(e) => setN(e.target.value)} autoComplete="name" /></div>
            <div className="field"><label htmlFor="pp">Nomor HP</label><input id="pp" className="inp" value={p} onChange={(e) => setP(e.target.value)} inputMode="tel" autoComplete="tel" /></div>
            <button type="button" className="btn red block" disabled={pending} onClick={() => run(() => updateProfile(n, p), { after: (r) => { if (r && r.ok) setOpen(false); } })}>Simpan</button>
          </div>
        </Overlay>
      ) : null}
    </>
  );
}

export function PinRow({ familyId, hasPin }: { familyId: string; hasPin: boolean }) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const { run, pending } = useRun();
  return (
    <>
      <button type="button" className="kv" style={{ width: "100%", textAlign: "left", background: "none", border: 0, cursor: "pointer", font: "inherit" }} onClick={() => setOpen(true)}>
        <span className="grow" style={{ fontWeight: 700 }}>PIN laporan keluarga</span><span className="muted">{hasPin ? "Sudah diatur" : "Belum diatur"}</span><span className="purple" aria-hidden="true">›</span>
      </button>
      {open ? (
        <Overlay title="PIN laporan keluarga" onClose={() => setOpen(false)}>
          <h2 className="h2">PIN laporan keluarga</h2>
          <p className="muted small mb8">PIN empat angka melindungi laporan semester anak Anda.</p>
          <div className="col">
            <div className="field"><label htmlFor="pin">PIN baru (4 angka)</label>
              <input id="pin" className="inp" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))} inputMode="numeric" autoComplete="new-password" maxLength={4} aria-describedby="pinh" />
              <span id="pinh" className="hintmsg">Jangan gunakan tanggal lahir anak.</span></div>
            <button type="button" className="btn red block" disabled={pending || pin.length !== 4} onClick={() => run(() => setFamilyPin(familyId, pin), { after: (r) => { if (r && r.ok) { setOpen(false); setPin(""); } } })}>Simpan PIN</button>
          </div>
        </Overlay>
      ) : null}
    </>
  );
}
