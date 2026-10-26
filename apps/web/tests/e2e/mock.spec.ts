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

// persona (button prefix) -> [role to pick if several, paths]
const SCREENS: [string, string | undefined, string[]][] = [
  ["Admin Pendaftaran", undefined, ["/sk/admin/pendaftar", "/sk/admin/pendaftar/abc", "/sk/admin/pendaftar/pasangan", "/sk/admin/pendaftar/wawancara", "/sk/admin/wawancara"]],
  ["Pembaca Jurnal", undefined, ["/sk/admin/jurnal"]],
  ["Pewawancara", undefined, ["/sk/admin/wawancara/saya"]],
  ["Calon Orang Tua", undefined, ["/sk/daftar/status"]],
  ["Bendahara", undefined, ["/keuangan/tagihan", "/keuangan/laporan"]],
  ["Admin Konseling", undefined, ["/konseling/admin"]],
  ["Konselor Ruth", undefined, ["/konseling/konselor"]],
  ["Mar-com", undefined, ["/markom/admin", "/markom/admin/pengumuman", "/markom/website"]],
  ["Fasilitator KTB", undefined, ["/ktb/kelompok"]],
  ["Pembicara KTB", undefined, ["/ktb/kelompok"]],
  ["Maya Wijaya", "Anggota KTB", ["/ktb/kelompok"]],
  ["Maya Wijaya", "Peserta Acara", ["/event/peserta"]],
  ["Admin KTB", undefined, ["/ktb/admin", "/ktb/admin/rekap"]],
  ["Panitia Celebration", undefined, ["/event/panitia"]],
  ["Admin Acara", undefined, ["/event/admin"]],
  ["Staf Eunike", undefined, ["/staf/saya", "/staf/saya/evaluasi"]],
  ["Kepala Departemen", undefined, ["/staf/head"]],
  ["HRD", undefined, ["/staf/hrd"]],
  ["Pengurus", undefined, ["/pengurus"]],
];
const PUBLIC = ["/sk/daftar", "/sk/daftar/individu", "/sk/daftar/jurnal", "/sk/daftar/terkirim", "/sk/referensi/abc123", "/konseling/konseli"];

