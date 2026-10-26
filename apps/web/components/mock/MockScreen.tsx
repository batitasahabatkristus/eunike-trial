"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { Overlay } from "@/components/ui/Overlay";
import { useToast } from "@/components/ui/Toast";
import { Badge, type BadgeKind } from "@/components/ui/bits";
import type { Block, Field, Item, ItemAction, Screen, Tone } from "@/lib/mock/types";
import { useMock } from "./MockProvider";

const TONE_BADGE: Record<Tone, BadgeKind> = { ok: "selesai", warn: "pending", bad: "rejected", info: "active", muted: "draft" };
const code = (prefix: string, n: number) => `${prefix}${String(n).padStart(4, "0")}`;

export function MockScreen({ screen, banner, footer }: { screen: Screen; banner: string; footer: string }) {
  return (
    <div className="col g14 mock">
      <div className="banner warn" role="note"><strong>MOCKUP</strong> · {banner}</div>
      <div className="page-title"><h1>{screen.title}</h1></div>
      {screen.subtitle ? <p className="muted" style={{ marginTop: -6 }}>{screen.subtitle}</p> : null}
      {screen.blocks.map((b, i) => <BlockView key={i} b={b} k={`${screen.title}:${i}`} />)}
      {screen.reqs?.length ? <p className="small muted">{footer}: {screen.reqs.join(", ")}</p> : null}
    </div>
  );
}

function BlockView({ b, k }: { b: Block; k: string }) {
  switch (b.t) {
    case "notice": return b.lock ? <div className="lock" role="note">🔒 {b.text}</div> : <div className={`banner ${b.tone ?? "info"}`}>{b.text}</div>;
    case "stats": return (
      <div className="grid4" style={{ gap: 10 }}>
        {b.items.map((s) => (
          <div key={s.label} className="kpi"><div><div className="lb">{s.label}</div><div className="stat" style={s.tone === "bad" ? { color: "var(--red)" } : undefined}>{s.value}</div>{s.hint ? <div className="small muted">{s.hint}</div> : null}</div></div>
        ))}
      </div>
    );
    case "kv": return (
      <section className="card">{b.title ? <h2 className="h2">{b.title}</h2> : null}
        {b.rows.map(([a, v]) => <div key={a} className="kv"><span className="k">{a}</span><span>{v}</span></div>)}
      </section>
    );
    case "table": return <TableBlock b={b} />;
    case "bars": return (
      <section className="card">{b.title ? <h2 className="h2">{b.title}</h2> : null}
        <div className="bars">{b.bars.map((x) => (
          <div key={x.label} className="b"><span className="small" style={{ fontWeight: 800 }}>{x.display ?? `${x.value}%`}</span><i style={{ height: `${Math.max(4, Math.min(100, x.value))}%` }} /></div>
        ))}</div>
        <div className="row" style={{ gap: 18, padding: "6px 6px 0" }}>{b.bars.map((x) => <span key={x.label} className="small muted" style={{ flex: 1, textAlign: "center", fontWeight: 700 }}>{x.label}</span>)}</div>
      </section>
    );
    case "timeline": return (
      <section className="card">{b.title ? <h2 className="h2">{b.title}</h2> : null}
        <div className="tl">{b.steps.map((s, i) => (
          <div key={s.label} className={`s ${s.state === "done" ? "done" : s.state === "now" ? "cur" : ""}`}>
            <div className="dot" aria-hidden="true">{s.state === "done" ? "✓" : i + 1}</div>
            <div><b>{s.label}</b>{s.note ? <div className="small muted">{s.note}</div> : null}</div>
          </div>
        ))}</div>
      </section>
    );
    case "buttons": return <ButtonsBlock b={b} />;
    case "tabs": return <TabsBlock b={b} k={k} />;
    case "cards": return (
      <section>{b.title ? <h2 className="h2">{b.title}</h2> : null}
        <div className="grid2" style={{ gap: 10 }}>{b.items.map((c) => (
          <div key={c.title} className="card"><div className="row"><b className="purple grow">{c.title}</b>{c.badge ? <Badge kind={TONE_BADGE[c.tone ?? "info"]}>{c.badge}</Badge> : null}</div>{c.sub ? <div className="small muted">{c.sub}</div> : null}</div>
        ))}</div>
      </section>
    );
    case "pipeline": return <PipelineBlock b={b} />;
    case "kanban": return <KanbanBlock b={b} />;
    case "form": return <FormBlock b={b} />;
    case "steps": return <StepsBlock b={b} />;
    case "checklist": return <ChecklistBlock b={b} />;
    case "announce": return <AnnounceBlock b={b} />;
  }
}

