import type { Screen } from "../types";

/** KT-01..KT-05 mockup. */
const member: Screen = {
  title: "KTB saya", subtitle: "Kelompok Tumbuh Bersama Kasih", reqs: ["KT-01"],
  blocks: [
    { t: "cards", items: [{ title: "Kelompok Kasih", sub: "Fasilitator: Pak Daniel · 8 anggota", badge: "Aktif", tone: "ok" }, { title: "Pertemuan berikutnya", sub: "Kamis 29 Okt · 19.30 · Rumah Pak Daniel", badge: "5 hari lagi", tone: "info" }] },
    { t: "buttons", buttons: [{ label: "Beri tahu berhalangan", toast: "Fasilitator diberi tahu bahwa Anda berhalangan." }] },
    { t: "table", title: "Materi", columns: ["Judul", "Pertemuan"], rows: [["Kasih yang melayani", "29 Okt"], ["Mengampuni dalam keluarga", "5 Nov"], ["Doa bersama pasangan", "12 Nov"]] },
  ],
};
const facilitator: Screen = {
  title: "KTB: fasilitator", subtitle: "Kelompok Kasih · Kamis 22 Okt", reqs: ["KT-02"],
  blocks: [
    { t: "checklist", id: "ktb-hadir", title: "Kehadiran", options: ["Hadir", "Tidak"], summary: "{n} dari {total} hadir", save: "Simpan kehadiran", saveToast: "Kehadiran tersimpan. Rekap departemen diperbarui.", rows: [
      { id: "m1", name: "Keluarga Santoso", sub: "Daniel & Rina" }, { id: "m2", name: "Keluarga Wijaya", sub: "Maya" }, { id: "m3", name: "Keluarga Pranata", sub: "Sari" }, { id: "m4", name: "Keluarga Halim", sub: "Linda" },
      { id: "m5", name: "Keluarga Gunawan", sub: "Mery" }, { id: "m6", name: "Keluarga Setiawan", sub: "Ana" }, { id: "m7", name: "Keluarga Suryadi", sub: "Lisa" }, { id: "m8", name: "Keluarga Saputra", sub: "Dewi" },
    ] },
    { t: "form", id: "ktb-catatan", title: "Catatan pertemuan", submit: "Simpan catatan", successTitle: "Catatan tersimpan", successText: "Catatan hanya terlihat oleh fasilitator.", resetLabel: "Tulis lagi", fields: [{ name: "c", label: "Catatan", kind: "textarea" }] },
  ],
};
const speaker: Screen = {
  title: "Pembicara KTB", subtitle: "Sesi yang akan Anda bawakan.", reqs: ["KT-05"],
  blocks: [{ t: "table", columns: ["Tanggal", "Kelompok", "Topik", "Materi"], rows: [["29 Okt", "Kelompok Kasih", "Kasih yang melayani", "Slide + lembar kerja"], ["5 Nov", "Kelompok Sukacita", "Mengampuni dalam keluarga", "Slide"]] }],
};
const admin: Screen = {
  title: "Admin KTB", subtitle: "Kelola kelompok, fasilitator, dan anggota.", reqs: ["KT-03"],
  blocks: [
    { t: "stats", items: [{ label: "Kelompok", value: "9" }, { label: "Anggota", value: "64" }, { label: "Rata-rata hadir", value: "81%", tone: "ok" }, { label: "Tanpa fasilitator", value: "1", tone: "warn" }] },
    { t: "table", title: "Kelompok", search: true, columns: ["Kelompok", "Fasilitator", "Anggota", "Hari"], rows: [["Kasih", "Pak Daniel", "8", "Kamis"], ["Sukacita", "Bu Maria", "7", "Selasa"], ["Damai", "Pak Yohan", "8", "Rabu"], ["Kesabaran", "(belum ada)", "6", "Jumat"]] },
    { t: "form", id: "ktb-baru", title: "Buat kelompok", submit: "Buat kelompok", successTitle: "Kelompok dibuat", successText: "Fasilitator dan anggota dapat ditambahkan setelahnya.", resetLabel: "Buat lagi", fields: [
      { name: "nama", label: "Nama kelompok", required: true, error: "Nama kelompok belum diisi" }, { name: "fas", label: "Fasilitator", kind: "select", options: ["Pak Daniel", "Bu Maria", "Pak Yohan"] }, { name: "hari", label: "Hari", kind: "select", options: ["Selasa", "Rabu", "Kamis", "Jumat"] }] },
  ],
};
const rekap: Screen = {
  title: "Rekap KTB", subtitle: "Kehadiran per kelompok, 4 pekan terakhir. Hanya angka gabungan.", reqs: ["KT-04"],
  blocks: [{ t: "bars", title: "Kehadiran per kelompok", bars: [{ label: "Kasih", value: 88 }, { label: "Sukacita", value: 79 }, { label: "Damai", value: 84 }, { label: "Kesabaran", value: 64 }, { label: "Kebaikan", value: 91 }] }],
};

export const KTB = { member, facilitator, speaker, admin, rekap };
