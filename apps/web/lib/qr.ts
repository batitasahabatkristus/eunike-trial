import "server-only";
import crypto from "node:crypto";
import QRCode from "qrcode";

// Member-card QR (CO-04): signed, so it cannot be guessed or forged. Event check-in (Phase 4) verifies the same token.
const secret = () => {
  const s = process.env.CARD_QR_SECRET;
  if (!s && process.env.NODE_ENV === "production") throw new Error("CARD_QR_SECRET is required in production");
  return s ?? "dev-card-secret-not-for-production";
};
const sign = (id: string) => crypto.createHmac("sha256", secret()).update(`card:v1:${id}`).digest("base64url").slice(0, 22);
export const cardToken = (familyId: string) => `EUN1.${familyId}.${sign(familyId)}`;
export function verifyCardToken(token: string): string | null {
  const [v, id, sig] = token.split(".");
  if (v !== "EUN1" || !id || !sig) return null;
  const want = Buffer.from(sign(id)), got = Buffer.from(sig);
  return want.length === got.length && crypto.timingSafeEqual(want, got) ? id : null;
}
export const qrSvg = (text: string, size = 220) => QRCode.toString(text, { type: "svg", margin: 0, width: size, color: { dark: "#392340", light: "#ffffff" } });
