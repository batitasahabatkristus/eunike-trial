/** Normalises Indonesian numbers to 62xxxxxxxx so 0812…, +62812… and 62812… all match one stored form. */
export function normalizePhone(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (d.startsWith("62")) return d;
  if (d.startsWith("0")) return `62${d.slice(1)}`;
  return `62${d}`;
}
