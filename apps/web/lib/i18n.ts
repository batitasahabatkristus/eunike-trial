import id from "@/messages/id.json";
import en from "@/messages/en.json";
import type { Locale } from "@/lib/routes";

export type Messages = typeof id;
const catalog: Record<Locale, Messages> = { id, en };

export const getMessages = (locale: Locale): Messages => catalog[locale];
/** App UI is Indonesian first (PRD §0.1). */
export const appMessages = (): Messages["app"] => id.app;

export const fmt = (s: string, vars: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? ""));
