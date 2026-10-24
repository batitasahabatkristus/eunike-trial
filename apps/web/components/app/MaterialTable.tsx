import Link from "next/link";
import { assetUrl } from "@/lib/sk";
import { Badge, idDate, type BadgeKind } from "@/components/ui/bits";

export const STATUS: Record<string, [string, BadgeKind]> = { draft: ["Draf", "draft"], review: ["Menunggu tinjau", "interview"], scheduled: ["Terjadwal", "terjadwal"], published: ["Terbit", "terbit"] };
export const FILTERS: [string, string | null][] = [["Semua", null], ["Draf", "draft"], ["Terjadwal", "scheduled"], ["Terbit", "published"], ["Ditinjau", "review"]];
export interface Material { id: string; number: number; title: string; status: string; publish_at: string | null; updated_at: string; thumbnail_path: string | null }

/** KU-01 / AD-06 list. `base` decides where "Edit" or "Tinjau" goes. */
export function MaterialTable({ rows, base, action }: { rows: Material[]; base: string; action: string }) {
  return (
    <div className="tblwrap">
      <table className="tbl">
        <thead><tr><th scope="col">No</th><th scope="col">Judul</th><th scope="col">Status</th><th scope="col">Tanggal terbit</th><th scope="col">Diperbarui</th><th scope="col">Aksi</th></tr></thead>
        <tbody>
          {rows.length === 0 ? <tr><td colSpan={6} className="center muted">Belum ada materi untuk filter ini.</td></tr> : rows.map((m) => (
            <tr key={m.id}>
              <td>{m.number}</td>
              <td><div className="row">{m.thumbnail_path /* eslint-disable-next-line @next/next/no-img-element */ ? <img src={assetUrl(m.thumbnail_path)} alt="" width={74} height={46} style={{ objectFit: "cover", borderRadius: 10 }} loading="lazy" /> : <div className="photo" style={{ width: 74, height: 46, fontSize: 11 }} aria-hidden="true">FOTO</div>}<b className="purple">{m.title}</b></div></td>
              <td><Badge kind={STATUS[m.status]?.[1] ?? "draft"}>{STATUS[m.status]?.[0] ?? m.status}</Badge></td>
              <td>{m.publish_at ? idDate(m.publish_at) : "-"}</td><td>{idDate(m.updated_at)}</td>
              <td><Link className="btn ghost sm" href={`${base}/${m.id}`}>{action}</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