/* ------------------------------------------------------------------ small pieces */
function ButtonsBlock({ b }: { b: Extract<Block, { t: "buttons" }> }) {
  const toast = useToast();
  return <div className="row" style={{ flexWrap: "wrap" }}>{b.buttons.map((x) => <button key={x.label} type="button" className={x.tone === "ghost" ? "btn ghost sm" : "btn purple sm"} onClick={() => toast(x.toast)}>{x.label}</button>)}</div>;
}

function TabsBlock({ b, k }: { b: Extract<Block, { t: "tabs" }>; k: string }) {
  const [i, setI] = useState(0);
  return (
    <div className="col g14">
      <div className="seg" role="tablist">{b.tabs.map((t, n) => <button key={t.label} type="button" role="tab" aria-selected={i === n} className={i === n ? "on" : undefined} onClick={() => setI(n)}>{t.label}</button>)}</div>
      {b.tabs[i].blocks.map((x, n) => <BlockView key={`${i}-${n}`} b={x} k={`${k}:${i}:${n}`} />)}
    </div>
  );
}

function TableBlock({ b }: { b: Extract<Block, { t: "table" }> }) {
  const [q, setQ] = useState("");
  const rows = b.rows.filter((r) => r.join(" ").toLowerCase().includes(q.toLowerCase()));
  return (
    <section className="col g14">
      {b.title ? <h2 className="h2">{b.title}</h2> : null}
      {b.search ? <input className="inp" type="search" placeholder="🔍 Cari" aria-label="Cari" value={q} onChange={(e) => setQ(e.target.value)} /> : null}
      <div className="tblwrap"><table className="tbl">
        <thead><tr>{b.columns.map((c) => <th key={c} scope="col">{c}</th>)}</tr></thead>
        <tbody>{rows.length ? rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{b.statusColumn === j ? <Badge kind={statusBadge(c)}>{c}</Badge> : c}</td>)}</tr>) : <tr><td colSpan={b.columns.length}>Belum ada data.</td></tr>}</tbody>
      </table></div>
    </section>
  );
}
const statusBadge = (s: string): BadgeKind => /lunas|hadir|selesai|terbit|aktif|diterima|disetujui|terverifikasi|ok/i.test(s) ? "selesai" : /tolak|batal|penuh|alpa|tidak/i.test(s) ? "rejected" : /draf|baru/i.test(s) ? "draft" : /wawancara|jadwal|ditinjau|berjalan/i.test(s) ? "interview" : "pending";

