/**
 * Mockup screens (PRD modules that are not built yet). A screen is plain data; <MockScreen> turns it into clickable UI.
 * Everything here is SAMPLE CONTENT: nothing is saved, nothing is secured, and it is only shown on previews (devAuthEnabled()).
 */
export type Tone = "ok" | "warn" | "bad" | "info" | "muted";

export interface Field {
  name: string;
  label: string;
  kind?: "text" | "textarea" | "select" | "chips" | "check" | "date" | "tel" | "time" | "number";
  options?: string[];
  required?: boolean;
  placeholder?: string;
  help?: string;
  /** error text when required and empty, e.g. "Nomor WA belum diisi" */
  error?: string;
  value?: string;
}

export interface Item {
  id: string;
  title: string;
  sub?: string;
  status: string;
  /** small label/value pairs shown in the detail panel */
  meta?: [string, string][];
  body?: string;
  tag?: string;
}

export interface ItemAction {
  label: string;
  /** new status, or omitted to keep it */
  to?: string;
  toast: string;
  tone?: "primary" | "ghost" | "danger";
  /** when set, a small form opens first and its values are appended to the item's detail */
  ask?: Field[];
  /** remove the item from the list */
  remove?: boolean;
}

export type Block =
  | { t: "notice"; tone?: "info" | "warn" | "err" | "ok"; text: string; lock?: boolean }
  | { t: "stats"; items: { label: string; value: string; hint?: string; tone?: Tone }[] }
  | { t: "kv"; title?: string; rows: [string, string][] }
  | { t: "table"; title?: string; columns: string[]; rows: string[][]; search?: boolean; statusColumn?: number }
  | { t: "bars"; title?: string; bars: { label: string; value: number; display?: string }[] }
  | { t: "timeline"; title?: string; steps: { label: string; state: "done" | "now" | "todo"; note?: string }[] }
  | { t: "buttons"; buttons: { label: string; toast: string; tone?: "primary" | "ghost" }[] }
  | { t: "tabs"; tabs: { label: string; blocks: Block[] }[] }
  | { t: "cards"; title?: string; items: { title: string; sub?: string; badge?: string; tone?: Tone }[] }
  | {
      t: "pipeline"; id: string; title?: string; statuses: string[]; items: Item[];
      actions: Record<string, ItemAction[]>; search?: boolean; empty?: string; tones?: Record<string, Tone>;
    }
  | {
      t: "kanban"; id: string; title?: string; columns: string[]; cards: Item[]; next: Record<string, { label: string; to: string; toast: string }>;
      addForm?: Field[]; addTo?: string;
    }
  | {
      t: "form"; id: string; title?: string; intro?: string; fields: Field[]; submit: string;
      /** pipeline/kanban list id that receives the new item (optional) */
      into?: string; intoStatus?: string; successTitle: string; successText: string; codePrefix?: string; resetLabel?: string;
      /** do not copy what was typed into the list item (counseling stories must never reach the admin list) */
      noBody?: boolean;
    }
  | {
      t: "steps"; id: string; steps: { title: string; intro?: string; tabs?: { label: string; fields: Field[] }[]; fields?: Field[]; counter?: { field: string; min: number } }[];
      successTitle: string; successText: string; codePrefix?: string; successHref?: { href: string; label: string };
    }
  | { t: "announce"; id: string; audiences: { label: string; count: number; blocked?: boolean }[]; classes: string[]; channels: string[]; history: string[][] }
  | {
      t: "checklist"; id: string; title?: string; rows: { id: string; name: string; sub?: string }[]; options: string[]; summary: string; save: string; saveToast: string;
    };

export interface Screen {
  title: string;
  subtitle?: string;
  /** requirement ids shown in the footer, for the reviewer */
  reqs?: string[];
  blocks: Block[];
}
