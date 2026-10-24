"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Kind = "ok" | "err";
const Ctx = createContext<(msg: string, kind?: Kind) => void>(() => undefined);
export const useToast = () => useContext(Ctx);

/** Toasts confirm saves (PRD §5.3). One at a time; announced politely to screen readers. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [t, setT] = useState<{ msg: string; kind: Kind } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((msg: string, kind: Kind = "ok") => {
    setT({ msg, kind });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setT(null), 3200);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <Ctx.Provider value={show}>
      {children}
      <div role="status" aria-live="polite">
        {t ? <div className="toast" style={t.kind === "err" ? { background: "#9b1c1c" } : undefined}>{t.msg}</div> : null}
      </div>
    </Ctx.Provider>
  );
}

export interface ActionResult { ok: boolean; message?: string; }

/** Runs a server action, toasts its message, refreshes server data. */
export function useRun() {
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();
  const run = useCallback(
    (fn: () => Promise<ActionResult | void>, opts: { refresh?: boolean; after?: (r: ActionResult | void) => void } = {}) =>
      start(async () => {
        try {
          const r = await fn();
          if (r && r.message) toast(r.message, r.ok ? "ok" : "err");
          if (opts.refresh !== false) router.refresh();
          opts.after?.(r);
        } catch {
          toast("Terjadi kesalahan. Coba lagi.", "err");
        }
      }),
    [router, toast],
  );
  return { run, pending };
}
