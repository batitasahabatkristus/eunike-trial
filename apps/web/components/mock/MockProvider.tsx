"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Store = Record<string, unknown>;
const Ctx = createContext<{ store: Store; set: (k: string, v: unknown) => void } | null>(null);

/** Mockup state lives here: it survives clicking between screens and is gone on reload. Nothing is sent to a server. */
export function MockProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<Store>({});
  const set = useCallback((k: string, v: unknown) => setStore((s) => ({ ...s, [k]: v })), []);
  const value = useMemo(() => ({ store, set }), [store, set]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMock<T>(key: string, initial: T): [T, (v: T | ((p: T) => T)) => void] {
  const c = useContext(Ctx);
  const [local, setLocal] = useState<T>(initial);
  if (!c) return [local, setLocal]; // outside a provider (should not happen) the state is just local
  const cur = (key in c.store ? c.store[key] : initial) as T;
  const setter = (v: T | ((p: T) => T)) => c.set(key, typeof v === "function" ? (v as (p: T) => T)(cur) : v);
  return [cur, setter];
}
