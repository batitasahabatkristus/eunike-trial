import type { Screen } from "../types";

/** KN-01..KN-06 mockup. The privacy rule is the point: admin lists never carry the story or notes. */
export const KONSELING: Record<string, Screen> = {
  "/konseling/konseli": {
    title: "Minta konseling", subtitle: "Kami siap mendengarkan. Ceritamu hanya dibaca konselor yang ditugaskan.", reqs: ["KN-01"],
    blocks: [
      { t: "notice", lock: true, text: "Ceritamu hanya dibaca konselor yang ditugaskan." },
      { t: "form", id: "konseli", into: "kn-admin", intoStatus: "Baru", noBody: true, submit: "Kirim permintaan", codePrefix: "KN-", successTitle: "Permintaan terkirim",
        successText: "Simpan kode ini. Konselor akan menghubungi lewat WhatsApp. Admin hanya melihat kode, inisial, dan jenis kebutuhan.", resetLabel: "Kirim permintaan lain", fields: [
          { name: "untuk", label: "Untuk siapa", kind: "select", options: ["Diri sendiri", "Pasangan", "Keluarga"], required: true },
          { name: "nama", label: "Nama atau inisial", required: true },
          { name: "wa", label: "Nomor WhatsApp", kind: "tel", required: true, error: "Nomor WA belum diisi" },
          { name: "butuh", label: "Kebutuhan", kind: "chips", options: ["Pernikahan", "Anak", "Duka", "Kecemasan", "Pekerjaan", "Lainnya"] },
          { name: "cerita", label: "Ceritakan secukupnya", kind: "textarea", required: true },
          { name: "waktu", label: "Waktu yang diinginkan", placeholder: "Contoh: Sabtu sore" },
          { name: "setuju", label: "Saya setuju ceritanya dibaca konselor yang ditugaskan", kind: "check", required: true, error: "Persetujuan belum dicentang" },
        ] },
    ],
  },
  "/konseling/admin": {
    title: "Admin Konseling", subtitle: "Mengatur permintaan dan penugasan. Isi cerita dan catatan tidak terlihat di sini.", reqs: ["KN-02", "KN-03"],
    blocks: [
      { t: "notice", lock: true, text: "Admin tidak dapat membaca cerita atau catatan konseling. Hanya konselor yang ditugaskan." },
      { t: "stats", items: [{ label: "Baru", value: "3", tone: "warn" }, { label: "Dijadwalkan", value: "4" }, { label: "Berjalan", value: "6" }, { label: "Ditutup bulan ini", value: "5", tone: "ok" }] },
      { t: "pipeline", id: "kn-admin", statuses: ["Baru", "Dijadwalkan", "Berjalan", "Ditutup"], search: true, tones: { Baru: "warn" }, items: [
        { id: "k1", title: "KN-0231 · R.S.", sub: "Pernikahan · 21 Okt", status: "Baru", tag: "Mendesak" },
        { id: "k2", title: "KN-0230 · A.T.", sub: "Anak · 20 Okt", status: "Baru" },
        { id: "k3", title: "KN-0228 · M.L.", sub: "Duka · 18 Okt", status: "Dijadwalkan", meta: [["Konselor", "Ruth"], ["Sesi pertama", "27 Okt"]] },
        { id: "k4", title: "KN-0222 · D.P.", sub: "Kecemasan · 10 Okt", status: "Berjalan", meta: [["Konselor", "Ruth"]] },
        { id: "k5", title: "KN-0210 · L.H.", sub: "Pekerjaan · 2 Okt", status: "Ditutup" },
      ], actions: { Baru: [{ label: "Tugaskan konselor", to: "Dijadwalkan", toast: "Dijadwalkan. Konselor diberi tahu tanpa isi cerita.", ask: [
        { name: "k", label: "Konselor", kind: "select", options: ["Ruth", "Pak Samuel", "Bu Maria"], required: true, error: "Konselor belum dipilih" }, { name: "t", label: "Tanggal sesi pertama", kind: "date", required: true, error: "Tanggal belum diisi" }] }] } },
    ],
  },
  "/konseling/konselor": {
    title: "Konselor", subtitle: "Kasus yang ditugaskan kepada Anda.", reqs: ["KN-04", "KN-05"],
    blocks: [
      { t: "notice", lock: true, text: "Hanya Anda yang dapat membaca catatan ini. Setiap akses dicatat." },
      { t: "pipeline", id: "kn-konselor", statuses: ["Dijadwalkan", "Berjalan", "Ditutup"], items: [
        { id: "c1", title: "KN-0228 · M.L.", sub: "Duka · sesi 27 Okt", status: "Dijadwalkan", body: "Cerita (contoh): Ibu saya meninggal bulan lalu dan saya sulit tidur. Saya ingin ditemani berbicara.", meta: [["Catatan sebelumnya", "Belum ada"]] },
        { id: "c2", title: "KN-0222 · D.P.", sub: "Kecemasan · sesi ke-3", status: "Berjalan", body: "Cerita (contoh): Saya sering cemas menjelang rapat dan sulit berdoa.", meta: [["Catatan sesi 2", "Mulai latihan napas dan doa pendek."]] },
        { id: "c3", title: "KN-0210 · L.H.", sub: "Pekerjaan", status: "Ditutup", body: "Kasus ditutup. Catatan tetap tersimpan terenkripsi." },
      ], actions: {
        Dijadwalkan: [{ label: "Mulai sesi", to: "Berjalan", toast: "Sesi dimulai." }],
        Berjalan: [
          { label: "Tambah catatan", toast: "Catatan tersimpan terenkripsi (contoh).", ask: [{ name: "n", label: "Catatan sesi", kind: "textarea", required: true, error: "Catatan belum diisi" }] },
          { label: "Tutup kasus", to: "Ditutup", toast: "Kasus ditutup.", tone: "ghost" },
        ],
      } },
    ],
  },
};
