import type { Screen } from "../types";

/** EV-01..EV-03 mockup. */
export const EVENT: Record<string, Screen> = {
  "/event/peserta": {
    title: "Acara", subtitle: "Daftar dan simpan tiket QR Anda.", reqs: ["EV-01"],
    blocks: [{ t: "pipeline", id: "acara", statuses: ["Terbuka", "Terdaftar", "Penuh", "Daftar tunggu"], tones: { Penuh: "bad", "Daftar tunggu": "warn" }, items: [
      { id: "e1", title: "Celebration SK 2026", sub: "Sabtu 21 Nov · 09.00 · Aula Eunike", status: "Terbuka", tag: "112 dari 120", body: "Sesi: Pembukaan, Workshop keluarga, Penutup.", meta: [["Sesi", "Pembukaan · Workshop · Penutup"]] },
      { id: "e2", title: "Retret Pasangan", sub: "5 Des · Puncak", status: "Penuh", tag: "40 dari 40", body: "Acara penuh. Anda bisa masuk daftar tunggu." },
    ], actions: {
      Terbuka: [{ label: "Daftar sekarang", to: "Terdaftar", toast: "Terdaftar. Tiket QR siap di bawah.", ask: [{ name: "s", label: "Sesi yang diikuti", kind: "chips", options: ["Pembukaan", "Workshop", "Penutup"] }] }],
      Terdaftar: [{ label: "Tampilkan tiket QR", toast: "Contoh: tiket QR EVT-0412 ditampilkan.", tone: "ghost" }],
      Penuh: [{ label: "Masuk daftar tunggu", to: "Daftar tunggu", toast: "Anda masuk daftar tunggu. Kami beri tahu jika ada tempat." }],
    } }],
  },
  "/event/panitia": {
    title: "Panitia acara", subtitle: "Check-in peserta Celebration SK 2026.", reqs: ["EV-02"],
    blocks: [
      { t: "stats", items: [{ label: "Terdaftar", value: "112" }, { label: "Sudah hadir", value: "3", tone: "ok" }, { label: "Belum", value: "109" }] },
      { t: "buttons", buttons: [{ label: "Pindai kartu (kamera)", toast: "Contoh: kamera terbuka untuk memindai QR." }] },
      { t: "pipeline", id: "checkin", statuses: ["Belum hadir", "Hadir"], search: true, items: [
        { id: "p1", title: "Keluarga Santoso", sub: "EVT-0412 · 3 orang", status: "Belum hadir" }, { id: "p2", title: "Keluarga Wijaya", sub: "EVT-0413 · 2 orang", status: "Belum hadir" },
        { id: "p3", title: "Keluarga Pranata", sub: "EVT-0414 · 4 orang", status: "Hadir" }, { id: "p4", title: "Keluarga Halim", sub: "EVT-0415 · 3 orang", status: "Hadir" },
      ], actions: { "Belum hadir": [{ label: "Check-in", to: "Hadir", toast: "Hadir. Tercatat." }], Hadir: [{ label: "Pindai ulang (contoh)", toast: "Sudah check-in sebelumnya. Dicatat sebagai duplikat.", tone: "ghost" }] } },
    ],
  },
  "/event/admin": {
    title: "Admin acara", subtitle: "Buat acara, atur sesi dan kapasitas.", reqs: ["EV-03"],
    blocks: [
      { t: "buttons", buttons: [{ label: "Ekspor peserta (Excel)", toast: "Contoh: berkas peserta diunduh.", tone: "ghost" }] },
      { t: "table", title: "Acara", columns: ["Acara", "Tanggal", "Kapasitas", "Terdaftar", "Status"], statusColumn: 4, rows: [["Celebration SK 2026", "21 Nov", "120", "112", "Terbuka"], ["Retret Pasangan", "5 Des", "40", "40", "Penuh"]] },
      { t: "form", id: "acara-baru", title: "Buat acara", submit: "Simpan acara", successTitle: "Acara dibuat", successText: "Sesi dapat ditambahkan setelahnya.", resetLabel: "Buat lagi", fields: [
        { name: "n", label: "Nama acara", required: true, error: "Nama acara belum diisi" }, { name: "t", label: "Tanggal", kind: "date" }, { name: "k", label: "Kapasitas", kind: "number" }, { name: "s", label: "Sesi", kind: "chips", options: ["Pembukaan", "Workshop", "Penutup"] }] },
    ],
  },
};
