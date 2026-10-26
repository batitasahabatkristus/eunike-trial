import type { Screen, Field } from "../types";

/** CM-01..CM-04 and WS-01..WS-06 mockup. */
const pair = (name: string, label: string, id: string, en: string, kind: Field["kind"] = "text"): Field[] => [
  { name: `${name}_id`, label: `${label} (ID)`, kind, value: id }, { name: `${name}_en`, label: `${label} (EN)`, kind, value: en },
];

export const KOMUNIKASI: Record<string, Screen> = {
  "/markom/admin": {
    title: "Kalender konten", subtitle: "Dari ide sampai terbit. Satu tombol langkah berikutnya per kartu.", reqs: ["CM-04"],
    blocks: [{ t: "kanban", id: "konten", columns: ["Draf", "Ditinjau", "Disetujui", "Terbit"], addTo: "Draf",
      addForm: [{ name: "title", label: "Judul", required: true, error: "Judul belum diisi" }, { name: "format", label: "Format", kind: "select", options: ["Artikel", "Podcast", "Instagram", "TikTok"] }, { name: "owner", label: "Penanggung jawab" }],
      next: { Draf: { label: "Kirim untuk ditinjau", to: "Ditinjau", toast: "Dikirim untuk ditinjau." }, Ditinjau: { label: "Setujui", to: "Disetujui", toast: "Disetujui." }, Disetujui: { label: "Tandai terbit", to: "Terbit", toast: "Ditandai terbit." } },
      cards: [
        { id: "c1", title: "5 cara bercerita kepada balita", tag: "Artikel", sub: "Due 30 Okt · Dewi", status: "Draf" },
        { id: "c2", title: "Reel: Doa sebelum tidur", tag: "Instagram", sub: "Due 28 Okt · Bima", status: "Draf" },
        { id: "c3", title: "Podcast: Tumbuh bersama keluarga #4", tag: "Podcast", sub: "Due 1 Nov · Ana", status: "Ditinjau" },
        { id: "c4", title: "TikTok: Satu menit iman di rumah", tag: "TikTok", sub: "Due 26 Okt · Bima", status: "Disetujui" },
        { id: "c5", title: "Pelajaran 11: Zakheus", tag: "Instagram", sub: "Terbit 17 Okt", status: "Terbit" },
      ] }],
  },
  "/markom/admin/pengumuman": {
    title: "Pengumuman", subtitle: "Kirim pesan ke kelompok tertentu. Penerima hanya ditampilkan sebagai jumlah.", reqs: ["CM-01", "CM-02", "CM-03"],
    blocks: [
      { t: "notice", tone: "info", text: "Di produksi, pengiriman massal membutuhkan persetujuan Pengurus. Di mockup ini langsung terkirim." },
      { t: "announce", id: "pengumuman", classes: ["Elia", "Markus", "Yakub", "Yehuda"], channels: ["Email", "Notifikasi", "WhatsApp"], audiences: [
        { label: "Orang tua", count: 196 }, { label: "Guru SK", count: 12 }, { label: "Anggota KTB", count: 64 }, { label: "Staf", count: 18 }, { label: "Konseli", count: 9, blocked: true },
      ], history: [["Jadwal Natal berubah", "Orang tua", "196", "Notifikasi, Email", "20 Okt"], ["Pelatihan guru Sabtu", "Guru SK", "12", "Notifikasi", "15 Okt"]] },
    ],
  },
  "/markom/website": {
    title: "Website CMS", subtitle: "Ubah tulisan, foto, dan tautan website tanpa kode. Selalu dalam dua bahasa.", reqs: ["WS-01", "WS-02", "WS-03", "WS-04", "WS-05", "WS-06"],
    blocks: [{ t: "tabs", tabs: [
      { label: "Tulisan", blocks: [
        { t: "notice", tone: "info", text: "Perubahan disimpan sebagai draf. Website hanya memakai versi yang diterbitkan." },
        { t: "form", id: "cms-tulisan", submit: "Simpan draf", successTitle: "Draf tersimpan", successText: "Tersimpan. Gunakan Pratinjau, lalu Terbitkan.", resetLabel: "Ubah lagi", fields: [
          ...pair("hero", "Judul utama", "Membangun keluarga yang bertumbuh dalam iman", "Building families that grow in faith"),
          ...pair("sub", "Kalimat pembuka", "Bersama kami, setiap keluarga tidak berjalan sendiri.", "With us, no family walks alone.", "textarea"),
        ] },
        { t: "buttons", buttons: [{ label: "Pratinjau", toast: "Contoh: membuka pratinjau website.", tone: "ghost" }, { label: "Terbitkan", toast: "Terbit. Halaman publik dibangun ulang." }, { label: "Kembalikan ke versi terbit", toast: "Draf dibuang.", tone: "ghost" }] },
      ] },
      { label: "Foto", blocks: [{ t: "form", id: "cms-foto", submit: "Unggah foto", successTitle: "Foto tersimpan", successText: "Foto diunggah ke penyimpanan situs.", resetLabel: "Unggah lagi", fields: [
        { name: "url", label: "Alamat foto (URL)", placeholder: "https://…" },
        { name: "alt_id", label: "Teks alternatif (ID)", required: true, error: "Teks alternatif Indonesia wajib" }, { name: "alt_en", label: "Teks alternatif (EN)", required: true, error: "Teks alternatif Inggris wajib" },
      ] }] },
      { label: "Tautan", blocks: [{ t: "form", id: "cms-link", submit: "Simpan tautan", successTitle: "Tautan tersimpan", successText: "Tautan diperbarui di draf.", resetLabel: "Ubah lagi", fields: [
        { name: "email", label: "Email", value: "halo@eunike.example" }, { name: "wa", label: "WhatsApp", kind: "tel", value: "6281200000000" },
        { name: "ig", label: "Instagram", value: "https://instagram.com/eunike" }, { name: "web", label: "Website lain", placeholder: "https://…" },
      ] }] },
      { label: "Cadangan", blocks: [
        { t: "buttons", buttons: [{ label: "Ekspor semua konten (JSON)", toast: "Contoh: berkas cadangan diunduh." }, { label: "Impor cadangan", toast: "Contoh: pratinjau perubahan ditampilkan dulu sebelum diterapkan.", tone: "ghost" }] },
        { t: "table", title: "Riwayat versi (20 terakhir)", columns: ["Versi", "Oleh", "Waktu", "Status"], statusColumn: 3, rows: [["v14", "Dewi", "24 Okt 10.12", "Terbit"], ["v13", "Dewi", "20 Okt 16.40", "Terbit"], ["v12", "Bima", "12 Okt 09.05", "Terbit"]] },
      ] },
    ] }],
  },
};
