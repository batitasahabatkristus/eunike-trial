import { expect, test, type Page } from "@playwright/test";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

/**
 * WEB-01: the port must match the approved prototype (reference/website-prototype) within 0.5% of pixels.
 * Compared section by section with photos hidden (next/image re-encodes them) and with the elements
 * that PRD §6.2 deliberately changes removed from both pages, so only unintended drift fails.
 */
const PROTO = "http://localhost:8100/index.html";
const FONTS = `
@font-face{font-family:"Baloo 2";src:url(http://localhost:8100/fonts/baloo-2-latin-wght-normal.woff2);font-weight:400 800}
@font-face{font-family:"Quicksand";src:url(http://localhost:8100/fonts/quicksand-latin-wght-normal.woff2);font-weight:300 700}
@font-face{font-family:"Parisienne";src:url(http://localhost:8100/fonts/parisienne-latin-400-normal.woff2)}`;
const NEUTRALISE = `
.reveal{opacity:1!important;transform:none!important;transition:none!important}
html{scroll-behavior:auto!important} *{animation:none!important}
img{visibility:hidden!important}
.site-header{position:absolute!important}
.skip-link,nextjs-portal,.nav-actions,.nav-mobile-only,.portal-link,.contact-form,.footer-inner,.journey-intro > p,.stories-section .section-heading > p,.contact-section{display:none!important}`;

async function prepare(page: Page, url: string, proto: boolean) {
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  await page.goto(url);
  if (proto) await page.addStyleTag({ content: FONTS });
  await page.addStyleTag({ content: NEUTRALISE });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
}

const SECTIONS = "main > section:not(.contact-section)";

for (const width of [1440, 1024, 390]) {
  test(`homepage matches the prototype at ${width}px (WEB-01)`, async ({ browser }) => {
    test.setTimeout(90_000);
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
    const a = await ctx.newPage(), b = await ctx.newPage();
    await prepare(a, PROTO, true);
    await prepare(b, "/en", false);

    const n = await a.locator(SECTIONS).count();
    expect(await b.locator(SECTIONS).count()).toBe(n);
    let diff = 0, total = 0;
    const per: string[] = [];
    for (let i = 0; i < n; i++) {
      const [sa, sb] = await Promise.all([a.locator(SECTIONS).nth(i).screenshot(), b.locator(SECTIONS).nth(i).screenshot()]);
      const A = PNG.sync.read(sa), B = PNG.sync.read(sb);
      expect({ w: B.width, h: B.height }, `section ${i} size`).toEqual({ w: A.width, h: A.height });
      const d = pixelmatch(A.data, B.data, undefined, A.width, A.height, { threshold: 0.1 });
      per.push(`#${i} ${((d / (A.width * A.height)) * 100).toFixed(2)}%`);
      diff += d;
      total += A.width * A.height;
    }
    expect(diff / total, `differing pixels at ${width}px (${per.join(", ")})`).toBeLessThan(0.005);
    await ctx.close();
  });
}