function FieldInput({ f, v, set, err }: { f: Field; v: string; set: (v: string) => void; err?: string }) {
  const id = `mk-${f.name}`;
  if (f.kind === "check") return (
    <label className="checkrow" style={{ cursor: "pointer" }}><input type="checkbox" checked={v === "1"} onChange={(e) => set(e.target.checked ? "1" : "")} /> <span>{f.label}</span>{err ? <span className="errmsg">{err}</span> : null}</label>
  );
  return (
    <div className="field">
      {f.kind === "chips" ? <span className="lbl">{f.label}</span> : <label htmlFor={id}>{f.label}{f.required ? " *" : ""}</label>}
      {f.kind === "textarea" ? <textarea id={id} className="ta" placeholder={f.placeholder} value={v} onChange={(e) => set(e.target.value)} />
        : f.kind === "select" ? <select id={id} className="sel" value={v} onChange={(e) => set(e.target.value)}><option value="">Pilih…</option>{f.options?.map((o) => <option key={o}>{o}</option>)}</select>
        : f.kind === "chips" ? <div className="chips">{f.options?.map((o) => { const on = v.split("|").includes(o); return <button type="button" key={o} className={`chip${on ? " on" : ""}`} aria-pressed={on} onClick={() => set((on ? v.split("|").filter((x) => x !== o) : [...v.split("|").filter(Boolean), o]).join("|"))}>{o}</button>; })}</div>
        : <input id={id} className="inp" type={f.kind === "tel" ? "tel" : f.kind === "date" ? "date" : f.kind === "time" ? "time" : f.kind === "number" ? "number" : "text"} placeholder={f.placeholder} value={v} onChange={(e) => set(e.target.value)} aria-invalid={err ? true : undefined} />}
      {f.help ? <span className="small muted">{f.help}</span> : null}
      {err ? <span className="errmsg" role="alert">{err}</span> : null}
    </div>
  );
}

function useFields(fields: Field[]) {
  const [vals, setVals] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.name, f.value ?? ""])));
  const [errs, setErrs] = useState<Record<string, string>>({});
  const validate = () => {
    const e: Record<string, string> = {};
    for (const f of fields) if (f.required && !vals[f.name]?.trim()) e[f.name] = f.error ?? `${f.label} belum diisi`;
    setErrs(e);
    return Object.keys(e).length === 0;
  };
  const reset = () => { setVals(Object.fromEntries(fields.map((f) => [f.name, f.value ?? ""]))); setErrs({}); };
  return { vals, errs, set: (n: string) => (v: string) => setVals((s) => ({ ...s, [n]: v })), validate, reset };
}

/* ------------------------------------------------------------------ pipeline */
function PipelineBlock({ b }: { b: Extract<Block, { t: "pipeline" }> }) {
  const toast = useToast();
  const [items, setItems] = useMock<Item[]>(`list:${b.id}`, b.items);
  const [add, setAdd] = useMock<Item[]>(`add:${b.id}`, []);
  // items created by a form (even on another screen) are merged in here, once
  useEffect(() => { if (add.length) { setItems((p) => [...add, ...p]); setAdd([]); } }, [add]); // eslint-disable-line react-hooks/exhaustive-deps
  const [filter, setFilter] = useState("Semua");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [asking, setAsking] = useState<{ id: string; a: ItemAction } | null>(null);
  const shown = items.filter((x) => (filter === "Semua" || x.status === filter) && `${x.title} ${x.sub ?? ""}`.toLowerCase().includes(q.toLowerCase()));
  const tone = (s: string): BadgeKind => { const t = b.tones?.[s]; if (t) return TONE_BADGE[t]; const i = b.statuses.indexOf(s); return i === 0 ? "pending" : i === b.statuses.length - 1 ? "selesai" : "interview"; };
  const apply = (id: string, a: ItemAction, extra?: Record<string, string>) => {
    setItems((p) => a.remove ? p.filter((x) => x.id !== id) : p.map((x) => x.id === id ? { ...x, status: a.to ?? x.status, meta: extra ? [...(x.meta ?? []), ...Object.entries(extra).filter(([, v]) => v)] : x.meta } : x));
    toast(a.toast);
  };
  return (
    <section className="col g14">
      {b.title ? <h2 className="h2">{b.title}</h2> : null}
      <div className="chips nowrap" role="group" aria-label="Filter status">
        {["Semua", ...b.statuses].map((s) => <button key={s} type="button" className={`chip sm${filter === s ? " on" : ""}`} aria-pressed={filter === s} onClick={() => setFilter(s)}>{s} ({s === "Semua" ? items.length : items.filter((x) => x.status === s).length})</button>)}
      </div>
      {b.search ? <input className="inp" type="search" placeholder="🔍 Cari" aria-label="Cari" value={q} onChange={(e) => setQ(e.target.value)} /> : null}
      {shown.length === 0 ? <div className="ghostbox">{b.empty ?? "Belum ada data."}</div> : shown.map((x) => (
        <article key={x.id} className="card col g8">
          <div className="row"><div className="grow"><b className="purple">{x.title}</b>{x.sub ? <div className="small muted">{x.sub}</div> : null}</div>{x.tag ? <span className="tag">{x.tag}</span> : null}<Badge kind={tone(x.status)}>{x.status}</Badge></div>
          {open === x.id ? (
            <div className="col g8">
              {x.body ? <p style={{ margin: 0 }}>{x.body}</p> : null}
              {x.meta?.length ? x.meta.map(([a, v], i) => <div key={i} className="kv"><span className="k">{a}</span><span>{v}</span></div>) : null}
            </div>
          ) : null}
          <div className="row" style={{ flexWrap: "wrap" }}>
            <button type="button" className="btn ghost sm" onClick={() => setOpen(open === x.id ? null : x.id)} aria-expanded={open === x.id}>{open === x.id ? "Tutup" : "Detail"}</button>
            {(b.actions[x.status] ?? []).map((a) => (
              <button key={a.label} type="button" className={a.tone === "danger" ? "btn red sm" : a.tone === "ghost" ? "btn ghost sm" : "btn purple sm"}
                onClick={() => (a.ask ? setAsking({ id: x.id, a }) : apply(x.id, a))}>{a.label}</button>
            ))}
          </div>
        </article>
      ))}
      {asking ? <AskModal a={asking.a} onClose={() => setAsking(null)} onDone={(vals) => { apply(asking.id, asking.a, vals); setAsking(null); }} /> : null}
    </section>
  );
}

