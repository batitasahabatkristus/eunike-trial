"use client";

import { useEffect, useRef } from "react";

/** Sheet (mobile), Modal and Drawer share one accessible shell: Escape and backdrop close, focus moves in and returns. */
export function Overlay({ kind = "sheet", title, onClose, children }: { kind?: "sheet" | "modal" | "drawer"; title: string; onClose: () => void; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    box.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && box.current) {
        const f = Array.from(box.current.querySelectorAll<HTMLElement>("a,button,input,select,textarea,[tabindex]:not([tabindex='-1'])")).filter((x) => !x.hasAttribute("disabled"));
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === box.current) { e.preventDefault(); last.focus(); }
        else if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", key);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", key); document.body.style.overflow = ""; prev?.focus(); };
  }, [onClose]);
  const cls = kind === "modal" ? "overlay center" : kind === "drawer" ? "overlay right" : "overlay";
  return (
    <div className={cls} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={box} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1} className={kind === "modal" ? "modal" : kind === "drawer" ? "drawer" : "sheet"} style={{ outline: "none" }}>
        {kind === "sheet" ? <div className="grab" /> : null}
        {children}
      </div>
    </div>
  );
}
