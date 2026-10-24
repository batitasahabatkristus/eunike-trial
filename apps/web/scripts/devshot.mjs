// Dev helper: log in as a fake persona and screenshot pages.   node scripts/devshot.mjs <persona-name-prefix> <outdir> <width> <path...>
import { chromium } from "@playwright/test";
const [persona, outdir, width, ...paths] = process.argv.slice(2);
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || "/opt/pw-browsers/chromium" });
const ctx = await b.newContext({ viewport: { width: Number(width), height: 900 }, reducedMotion: "reduce" });
const p = await ctx.newPage();
await p.goto("http://localhost:3100/masuk");
await p.getByRole("button", { name: new RegExp("^" + persona) }).click();
await p.waitForURL((u) => !u.pathname.startsWith("/masuk"));
if (p.url().includes("/pilih-peran")) { await (process.env.ROLE ? p.getByRole("button", { name: process.env.ROLE }) : p.getByRole("button").first()).click(); await p.waitForTimeout(300); }
let i = 0;
for (const path of paths) {
  await p.goto("http://localhost:3100" + path); await p.waitForTimeout(500);
  await p.addStyleTag({ content: "nextjs-portal{display:none!important}" });
  const f = `${outdir}/${String(++i).padStart(2, "0")}-${path.replace(/[^a-z0-9]+/gi, "_")}.png`;
  await p.screenshot({ path: f, fullPage: true }); console.log(p.url().replace("http://localhost:3100", ""), "->", f);
}
await b.close();
