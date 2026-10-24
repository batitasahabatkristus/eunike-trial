import { ImageResponse } from "next/og";
import { getSession } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { loadFamily } from "@/lib/family";
import { cardToken, qrSvg } from "@/lib/qr";

/** "Simpan ke galeri": the member card as a PNG, only for the signed-in family. */
export async function GET() {
  const session = await getSession();
  if (!session || !session.roles.includes("parent")) return new Response("Forbidden", { status: 403 });
  const family = await asUser(session.userId, (q) => loadFamily(q, session.userId));
  if (!family) return new Response("Not found", { status: 404 });
  const qr = `data:image/svg+xml;base64,${Buffer.from(await qrSvg(cardToken(family.id), 360)).toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#FEECE2", color: "#392340", fontFamily: "sans-serif" }}>
        <div style={{ fontSize: 28, color: "#DD188A", fontWeight: 700 }}>Yayasan Eunike</div>
        <div style={{ fontSize: 64, fontWeight: 800, color: "#612E8F", marginTop: 8 }}>{`Keluarga ${family.name}`}</div>
        <div style={{ fontSize: 28, marginTop: 8 }}>{`Kode anggota: ${family.member_code ?? "-"}`}</div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qr} width={360} height={360} alt="" style={{ marginTop: 28, background: "#fff", padding: 20, borderRadius: 24 }} />
        <div style={{ fontSize: 24, marginTop: 20 }}>{family.klass ? `SK Batita, Kelas ${family.klass.name}` : "Sahabat Kristus"}</div>
      </div>
    ),
    { width: 900, height: 1200, headers: { "Content-Disposition": `attachment; filename="kartu-keluarga-${family.name}.png"`, "Cache-Control": "private, no-store" } },
  );
}