test.describe("mockup screens (fake data, previews only)", () => {
  test("every mockup page opens for its role, with the MOCKUP banner and no 'coming soon'", async ({ page }) => {
    test.setTimeout(240_000);
    for (const [persona, role, paths] of SCREENS) {
      await page.context().clearCookies();
      await loginAs(page, persona, role);
      for (const p of paths) {
        await page.goto(p);
        await expect(page.getByRole("note").filter({ hasText: "MOCKUP" }), `${persona} ${p}`).toBeVisible();
        await expect(page.getByRole("heading", { level: 1 }), `${persona} ${p}`).toBeVisible();
        await expect(page.getByText("Segera hadir")).toHaveCount(0);
      }
    }
    await page.context().clearCookies();
    for (const p of PUBLIC) {
      await page.goto(p);
      await expect(page.getByRole("note").filter({ hasText: "MOCKUP" }), p).toBeVisible();
    }
  });

  test("the wrong role is still denied (access rules apply to mockups too)", async ({ page }) => {
    await loginAs(page, "Staf Eunike");
    await page.goto("/keuangan/tagihan");
    await expect(page).toHaveURL(/akses-ditolak/);
    await page.goto("/konseling/konselor");
    await expect(page).toHaveURL(/akses-ditolak/);
  });

  test("AM-01: the registration form says what is missing, then submits", async ({ page }) => {
    await page.goto("/sk/daftar");
    await page.getByRole("button", { name: "Lanjut" }).click();
    await expect(page.getByText("Nomor WA belum diisi").first()).toBeVisible();
    await page.getByLabel(/Nama suami/).fill("Andre");
    await page.getByLabel(/Nama istri/).fill("Maria");
    await page.getByLabel(/Nomor WhatsApp/).fill("081200000000");
    await page.getByRole("button", { name: "Lanjut" }).click();
    await page.getByLabel(/Nama referee suami/).fill("Pak Hendra");
    await page.getByLabel(/WhatsApp referee suami/).fill("081200000001");
    await page.getByRole("tab", { name: "Istri" }).click();
    await page.getByLabel(/Nama referee istri/).fill("Bu Lisa");
    await page.getByLabel(/WhatsApp referee istri/).fill("081200000002");
    await page.getByRole("button", { name: "Lanjut" }).click();
    await page.getByLabel(/Jurnal keluarga/).fill("Kami ingin bertumbuh bersama komunitas yang saling menguatkan dalam iman dan mendidik anak.");
    await page.getByRole("button", { name: "Kirim" }).click();
    await expect(page.getByRole("heading", { name: /formulir terkirim/i })).toBeVisible();
    await expect(page.getByText(/^SK-\d{4}$/)).toBeVisible();
  });

  test("KN-01/02: the counseling request gets a code, and the admin list never shows a story", async ({ page }) => {
    await page.goto("/konseling/konseli");
    await page.getByRole("button", { name: "Kirim permintaan" }).click();
    await expect(page.getByText("Nomor WA belum diisi")).toBeVisible();
    await page.getByLabel(/Untuk siapa/).selectOption("Diri sendiri");
    await page.getByLabel(/Nama atau inisial/).fill("R.S.");
    await page.getByLabel(/Nomor WhatsApp/).fill("081200000000");
    await page.getByLabel(/Ceritakan secukupnya/).fill("RAHASIA-CERITA-UJI");
    await page.getByLabel(/Saya setuju/).check();
    await page.getByRole("button", { name: "Kirim permintaan" }).click();
    await expect(page.getByText(/^KN-\d{4}$/)).toBeVisible();
    await page.context().clearCookies();
    await loginAs(page, "Admin Konseling");
    await page.goto("/konseling/admin");
    await expect(page.getByText("RAHASIA-CERITA-UJI")).toHaveCount(0);
    await page.getByRole("button", { name: "Detail" }).first().click();
    await expect(page.getByText(/Cerita \(contoh\)/)).toHaveCount(0);
  });

  test("CM-02: a mass message to Konseli is blocked", async ({ page }) => {
    await loginAs(page, "Mar-com");
    await page.goto("/markom/admin/pengumuman");
    await page.getByRole("button", { name: "Konseli" }).click();
    await expect(page.getByText("Pesan massal ke Konseli tidak diizinkan demi privasi.")).toBeVisible();
    await expect(page.getByRole("button", { name: "Kirim sekarang" })).toBeDisabled();
  });

  test("ST-02: the department head approves a leave request and it moves to HRD", async ({ page }) => {
    await loginAs(page, "Kepala Departemen");
    await page.goto("/staf/head");
    await page.getByRole("button", { name: "Setujui" }).first().click();
    await expect(page.getByText("Disetujui. Diteruskan ke HRD.")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Menunggu HRD \(2\)$/ })).toBeVisible();
  });

  test("AM-06: admin schedules an interview and the status changes", async ({ page }) => {
    await loginAs(page, "Admin Pendaftaran");
    await page.goto("/sk/admin/pendaftar");
    await page.getByRole("button", { name: "Jadwalkan wawancara" }).first().click();
    await page.getByRole("button", { name: "Jadwalkan wawancara" }).last().click();
    await expect(page.getByText("Pewawancara belum diisi")).toBeVisible();
    await page.getByLabel("Pewawancara").selectOption("Pak Samuel");
    await page.getByLabel("Tanggal").fill("2026-11-04");
    await page.getByRole("button", { name: "Jadwalkan wawancara" }).last().click();
    await expect(page.getByText("Wawancara dijadwalkan. Undangan terkirim.")).toBeVisible();
    await expect(page.getByRole("button", { name: /^Interview \(2\)$/ })).toBeVisible();
  });
});
