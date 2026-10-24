import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";

// Standard PDF fonts only cover WinAnsi; Indonesian text is fine, other symbols fall back to "?".
const clean = (s: string) => s.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[–—]/g, "-").replace(/…/g, "...").replace(/[^\x20-\x7E\xA0-\xFF\n]/g, "?");
const PURPLE = rgb(0.38, 0.18, 0.56), INK = rgb(0.22, 0.14, 0.25), MUTED = rgb(0.44, 0.36, 0.45);

function wrap(text: string, font: PDFFont, size: number, width: number): string[] {
  const out: string[] = [];
  for (const para of clean(text).split("\n")) {
    let line = "";
    for (const w of para.split(/\s+/)) {
      const t = line ? `${line} ${w}` : w;
      if (font.widthOfTextAtSize(t, size) > width && line) { out.push(line); line = w; } else line = t;
    }
    out.push(line);
  }
  return out;
}

export interface Section { heading: string; paragraphs: { label?: string; text: string }[] }

/** A4 portrait report: title, subtitle, titled sections with optional bold labels. */
export async function textReport(title: string, subtitle: string, sections: Section[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const reg = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([595, 842]); let y = 790; const left = 56, width = 483;
  const ensure = (h: number) => { if (y - h < 56) { page = doc.addPage([595, 842]); y = 790; } };
  page.drawText("Yayasan Eunike", { x: left, y, size: 10, font: bold, color: MUTED }); y -= 30;
  for (const l of wrap(title, bold, 22, width)) { page.drawText(l, { x: left, y, size: 22, font: bold, color: PURPLE }); y -= 28; }
  page.drawText(clean(subtitle), { x: left, y, size: 11, font: reg, color: MUTED }); y -= 34;
  for (const s of sections) {
    ensure(60); page.drawText(clean(s.heading), { x: left, y, size: 14, font: bold, color: PURPLE }); y -= 22;
    for (const p of s.paragraphs) {
      const lines = wrap(p.label ? `${p.label}: ${p.text}` : p.text, reg, 11, width);
      ensure(lines.length * 15 + 6);
      lines.forEach((l, i) => {
        if (p.label && i === 0 && l.startsWith(clean(p.label))) {
          const lab = clean(p.label) + ":"; page.drawText(lab, { x: left, y, size: 11, font: bold, color: INK });
          page.drawText(l.slice(lab.length), { x: left + bold.widthOfTextAtSize(lab, 11), y, size: 11, font: reg, color: INK });
        } else page.drawText(l, { x: left, y, size: 11, font: reg, color: INK });
        y -= 15;
      });
      y -= 6;
    }
    y -= 8;
  }
  return doc.save();
}

/** A4 landscape table (attendance report export). */
export async function tableReport(title: string, subtitle: string, head: string[], rows: string[][], widths?: number[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const reg = await doc.embedFont(StandardFonts.Helvetica), bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const W = 842, H = 595, left = 40, usable = W - 80;
  const w = widths ?? head.map((_, i) => (i === 1 ? 3 : 1));
  const sum = w.reduce((a, b) => a + b, 0), cols = w.map((x) => (x / sum) * usable);
  let page = doc.addPage([W, H]); let y = H - 50;
  const header = () => {
    let x = left; page.drawRectangle({ x: left - 4, y: y - 5, width: usable + 8, height: 20, color: rgb(0.93, 0.89, 0.97) });
    head.forEach((h, i) => { page.drawText(clean(h), { x, y, size: 9, font: bold, color: PURPLE }); x += cols[i]; }); y -= 22;
  };
  page.drawText(clean(title), { x: left, y, size: 18, font: bold, color: PURPLE }); y -= 18;
  page.drawText(clean(subtitle), { x: left, y, size: 10, font: reg, color: MUTED }); y -= 28; header();
  for (const r of rows) {
    if (y < 50) { page = doc.addPage([W, H]); y = H - 50; header(); }
    let x = left; r.forEach((c, i) => { page.drawText(clean(c).slice(0, 48), { x, y, size: 9, font: reg, color: INK }); x += cols[i]; }); y -= 16;
  }
  return doc.save();
}
