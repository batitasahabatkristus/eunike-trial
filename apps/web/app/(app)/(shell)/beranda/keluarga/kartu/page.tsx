import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { ageText, Badge } from "@/components/ui/bits";
import { loadFamily, relLabel } from "@/lib/family";
import { cardToken, qrSvg } from "@/lib/qr";

export const metadata: Metadata = { title: "Kartu anggota" };

export default async function Kartu() {
  const session = await guard("/beranda/keluarga/kartu");
  if (!session) return null;
  const family = await asUser(session.userId, (q) => loadFamily(q, session.userId));
  if (!family) return <div className="page-narrow"><div className="ghostbox">Keluarga belum terhubung.</div></div>;
  const svg = await qrSvg(cardToken(family.id), 220);
  const names = [...family.members.filter((m) => m.relation !== "anak").map((m) => `${relLabel(m.relation)} ${m.display_name}`), ...family.children.map((c) => `${c.name} (${ageText(c.dob)})`)].join(", ");
  return (
    <div className="page-narrow col g14">
      <div className="hdr"><Link className="back" href="/beranda/keluarga" aria-label="Kembali">‹</Link><h1 className="t">Kartu anggota</h1></div>
      <section className="card center" aria-label="Kartu anggota">
        <Image src="/assets/site/eunike-logo.png" alt="Yayasan Eunike" width={96} height={107} style={{ height: 56, width: "auto", margin: "0 auto" }} />
        <div className="h1 mt8" style={{ fontSize: 30 }}>Keluarga {family.name}</div>
        <div className="muted small">Kode anggota: {family.member_code ?? "-"}</div>
        <div className="qr mt12" role="img" aria-label={`Kode QR keluarga ${family.name}`} dangerouslySetInnerHTML={{ __html: svg }} />
        <div className="card lilac mt12 row"><div className="ic-c" aria-hidden="true">👨‍👩‍👧</div><b className="purple">{names}</b></div>
        {family.klass ? <div className="mt8"><Badge kind="need">SK Batita, Kelas {family.klass.name}</Badge></div> : null}
      </section>
      <p className="center muted small">Tunjukkan kode ini saat check-in</p>
      <a className="btn ghost block" href="/beranda/keluarga/kartu/gambar" download={`kartu-keluarga-${family.name}.png`}>⬇ Simpan ke galeri</a>
    </div>
  );
}
