import { expect, test, type Page } from "@playwright/test";

async function loginAs(page: Page, name: string, role?: string) {
  await page.goto("/masuk");
  await page.getByRole("button", { name: new RegExp(`^${name}`) }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/masuk"));
  if (role) {
    await page.getByRole("button", { name: role }).click();
    await page.waitForURL((u) => !u.pathname.startsWith("/pilih-peran"));
  }
}

test.describe("Sahabat Kristus parity (PRD §9)", () => {
  test("SK-02/03: a parent walks lesson 11 on a phone, step by step, to the end", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await loginAs(page, "Rina Santoso");
    await page.goto("/sk/keluarga/alur?pel=11");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Pelajaran 11");
    const next = page.getByRole("button", { name: /^(Lanjut|Selesai) ›$/ });
    for (let i = 0; i < 40; i++) {
      if ((await next.textContent())?.startsWith("Selesai")) break;
      await next.click();
    }
    await expect(next).toContainText("Selesai");
    // no horizontal scroll on a phone
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });

  test("GU-02: the teacher marks a whole class and the save sticks", async ({ page }) => {
    await loginAs(page, "Daniel Santoso", "Guru SK");
    await page.goto("/sk/guru/absensi?tgl=2026-11-21");
    await expect(page.getByRole("radio", { name: "Masuk" }).first()).toBeVisible(); // class has families to mark
    const t0 = Date.now();
    const masuk = page.getByRole("radio", { name: "Masuk", checked: false });
    const n = await masuk.count();
    for (let i = 0; i < n; i++) await masuk.first().click();
    await page.getByRole("button", { name: "Simpan absensi" }).click();
    await expect(page.getByText("✓ Absensi tersimpan")).toBeVisible();
    expect(Date.now() - t0).toBeLessThan(3000 + n * 150); // PRD: a class of ~12 well under 3 s of waiting for the save
    await page.reload();
    await expect(page.getByRole("radio", { name: "Masuk", checked: false })).toHaveCount(0);
  });

  test("access: parents cannot open guru, kurikulum or admin SK", async ({ page }) => {
    await loginAs(page, "Rina Santoso");
    for (const p of ["/sk/guru", "/sk/kurikulum", "/sk/admin", "/sk/admin/akun"]) {
      await page.goto(p);
      await expect(page, p).toHaveURL(/akses-ditolak/);
    }
  });

  test("access: a guru cannot open the admin dashboard", async ({ page }) => {
    await loginAs(page, "Daniel Santoso", "Guru SK");
    await page.goto("/sk/admin");
    await expect(page).toHaveURL(/akses-ditolak/);
  });

  test("AD-02: admin attendance export downloads an Excel file", async ({ page }) => {
    await loginAs(page, "Ari");
    await page.goto("/sk/admin/hadir");
    const res = await page.request.get("/sk/admin/hadir/export?format=xlsx");
    expect(res.status()).toBe(200);
    expect(res.headers()["content-type"]).toContain("spreadsheetml");
    expect((await res.body()).subarray(0, 2).toString()).toBe("PK");
  });

  test("KU-03: the publish cron refuses callers without the secret", async ({ request }) => {
    expect((await request.get("/api/cron/publish")).status()).toBe(401);
    expect((await request.get("/api/cron/publish", { headers: { authorization: "Bearer wrong" } })).status()).toBe(401);
  });

  test("files are not served to strangers", async ({ request }) => {
    const r = await request.get("/api/files/memory-marker-files/nope/x.jpg", { maxRedirects: 0 });
    expect([302, 307, 401, 403, 404]).toContain(r.status());
  });
});
