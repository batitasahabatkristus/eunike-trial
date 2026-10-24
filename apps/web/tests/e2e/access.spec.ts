import { expect, test, type Page } from "@playwright/test";

async function loginAs(page: Page, name: string, next?: string) {
  await page.goto(`/masuk${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  await page.getByRole("button", { name: new RegExp(`^${name}`) }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/masuk"));
}

test.describe("access flow (PRD §4.3)", () => {
  test("anonymous visitor is sent to login with ?next", async ({ page }) => {
    await page.goto("/sk/guru");
    await expect(page).toHaveURL(/\/masuk\?next=%2Fsk%2Fguru/);
  });

  test("each role lands on its home", async ({ page }) => {
    const cases: [string, string][] = [
      ["Guru Kelas Elia", "/sk/guru"],
      ["Admin SK", "/sk/admin"],
      ["Bendahara", "/keuangan/tagihan"],
      ["Konselor Ruth", "/konseling/konselor"],
      ["Admin Konseling", "/konseling/admin"],
      ["Mar-com", "/markom/admin"],
      ["Pengurus", "/pengurus"],
      ["Staf Eunike", "/staf/saya"],
    ];
    for (const [persona, path] of cases) {
      await page.context().clearCookies();
      await loginAs(page, persona);
      await expect(page, persona).toHaveURL(new RegExp(`${path}$`));
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    }
  });

  test("a role outside the allowed list gets the denied page, not the content", async ({ page }) => {
    await loginAs(page, "Keluarga Santoso");
    await page.goto("/sk/admin");
    await expect(page).toHaveURL(/\/akses-ditolak$/);
    await expect(page.getByRole("heading", { name: "Akses ditolak" })).toBeVisible();
    await page.goto("/konseling/konselor");
    await expect(page).toHaveURL(/\/akses-ditolak$/);
  });

  test("admin and super admin cannot open the counselor workspace", async ({ page }) => {
    await loginAs(page, "Admin Konseling");
    await page.goto("/konseling/konselor");
    await expect(page).toHaveURL(/akses-ditolak/);
    await page.context().clearCookies();
    await loginAs(page, "Super Admin");
    await page.goto("/konseling/konselor");
    await expect(page).toHaveURL(/akses-ditolak/);
  });

  test("multi-role person picks a role, switches, and is held to it", async ({ page }) => {
    await loginAs(page, "Keluarga Wijaya");
    await expect(page).toHaveURL(/\/pilih-peran/);
    await page.getByRole("button", { name: "Anggota KTB" }).click();
    await expect(page).toHaveURL(/\/ktb\/kelompok$/);
    await page.goto("/beranda/keluarga"); // parent-only page while acting as KTB member
    await expect(page).toHaveURL(/akses-ditolak/);
  });

  test("login redirects back to the page that was asked for", async ({ page }) => {
    await loginAs(page, "Admin SK", "/sk/admin/akun");
    await expect(page).toHaveURL(/\/sk\/admin\/akun$/);
  });

  test("open redirect through ?next is ignored", async ({ page }) => {
    await loginAs(page, "Admin SK", "https://evil.test/x");
    await expect(page).toHaveURL(/localhost:3100\/sk\/admin$/);
  });

  test("tampered session cookie is rejected", async ({ page, context }) => {
    await context.addCookies([{ name: "eunike_dev_session", value: "x.y.z", url: "http://localhost:3100" }]);
    await page.goto("/pengurus");
    await expect(page).toHaveURL(/\/masuk/);
  });

  test("logout ends the session", async ({ page }) => {
    await loginAs(page, "Admin SK");
    await page.getByRole("button", { name: "Keluar" }).click();
    await page.waitForURL(/\/masuk/);
    await page.goto("/sk/admin");
    await expect(page).toHaveURL(/\/masuk/);
  });
});
