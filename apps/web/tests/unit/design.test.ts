import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import id from "@/messages/id.json";
import en from "@/messages/en.json";

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

describe("contrast (F-07, WCAG AA 4.5:1 for text)", () => {
  const pairs: [string, string, string][] = [
    ["white on pink button", "#ffffff", "#dd188a"],
    ["body ink on paper", "#392340", "#fff9f6"],
    ["muted on paper", "#6f5b73", "#fff9f6"],
    ["muted on cream", "#6f5b73", "#feece2"],
    ["small pink text on cream", "#bc0f74", "#feece2"],
    ["small pink text on paper", "#bc0f74", "#fff9f6"],
    ["purple link on paper", "#612e8f", "#fff9f6"],
    ["white on purple", "#ffffff", "#612e8f"],
    ["mission/belief numbers on pink-soft", "#bc0f74", "#fad9e8"],
    ["dimmed inactive language label (72% purple-deep on paper)", "#7d6392", "#fff9f6"],
    ["SK body text on SK bg", "#2a1740", "#fff2f6"],
    ["SK white on red action", "#ffffff", "#dd1f4a"],
  ];
  it.each(pairs)("%s", (_n, fg, bg) => expect(ratio(fg, bg)).toBeGreaterThanOrEqual(4.5));

  it("documents why raw --pink is not used for small text on cream", () => {
    expect(ratio("#dd188a", "#feece2")).toBeLessThan(4.5);
  });
});

describe("tokens (PRD §5.1 must not drift)", () => {
  const css = fs.readFileSync(path.join(__dirname, "../../app/globals.css"), "utf8");
  const site = fs.readFileSync(path.join(__dirname, "../../app/(public)/site.css"), "utf8");
  const proto = fs.readFileSync(path.join(__dirname, "../../../../reference/website-prototype/styles.css"), "utf8");
  it("site.css keeps every token of the approved prototype", () => {
    const tokens = proto.match(/--[\w-]+:\s*[^;]+;/g) ?? [];
    expect(tokens.length).toBeGreaterThan(15);
    for (const t of tokens) expect(site.replace(/\s+/g, " ")).toContain(t.replace(/\s+/g, " "));
  });
  it.each([
    ["--purple", "#612e8f"], ["--purple-2", "#8f4698"], ["--purple-deep", "#452063"], ["--lilac", "#d9c7e1"],
    ["--pink", "#dd188a"], ["--pink-bright", "#f23da2"], ["--pink-soft", "#fad9e8"], ["--peach", "#fcd3c9"],
    ["--cream", "#feece2"], ["--paper", "#fff9f6"], ["--ink", "#392340"], ["--muted", "#6f5b73"], ["--yellow", "#f5c64b"],
  ])("%s", (name, value) => expect(css).toContain(`${name}: ${value};`));
});

describe("translations", () => {
  const keys = (o: unknown, p = ""): string[] =>
    Array.isArray(o) ? o.flatMap((v, i) => keys(v, `${p}[${i}]`))
    : o && typeof o === "object" ? Object.entries(o).flatMap(([k, v]) => keys(v, p ? `${p}.${k}` : k))
    : [p];
  it("English and Indonesian have identical keys", () => expect(keys(en).sort()).toEqual(keys(id).sort()));
  it("no design-brief wording ships as public copy (F-01)", () => {
    const values = (o: unknown): string[] =>
      typeof o === "string" ? [o] : o && typeof o === "object" ? Object.values(o).flatMap(values) : [];
    const all = values([id, en]).join("\n").toLowerCase();
    for (const bad of ["visual direction", "stock photography", "the website should", "lorem", "design brief"]) expect(all).not.toContain(bad);
  });
});
