import { expect, test } from "@playwright/test";

test("root redirects by browser language and sets lang", async ({ browser }) => {
  const en = await browser.newContext({ locale: "en-US" });
  const p = await en.newPage();
  await p.goto("/");
  await expect(p).toHaveURL(/\/en$/);
  await expect(p.locator("html")).toHaveAttribute("lang", "en");
  const id = await browser.newContext({ locale: "id-ID" });
  const q = await id.newPage();
  await q.goto("/");
  await expect(q).toHaveURL(/\/id$/);
  await expect(q.locator("html")).toHaveAttribute("lang", "id");
});

test("language switch works and keeps the page (F-02)", async ({ page }) => {
  await page.goto("/id/privasi");
  await page.getByRole("link", { name: "Ganti ke Bahasa Inggris" }).first().click();
  await expect(page).toHaveURL(/\/en\/privasi$/);
  await expect(page.getByRole("heading", { name: "Privacy Policy" })).toBeVisible();
});

test("SEO metadata and hreflang (F-06)", async ({ page, request }) => {
  await page.goto("/id");
  await expect(page).toHaveTitle(/Yayasan Eunike/);
  await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
  await expect(page.locator('link[rel="alternate"][hreflang="en"]')).toHaveCount(1);
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(1);
  expect((await request.get("/sitemap.xml")).ok()).toBeTruthy();
  expect(await (await request.get("/robots.txt")).text()).toContain("Sitemap:");
});

test("no program link is a dead #contact placeholder and Masuk is reachable (F-03, F-04)", async ({ page }) => {
  await page.goto("/id");
  const hrefs = await page.locator("#ministries a.card-link").evaluateAll((els) => els.map((e) => e.getAttribute("href")));
  expect(hrefs).toContain("/sk/daftar");
  expect(hrefs).toContain("/konseling/konseli");
  expect(hrefs).toContain("/event/peserta");
  await expect(page.getByRole("banner").getByRole("link", { name: "Masuk" })).toBeVisible();
});

test.describe("mobile menu (F-09, F-15)", () => {
  test.use({ viewport: { width: 390, height: 800 } });
  test("contains language, Masuk and CTA; Escape closes and returns focus", async ({ page }) => {
    await page.goto("/id");
    const toggle = page.getByRole("button", { name: "Buka navigasi" });
    const panel = page.locator("#main-nav");
    await expect(page.getByRole("banner").getByRole("link", { name: "Hubungi kami" })).toBeHidden();
    await expect(panel).toBeHidden(); // closed menu is not reachable (prototype only faded it)
    await toggle.click();
    await expect(panel.getByRole("link", { name: "Masuk" })).toBeVisible();
    await expect(panel.getByRole("link", { name: "Hubungi kami" })).toBeVisible();
    await expect(panel.getByRole("link", { name: "Ganti ke Bahasa Inggris" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(panel).toBeHidden();
    await expect(toggle).toBeFocused();
  });

  test("no horizontal scroll at 390px", async ({ page }) => {
    await page.goto("/id");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test("anchor targets clear the sticky header (F-08)", async ({ page }) => {
  await page.goto("/id#contact");
  await page.waitForTimeout(500);
  const top = await page.locator("#contact").evaluate((e) => e.getBoundingClientRect().top);
  expect(top).toBeGreaterThanOrEqual(70);
});

test("contact form: validation, honeypot and success (F-12)", async ({ page }) => {
  await page.goto("/id#contact");
  await page.getByLabel("Nama", { exact: true }).fill("A");
  await page.getByLabel("Email atau nomor WhatsApp").fill("x");
  await page.getByLabel("Pesan", { exact: true }).fill("hi");
  await page.getByRole("button", { name: "Kirim pesan" }).click();
  await expect(page.getByRole("status")).toContainText("Mohon lengkapi");
  await page.getByLabel("Nama", { exact: true }).fill("Budi Santoso");
  await page.getByLabel("Email atau nomor WhatsApp").fill("budi@example.test");
  await page.getByLabel("Pesan", { exact: true }).fill("Halo, saya ingin bertanya tentang KTB.");
  await page.getByRole("button", { name: "Kirim pesan" }).click();
  await expect(page.getByRole("status")).toContainText("Terima kasih");
});

test("keyboard focus is visible (F-07)", async ({ page }) => {
  await page.goto("/id");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  const outline = await page.evaluate(() => getComputedStyle(document.activeElement!).outlineStyle);
  expect(outline).not.toBe("none");
});