function AskModal({ a, onClose, onDone }: { a: ItemAction; onClose: () => void; onDone: (v: Record<string, string>) => void }) {
  const f = useFields(a.ask ?? []);
  return (
    <Overlay kind="modal" title={a.label} onClose={onClose}>
      <h2 className="h2">{a.label}</h2>
      <div className="col g14">
        {a.ask?.map((x) => <FieldInput key={x.name} f={x} v={f.vals[x.name]} set={f.set(x.name)} err={f.errs[x.name]} />)}
        <div className="row"><button type="button" className="btn ghost grow" onClick={onClose}>Batal</button><button type="button" className="btn purple grow" onClick={() => { if (f.validate()) onDone(Object.fromEntries((a.ask ?? []).map((x) => [x.label, f.vals[x.name]]))); }}>{a.label}</button></div>
      </div>
    </Overlay>
  );
}

/* ------------------------------------------------------------------ kanban */
function KanbanBlock({ b }: { b: Extract<Block, { t: "kanban" }> }) {
  const toast = useToast();
  const [cards, setCards] = useMock<Item[]>(`list:${b.id}`, b.cards);
  const [adding, setAdding] = useState(false);
  const f = useFields(b.addForm ?? []);
  return (
    <section className="col g14">
      <div className="row">{b.title ? <h2 className="h2 grow">{b.title}</h2> : <span className="grow" />}{b.addForm ? <button type="button" className="btn purple sm" onClick={() => setAdding(true)}>+ Ide baru</button> : null}</div>
      <div className="grid4" style={{ alignItems: "start", gap: 10 }}>
        {b.columns.map((c) => (
          <div key={c} className="col g8" style={{ background: "var(--lilac)", borderRadius: 16, padding: 10 }}>
            <b className="purple">{c} <span className="small muted">({cards.filter((x) => x.status === c).length})</span></b>
            {cards.filter((x) => x.status === c).map((x) => (
              <div key={x.id} className="card col g8" style={{ padding: 10 }}>
                <b style={{ fontSize: 14 }}>{x.title}</b>{x.tag ? <span className="tag">{x.tag}</span> : null}{x.sub ? <span className="small muted">{x.sub}</span> : null}
                {b.next[c] ? <button type="button" className="btn purple sm" onClick={() => { setCards((p) => p.map((y) => y.id === x.id ? { ...y, status: b.next[c].to } : y)); toast(b.next[c].toast); }}>{b.next[c].label}</button> : null}
              </div>
            ))}
          </div>
        ))}
      </div>
      {adding ? (
        <Overlay kind="modal" title="Ide baru" onClose={() => setAdding(false)}>
          <h2 className="h2">Ide baru</h2>
          <div className="col g14">
            {b.addForm?.map((x) => <FieldInput key={x.name} f={x} v={f.vals[x.name]} set={f.set(x.name)} err={f.errs[x.name]} />)}
            <div className="row"><button type="button" className="btn ghost grow" onClick={() => setAdding(false)}>Batal</button>
              <button type="button" className="btn purple grow" onClick={() => { if (!f.validate()) return; setCards((p) => [...p, { id: `n${p.length + 1}`, title: f.vals.title || "Tanpa judul", tag: f.vals.format, sub: f.vals.owner, status: b.addTo ?? b.columns[0] }]); f.reset(); setAdding(false); toast("Kartu ditambahkan"); }}>Tambah</button></div>
          </div>
        </Overlay>
      ) : null}
    </section>
  );
}

