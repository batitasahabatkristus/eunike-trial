"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/** Recent searches live in this browser only (a per-viewer convenience, PRD browser-storage rule). */
export function SearchRecents({ current }: { current: string }) {
  const [list, setList] = useState<string[]>([]);
  useEffect(() => {
    try {
      const prev: string[] = JSON.parse(localStorage.getItem("eunike.recent") ?? "[]");
      const next = current ? [current, ...prev.filter((x) => x !== current)].slice(0, 5) : prev;
      if (current) localStorage.setItem("eunike.recent", JSON.stringify(next));
      // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is browser-only; read after mount
      setList(next);
    } catch { /* storage blocked: render without recents */ }
  }, [current]);
  if (!list.length) return null;
  return (
    <div className="chips" aria-label="Pencarian terakhir">
      <span className="small muted" style={{ fontWeight: 800, alignSelf: "center" }}>Pencarian terakhir:</span>
      {list.map((x) => <Link key={x} className="chip" href={`/beranda/cari?q=${encodeURIComponent(x)}`}>🕘 {x}</Link>)}
    </div>
  );
}
