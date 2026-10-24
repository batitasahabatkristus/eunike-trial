import Link from "next/link";
import { addDays, fmtYmd } from "@/lib/dates";
import { assetUrl } from "@/lib/sk";
import { Badge } from "@/components/ui/bits";
import { STATUS } from "@/components/app/MaterialTable";
import { ScheduleActions } from "@/components/app/ScheduleActions";

export interface CalLesson { id: string; number: number; title: string; status: string; day: string | null; publish_at: string | null; thumbnail_path: string | null }

const monthShift = (m: string, n: number) => { const d = new Date(`${m}-01T00:00:00Z`); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 7); };

/** KU-03. Month grid with colored lessons and a detail panel. `admin` adds Jadwalkan / Batalkan jadwal. */
export function PublishCalendar({ month, selected, lessons, base, admin }: { month: string; selected: string | null; lessons: CalLesson[]; base: string; admin: boolean }) {
  const first = `${month}-01`;
  const startDow = new Date(`${first}T00:00:00Z`).getUTCDay();
  const days = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).getUTCDate();
  const cells = Array.from({ length: Math.ceil((startDow + days) / 7) * 7 }, (_, i) => { const n = i - startDow + 1; return n >= 1 && n <= days ? addDays(first, n - 1) : null; });
  const by = new Map<string, CalLesson[]>();
  for (const l of lessons) if (l.day) by.set(l.day, [...(by.get(l.day) ?? []), l]);
  const sel = selected && by.has(selected) ? selected : [...by.keys()].filter((k) => k.startsWith(month)).sort()[0] ?? null;
  const cur = sel ? by.get(sel) ?? [] : [];
  return (
    <div className="g21">
      <section className="card" aria-label={`Kalender ${fmtYmd(first, { month: "long", year: "numeric" })}`}>
        <div className="row between mb8">
          <Link className="btn ghost sm" href={`${base}?bln=${monthShift(month, -1)}`} aria-label="Bulan sebelumnya">‹</Link>
          <h2 className="h2">{fmtYmd(first, { month: "long", year: "numeric" })}</h2>
          <Link className="btn ghost sm" href={`${base}?bln=${monthShift(month, 1)}`} aria-label="Bulan berikutnya">›</Link>
        </div>
        <div className="cal">
          {["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"].map((x) => <div key={x} className="hd">{x}</div>)}
          {cells.map((c, i) => c ? (
            <Link key={c} href={`${base}?bln=${month}&hari=${c}`} className={`d${c === sel ? " sel" : ""}`} aria-label={`${fmtYmd(c)}${by.get(c) ? `, ${by.get(c)!.length} materi` : ""}`}>{Number(c.slice(8))}
              {(by.get(c) ?? []).map((l) => <span key={l.id} className={`ev ${l.status}`}>Pelajaran {l.number}<br />{STATUS[l.status]?.[0]}</span>)}</Link>
          ) : <div key={`e${i}`} className="d off" aria-hidden="true" />)}
        </div>
      </section>
      <section className="card" aria-label="Detail materi">
        <h2 className="h2">Detail materi</h2>
        {cur.length === 0 ? <p className="muted small mt8">Pilih tanggal yang berisi materi.</p> : cur.map((l) => (
          <div key={l.id} className="mt8">
            {l.thumbnail_path /* eslint-disable-next-line @next/next/no-img-element */ ? <img src={assetUrl(l.thumbnail_path)} alt="" style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 12 }} /> : <div className="photo" style={{ height: 110 }} aria-hidden="true">FOTO</div>}
            <h3 className="h2 mt8" style={{ fontSize: 24 }}>Pelajaran {l.number}</h3><div className="muted">{l.title}</div>
            <div className="small mt8">Terbit: {l.publish_at ? fmtYmd(l.day!, { day: "numeric", month: "long", year: "numeric" }) : "-"}</div>
            <div className="mt8"><Badge kind={STATUS[l.status]?.[1] ?? "draft"}>{STATUS[l.status]?.[0]}</Badge></div>
            {admin ? <ScheduleActions id={l.id} status={l.status} review /> : <div className="mt12"><Link className="btn ghost block" href={`/sk/kurikulum/materi/${l.id}`}>Buka editor</Link></div>}
          </div>
        ))}
      </section>
    </div>
  );
}