/* ------------------------------------------------------------------ forms */
function FormBlock({ b }: { b: Extract<Block, { t: "form" }> }) {
  const toast = useToast();
  const f = useFields(b.fields);
  const [done, setDone] = useMock<string | null>(`done:${b.id}`, null);
  const [, setAdded] = useMock<Item[]>(`add:${b.into ?? b.id}`, []);
  if (done) return (
    <section className="card col g14 center" style={{ textAlign: "center" }}>
      <div style={{ fontSize: 40 }} aria-hidden="true">✅</div><h2 className="h2">{b.successTitle}</h2>
      {b.codePrefix ? <p className="stat" style={{ margin: 0 }}>{done}</p> : null}
      <p style={{ margin: 0 }}>{b.successText}</p>
      <button type="button" className="btn ghost" onClick={() => { setDone(null); f.reset(); }}>{b.resetLabel ?? "Kirim lagi"}</button>
    </section>
  );
  return (
    <section className="card col g14">
      {b.title ? <h2 className="h2">{b.title}</h2> : null}
      {b.intro ? <p className="muted" style={{ margin: 0 }}>{b.intro}</p> : null}
      {b.fields.map((x) => <FieldInput key={x.name} f={x} v={f.vals[x.name]} set={f.set(x.name)} err={f.errs[x.name]} />)}
      <button type="button" className="btn red block" onClick={() => {
        if (!f.validate()) { toast("Periksa isian yang ditandai", "err"); return; }
        const c = b.codePrefix ? code(b.codePrefix, 100 + Math.floor(Math.random() * 800)) : "";
        if (b.into) setAdded((p) => [{ id: `new-${p.length + 1}`, title: f.vals[b.fields[0].name] || "Baru", sub: c, status: b.intoStatus ?? "Baru", body: b.noBody ? undefined : Object.entries(f.vals).filter(([, v]) => v).map(([n, v]) => `${b.fields.find((y) => y.name === n)?.label}: ${v}`).join(" · ") }, ...p]);
        setDone(c || "ok");
      }}>{b.submit}</button>
    </section>
  );
}

