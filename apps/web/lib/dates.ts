// Calendar-day helpers in Asia/Jakarta. Dates travel as 'YYYY-MM-DD' strings (cast `::text` in SQL) so no timezone shifts creep in.
const TZ = "Asia/Jakarta";
export const todayJakarta = (now = new Date()): string => new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
export const hourJakarta = (now = new Date()): number => Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }).format(now));

const toUtc = (ymd: string) => new Date(`${ymd}T00:00:00Z`);
export const addDays = (ymd: string, n: number): string => new Date(toUtc(ymd).getTime() + n * 86400000).toISOString().slice(0, 10);
export const isYmd = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(toUtc(v).getTime());

/** Sunday-first week containing `ymd` (the demo's strip starts on Min). */
export function weekOf(ymd: string): { ymd: string; dow: string; day: number }[] {
  const d = toUtc(ymd), start = addDays(ymd, -d.getUTCDay());
  const names = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
  return names.map((dow, i) => { const y = addDays(start, i); return { ymd: y, dow, day: Number(y.slice(8)) }; });
}
export const fmtYmd = (ymd: string, opts: Intl.DateTimeFormatOptions = { weekday: "long", day: "numeric", month: "long" }) =>
  new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", ...opts }).format(toUtc(ymd));
export const greeting = (hour: number) => (hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 18 ? "Selamat sore" : "Selamat malam");
/** the Saturday on or after `ymd` */
export const nextSaturday = (ymd: string) => addDays(ymd, (6 - toUtc(ymd).getUTCDay() + 7) % 7);
