import "server-only";
import crypto from "node:crypto";
import { cookies } from "next/headers";

// After a correct family PIN the report stays open for 15 minutes on this device (SK-12). Signed, httpOnly, family-bound.
const secret = () => process.env.CARD_QR_SECRET ?? "dev-card-secret-not-for-production";
const name = (fid: string) => `eunike_epk_${fid.slice(0, 8)}`;
const sig = (fid: string, exp: number, uid: string) => crypto.createHmac("sha256", secret()).update(`epk:${fid}:${uid}:${exp}`).digest("base64url");

export async function openPinGate(familyId: string, userId: string) {
  const exp = Date.now() + 15 * 60 * 1000;
  (await cookies()).set(name(familyId), `${exp}.${sig(familyId, exp, userId)}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/beranda/laporan", maxAge: 15 * 60 });
}
export async function pinGateOpen(familyId: string, userId: string): Promise<boolean> {
  const v = (await cookies()).get(name(familyId))?.value;
  if (!v) return false;
  const [expS, s] = v.split(".");
  const exp = Number(expS);
  if (!Number.isFinite(exp) || exp < Date.now() || !s) return false;
  const want = Buffer.from(sig(familyId, exp, userId)), got = Buffer.from(s);
  return want.length === got.length && crypto.timingSafeEqual(want, got);
}