function StepsBlock({ b }: { b: Extract<Block, { t: "steps" }> }) {
  const toast = useToast();
  const [step, setStep] = useMock<number>(`step:${b.id}`, 0);
  const [done, setDone] = useMock<string | null>(`done:${b.id}`, null);
  const allFields = useMemo(() => b.steps.flatMap((s) => [...(s.fields ?? []), ...(s.tabs?.flatMap((t) => t.fields) ?? [])]), [b.steps]);
  const f = useFields(allFields);
  const [tab, setTab] = useState(0);
  const cur = b.steps[step];
  const fields = cur.tabs ? cur.tabs[tab].fields : cur.fields ?? [];
  const words = cur.counter ? (f.vals[cur.counter.field] ?? "").trim().split(/\s+/).filter(Boolean).length : 0;
  if (done) return (
    <section className="card col g14" style={{ textAlign: "center" }}>
      <div style={{ fontSize: 40 }} aria-hidden="true">✅</div><h2 className="h2">{b.successTitle}</h2><p className="stat" style={{ margin: 0 }}>{done}</p><p style={{ margin: 0 }}>{b.successText}</p>
      <div className="row" style={{ justifyContent: "center" }}>{b.successHref ? <Link className="btn purple" href={b.successHref.href}>{b.successHref.label}</Link> : null}<button type="button" className="btn ghost" onClick={() => { setDone(null); setStep(0); f.reset(); }}>Mulai lagi</button></div>
    </section>
  );
  const validateStep = () => {
    const names = new Set([...(cur.fields ?? []), ...(cur.tabs?.flatMap((t) => t.fields) ?? [])].map((x) => x.name));
    const e: string[] = [];
    for (const x of allFields) if (names.has(x.name) && x.required && !f.vals[x.name]?.trim()) e.push(x.error ?? `${x.label} belum diisi`);
    return e;
  };
  return (
    <section className="card col g14">
      <div className="row" aria-label={`Langkah ${step + 1} dari ${b.steps.length}`}>{b.steps.map((s, i) => <span key={s.title} className={`chip sm${i === step ? " on" : i < step ? " done" : ""}`}>{i + 1}. {s.title}</span>)}</div>
      {cur.intro ? <p className="muted" style={{ margin: 0 }}>{cur.intro}</p> : null}
      {cur.tabs ? <div className="seg" role="tablist">{cur.tabs.map((t, n) => <button key={t.label} type="button" role="tab" aria-selected={tab === n} className={tab === n ? "on" : undefined} onClick={() => setTab(n)}>{t.label}</button>)}</div> : null}
      {fields.map((x) => <FieldInput key={x.name} f={x} v={f.vals[x.name]} set={f.set(x.name)} err={f.errs[x.name]} />)}
      {cur.counter ? <p className="small muted" style={{ margin: 0 }}>{words} kata{words < cur.counter.min ? ` · minimal ${cur.counter.min}` : ""} · tersimpan otomatis (contoh)</p> : null}
      <div className="row">
        {step > 0 ? <button type="button" className="btn ghost grow" onClick={() => setStep(step - 1)}>Kembali</button> : null}
        <button type="button" className="btn red grow" onClick={() => {
          const e = validateStep();
          if (e.length) { toast(e[0], "err"); f.validate(); return; }
          if (step < b.steps.length - 1) { setStep(step + 1); setTab(0); return; }
          setDone(code(b.codePrefix ?? "", 100 + Math.floor(Math.random() * 800)));
        }}>{step < b.steps.length - 1 ? "Lanjut" : "Kirim"}</button>
      </div>
    </section>
  );
}

function ChecklistBlock({ b }: { b: Extract<Block, { t: "checklist" }> }) {
  const toast = useToast();
  const [vals, setVals] = useMock<Record<string, string>>(`check:${b.id}`, {});
  const n = Object.values(vals).filter((v) => v === b.options[0]).length;
  return (
    <section className="col g14">
      {b.title ? <h2 className="h2">{b.title}</h2> : null}
      {b.rows.map((r) => (
        <div key={r.id} className="card row" style={{ padding: 10 }}>
          <div className="grow"><b className="purple">{r.name}</b>{r.sub ? <div className="small muted">{r.sub}</div> : null}</div>
          <div className="seg" role="radiogroup" aria-label={r.name} style={{ width: 70 * b.options.length }}>
            {b.options.map((o) => <button key={o} type="button" role="radio" aria-checked={vals[r.id] === o} className={vals[r.id] === o ? "on" : undefined} onClick={() => setVals({ ...vals, [r.id]: vals[r.id] === o ? "" : o })}>{o}</button>)}
          </div>
        </div>
      ))}
      <p className="small muted" aria-live="polite">{b.summary.replace("{n}", String(n)).replace("{total}", String(b.rows.length))}</p>
      <button type="button" className="btn purple block" onClick={() => toast(b.saveToast)}>{b.save}</button>
    </section>
  );
}

