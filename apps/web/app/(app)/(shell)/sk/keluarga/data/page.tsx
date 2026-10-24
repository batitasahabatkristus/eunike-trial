import type { Metadata } from "next";
import Link from "next/link";
import { loadSkPage } from "@/lib/sk-page";
import { ageText, Banner, Empty } from "@/components/ui/bits";
import { relLabel } from "@/lib/family";
import { DataKeluargaForm } from "@/components/app/DataKeluargaForm";

export const metadata: Metadata = { title: "Data Keluarga" };

/** SK-03: confirm, or send a correction that Admin SK resolves. */
export default async function DataKeluarga() {
  const ctx = await loadSkPage("/sk/keluarga/data", undefined);
  if (!ctx) return null;
  const { family } = ctx;
  if (!family) return <Empty>Keluarga belum terhubung.</Empty>;
  const wa = family.wa_number ? `+${family.wa_number.replace(/^(\d{2})(\d{3})(\d{4})(\d+)$/, "$1 $2 $3 $4")}` : "-";
  const rows: [string, string, string][] = [
    ...family.members.filter((m) => m.relation !== "anak").map((m) => ["👤", relLabel(m.relation), m.display_name] as [string, string, string]),
    ["📞", "WhatsApp", wa],
    ...family.children.map((c) => ["🧒", "Anak", `${c.name}, ${ageText(c.dob)}`] as [string, string, string]),
    ["📖", "Kelas", family.klass?.name ?? "-"],
  ];
  return (
    <div className="col g14">
      <div className="hdr"><Link className="back" href="/sk/keluarga" aria-label="Kembali">‹</Link><h1 className="t">Data Keluarga</h1></div>
      {family.data_status === "cor" ? <Banner kind="info">✈ Koreksi terkirim. Admin akan memeriksa.</Banner> : null}
      <section className="card" aria-label="Data keluarga">{rows.map(([i, k, v], n) => <div key={n} className="kv"><div className="ic-c" aria-hidden="true">{i}</div><span className="k">{k}:</span><span>{v}</span></div>)}</section>
      <DataKeluargaForm />
    </div>
  );
}
