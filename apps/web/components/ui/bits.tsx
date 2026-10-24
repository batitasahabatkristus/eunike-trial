import type { ReactNode } from "react";

export type BadgeKind = "pending" | "need" | "interview" | "selesai" | "active" | "rejected" | "batal" | "draft" | "terbit" | "terjadwal" | "baru" | "ok" | "warn" | "lock";
export const Badge = ({ kind, children }: { kind: BadgeKind; children: ReactNode }) => <span className={`badge b-${kind}`}>{children}</span>;
export const Avatar = ({ text, sm, lilac }: { text: string; sm?: boolean; lilac?: boolean }) => (
  <div className={`avatar${sm ? " sm" : ""}${lilac ? " lilac" : ""}`} aria-hidden="true">{text.charAt(0).toUpperCase()}</div>
);
export const ProgressBar = ({ value, label }: { value: number; label?: string }) => (
  <div className="prog" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label}><i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></div>
);
export const Banner = ({ kind = "info", children }: { kind?: "info" | "warn" | "err" | "ok"; children: ReactNode }) => <div className={`banner ${kind}`} role={kind === "err" ? "alert" : undefined}>{children}</div>;
export const Empty = ({ children }: { children: ReactNode }) => <div className="ghostbox">{children}</div>;

/** age text from a date of birth, Indonesian: "2 tahun" or "11 bulan" */
export function ageText(dob: string | Date, now = new Date()): string {
  const d = new Date(dob);
  let months = (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
  if (now.getDate() < d.getDate()) months -= 1;
  return months < 24 ? `${Math.max(months, 0)} bulan` : `${Math.floor(months / 12)} tahun`;
}
export const idDate = (d: string | Date, opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" }) =>
  new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", ...opts }).format(new Date(d));
export const idTime = (d: string | Date) => new Intl.DateTimeFormat("id-ID", { timeZone: "Asia/Jakarta", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(d)).replace(":", ".");
export const idDateTime = (d: string | Date) => `${idDate(d, { weekday: "long", day: "2-digit", month: "short" })} ${idTime(d)}`;
export function relDay(d: string | Date): "Hari ini" | "Kemarin" | "Sebelumnya" {
  const key = (x: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(x);
  const now = new Date(), t = key(new Date(d));
  if (t === key(now)) return "Hari ini";
  if (t === key(new Date(now.getTime() - 86400000))) return "Kemarin";
  return "Sebelumnya";
}
