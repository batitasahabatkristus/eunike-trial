import Link from "next/link";
import type { GuruClass } from "@/lib/guru";

/** Only renders for a guru with more than one class. */
export function ClassSwitch({ classes, current, base }: { classes: GuruClass[]; current: GuruClass | null; base: string }) {
  if (classes.length < 2) return null;
  return <nav className="chips" aria-label="Pilih kelas">{classes.map((c) => <Link key={c.id} className={`chip${c.id === current?.id ? " on" : ""}`} href={`${base}?k=${encodeURIComponent(c.name)}`}>Kelas {c.name}</Link>)}</nav>;
}