/* ------------------------------------------------------------------ pengumuman (CM-01..03) */
function AnnounceBlock({ b }: { b: Extract<Block, { t: "announce" }> }) {
  const toast = useToast();
  const [aud, setAud] = useState<string[]>([]);
  const [kelas, setKelas] = useState("");
  const [ch, setCh] = useState<string[]>(["Notifikasi"]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [hist, setHist] = useMock<string[][]>(`hist:${b.id}`, b.history);
  const blocked = b.audiences.some((a) => a.blocked && aud.includes(a.label));
  const count = b.audiences.filter((a) => aud.includes(a.label) && !a.blocked).reduce((n, a) => n + a.count, 0);
  const toggle = (list: string[], set: (v: string[]) => void, v: string) => set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  return (
    <div className="col g14">
      <section className="card col g14">
        <div className="field"><span className="lbl">Penerima (peran)</span>
          <div className="chips">{b.audiences.map((a) => <button key={a.label} type="button" className={`chip${aud.includes(a.label) ? " on" : ""}`} aria-pressed={aud.includes(a.label)} onClick={() => toggle(aud, setAud, a.label)}>{a.label}</button>)}</div></div>
        <div className="field"><label htmlFor="mk-kelas">Kelas SK</label><select id="mk-kelas" className="sel" value={kelas} onChange={(e) => setKelas(e.target.value)}><option value="">Semua kelas</option>{b.classes.map((c) => <option key={c}>{c}</option>)}</select></div>
        {blocked ? <div className="banner err" role="alert">Pesan massal ke Konseli tidak diizinkan demi privasi.</div> : <p className="small muted" aria-live="polite">Perkiraan penerima: <b>{count}</b> orang (hanya jumlah, tanpa nama)</p>}
        <div className="field"><label htmlFor="mk-sub">Judul</label><input id="mk-sub" className="inp" value={subject} onChange={(e) => setSubject(e.target.value)} /></div>
        <div className="field"><label htmlFor="mk-body">Isi pesan</label><textarea id="mk-body" className="ta" value={body} onChange={(e) => setBody(e.target.value)} /></div>
        <div className="field"><span className="lbl">Saluran</span><div className="chips">{b.channels.map((c) => <button key={c} type="button" className={`chip${ch.includes(c) ? " on" : ""}`} aria-pressed={ch.includes(c)} onClick={() => toggle(ch, setCh, c)}>{c}</button>)}</div>
          <span className="small muted">WhatsApp hanya untuk yang sudah setuju menerima.</span></div>
        {subject || body ? <div className="card" style={{ background: "var(--lilac)" }}><b>{subject || "Judul"}</b><p style={{ margin: "4px 0 0" }}>{body || "Isi pesan…"}</p><span className="small muted">Pratinjau di ponsel</span></div> : null}
        <button type="button" className="btn red block" disabled={blocked || !subject.trim() || !aud.length} onClick={() => { setHist([[subject, aud.join(", "), String(count), ch.join(", "), "Baru saja"], ...hist]); setSubject(""); setBody(""); toast("Pengumuman terkirim (contoh). Di produksi perlu persetujuan Pengurus."); }}>Kirim sekarang</button>
      </section>
      <TableBlock b={{ t: "table", title: "Riwayat", columns: ["Judul", "Penerima", "Jumlah", "Saluran", "Waktu"], rows: hist }} />
    </div>
  );
}
