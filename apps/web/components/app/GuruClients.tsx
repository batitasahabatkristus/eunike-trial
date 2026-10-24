"use client";

import { useState } from "react";
import { markMarkerRead, moderatePost, replyForum, submitTeacherEpk } from "@/app/(app)/(shell)/sk/guru/actions";
import { useRun } from "@/components/ui/Toast";

export function WhatsAppMama({ markerId, wa, family, isNew }: { markerId: string; wa: string | null; family: string; isNew: boolean }) {
  const { run } = useRun();
  if (!wa) return <span className="small muted">Nomor WhatsApp belum ada</span>;
  const text = `Shalom Mama Keluarga ${family}, terima kasih sudah mengirim Memory Marker. Kami senang membacanya.`;
  return (
    <a className="btn ghost sm" href={`https://wa.me/${wa.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer"
      onClick={() => { if (isNew) run(() => markMarkerRead(markerId)); }}>WhatsApp Mama</a>
  );
}

export function MarkRead({ markerId }: { markerId: string }) {
  const { run, pending } = useRun();
  return <button type="button" className="btn text sm" disabled={pending} onClick={() => run(() => markMarkerRead(markerId))}>Tandai sudah dibaca</button>;
}

export interface FPost { id: string; kind: "post" | "reply"; author: string; body: string; pinned: boolean; hidden: boolean; likes: number; at: string }
export function ForumBoard({ classId, lessonId, posts }: { classId: string; lessonId: string; posts: FPost[] }) {
  const [menu, setMenu] = useState<string | null>(null);
  const [t, setT] = useState("");
  const { run, pending } = useRun();
  const sorted = [...posts].sort((a, b) => Number(b.pinned) - Number(a.pinned) || a.at.localeCompare(b.at));
  return (
    <div className="col g14">
      {sorted.length === 0 ? <div className="ghostbox">Belum ada postingan untuk pelajaran ini.</div> : sorted.map((p) => p.hidden ? (
        <div key={p.id} className="card row between" style={{ opacity: 0.7 }}><span className="small">🙈 Postingan {p.author} disembunyikan</span>
          <button type="button" className="btn text sm" disabled={pending} onClick={() => run(() => moderatePost(p.id, "hidden", false))}>Tampilkan</button></div>
      ) : (
        <div key={p.id} className="post">
          <div className="avatar lilac" aria-hidden="true">{p.author.replace("Keluarga ", "").charAt(0)}</div>
          <div className="grow"><b className="purple">{p.author}</b>{p.pinned ? <span className="badge b-baru" style={{ marginLeft: 8 }}>📌 Tersemat</span> : null}
            <div className="mt8" style={{ whiteSpace: "pre-wrap" }}>{p.body}</div>
            {p.kind === "post" ? <div className="small muted mt8">👍 Ikut bersukacita {p.likes}</div> : null}</div>
          {p.kind === "post" ? (
            <>
              <button type="button" className="iconbtn" style={{ width: 40, height: 40 }} aria-label={`Menu postingan ${p.author}`} aria-expanded={menu === p.id} onClick={() => setMenu(menu === p.id ? null : p.id)}>⋮</button>
              {menu === p.id ? (
                <div className="menu" role="menu">
                  <button role="menuitem" type="button" onClick={() => { setMenu(null); run(() => moderatePost(p.id, "pinned", !p.pinned)); }}>📌 {p.pinned ? "Lepas sematan" : "Sematkan"}</button>
                  <button role="menuitem" type="button" onClick={() => { setMenu(null); run(() => moderatePost(p.id, "hidden", true)); }}>🙈 Sembunyikan</button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      ))}
      <form className="row" onSubmit={(e) => { e.preventDefault(); run(() => replyForum(classId, lessonId, t), { after: (r) => { if (r && r.ok) setT(""); } }); }}>
        <input className="inp" placeholder="Tulis balasan..." aria-label="Tulis balasan" value={t} onChange={(e) => setT(e.target.value)} maxLength={2000} />
        <button className="btn red" style={{ minWidth: 52, padding: 0 }} disabled={pending || !t.trim()} aria-label="Kirim balasan">➤</button>
      </form>
    </div>
  );
}

export function TeacherReflection({ childId, initialNote, initialP4, sent }: { childId: string; initialNote: string; initialP4: { a: string; b: string; c: string; d: string }; sent: boolean }) {
  const [note, setNote] = useState(initialNote);
  const [p4, setP4] = useState(initialP4);
  const { run, pending } = useRun();
  const P = [["a", "Pengamatan"], ["b", "Peneguhan"], ["c", "Percakapan"], ["d", "Pendampingan"]] as const;
  return (
    <div className="col g14">
      <h2 className="h3">Refleksi guru (5G)</h2>
      <div className="field"><label htmlFor="gn">Catatan guru</label><textarea id="gn" className="ta" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tulis pengamatan tentang anak di kelas" maxLength={3000} /></div>
      <h2 className="h3">Catatan 4P</h2>
      {P.map(([k, l]) => <div key={k} className="field"><label htmlFor={`p-${k}`}>{l}</label><textarea id={`p-${k}`} className="ta" value={p4[k]} onChange={(e) => setP4({ ...p4, [k]: e.target.value })} maxLength={2000} /></div>)}
      <button type="button" className="btn purple block" disabled={pending || !note.trim()} onClick={() => run(() => submitTeacherEpk(childId, note, p4))}>{sent ? "✓ Terkirim ke admin (perbarui)" : "Kirim ke admin"}</button>
    </div>
  );
}
