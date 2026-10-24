import { describe, expect, it } from "vitest";
import { cardToken, verifyCardToken } from "@/lib/qr";
import { completeness, lessonPayload, TEMPLATE_STEPS } from "@/lib/lesson-schema";
import { describeAudit } from "@/lib/audit-text";
import { toYmd } from "@/lib/family-import";
import { parseCsv, ymd } from "../../scripts/import-pilot";

const ID = "00000000-0000-4000-8000-000000000101";

describe("member card token (CO-04)", () => {
  it("round-trips", () => expect(verifyCardToken(cardToken(ID))).toBe(ID));
  it("rejects a tampered id or signature", () => {
    const t = cardToken(ID);
    expect(verifyCardToken(t.replace("0101", "0102"))).toBeNull();
    expect(verifyCardToken(t.slice(0, -2) + "xx")).toBeNull();
    expect(verifyCardToken("EUN1." + ID)).toBeNull();
    expect(verifyCardToken("")).toBeNull();
  });
});

describe("lesson completeness (KU-02)", () => {
  const full = () => ({
    number: 20, title: "Judul", short_title: "J", truth: "t", goal: "g", verse_text: "ayat", verse_ref: "Yoh 3:16",
    publish_local: "2026-11-01T08:00", thumbnail_path: null,
    steps: TEMPLATE_STEPS.map(([title, kind], i) => ({ title, body: "x", kind: kind as never, story_scene: kind === "story" ? (i % 5) + 1 : null, video_url: null })),
    scenes: Array.from({ length: 5 }, (_, i) => ({ title: `S${i}`, image_path: null, zoom: 1, focus: "50% 50%", n12: "", n23: "", n34: "" })),
    power: ["a", "b", "c"],
  });
  it("template has 24 steps", () => expect(TEMPLATE_STEPS).toHaveLength(24));
  it("a complete lesson has nothing missing", () => expect(completeness(lessonPayload.parse(full()))).toEqual([]));
  it("lists what is missing", () => {
    const d = lessonPayload.parse({ ...full(), title: "Judul menyusul", verse_text: "", publish_local: null, scenes: [] });
    expect(completeness(d)).toEqual(["judul", "5 adegan cerita", "ayat hafalan", "tanggal terbit"]);
  });
  it("rejects a malformed publish time", () => expect(() => lessonPayload.parse({ ...full(), publish_local: "besok" })).toThrow());
});

describe("audit text (AD-01)", () => {
  it("describes a lesson workflow change without names", () =>
    expect(describeAudit({ action: "UPDATE", row_table: "lessons", before: { number: 12, status: "review" }, after: { number: 12, status: "scheduled" } })).toBe("Pelajaran 12: Menunggu tinjau → Terjadwal"));
  it("falls back to the action for unknown tables", () => expect(describeAudit({ action: "X", row_table: "zzz", before: null, after: null })).toBe("X"));
});

describe("dates for import", () => {
  it("accepts ISO and Indonesian day-first dates", () => {
    expect(toYmd("2024-02-10")).toBe("2024-02-10");
    expect(toYmd("5/6/2023")).toBe("2023-06-05");
    expect(ymd("15.06.2023")).toBe("2023-06-15");
    expect(ymd("kemarin")).toBe("");
  });
});

describe("pilot CSV parser", () => {
  it("handles quotes, commas, CRLF and BOM", () => {
    const rows = parseCsv('﻿A,B\r\n"x, y","say ""hi"""\r\n\r\nz,\r\n');
    expect(rows).toEqual([{ A: "x, y", B: 'say "hi"' }, { A: "z", B: "" }]);
  });
});
