import type { Item, Screen } from "../types";

/** FN-01..FN-03 mockup. Amounts are samples (OPEN Q-07: no payment gateway in v1). */
const invoices: Item[] = [
  { id: "i1", title: "Keluarga Gozali", sub: "INV-0231 · Rp 1.500.000 · jatuh tempo 30 Okt", status: "Menunggu", meta: [["Untuk", "Biaya bergabung SK"]] },
  { id: "i2", title: "Keluarga Wibowo", sub: "INV-0229 · Rp 1.500.000", status: "Bukti diunggah", body: "Bukti transfer BCA, 20 Okt 2026 (contoh).", meta: [["Berkas", "bukti-wibowo.jpg (privat)"]] },
  { id: "i3", title: "Keluarga Santoso", sub: "INV-0220 · Rp 650.000 · Semester Jul–Des", status: "Bukti diunggah", body: "Bukti transfer Mandiri (contoh)." },
  { id: "i4", title: "Keluarga Pranata", sub: "INV-0218 · Rp 650.000", status: "Lunas", meta: [["Diverifikasi", "18 Okt oleh Bendahara"]] },
  { id: "i5", title: "Keluarga Halim", sub: "INV-0217 · Rp 650.000", status: "Lunas" },
];

export const FINANCE: Record<string, Screen> = {
  "/keuangan/tagihan": {
    title: "Tagihan", subtitle: "Verifikasi pembayaran keluarga. Tidak ada payment gateway di versi ini.", reqs: ["FN-01", "FN-02"],
    blocks: [
      { t: "stats", items: [{ label: "Menunggu", value: "1", tone: "warn" }, { label: "Bukti diunggah", value: "2" }, { label: "Lunas bulan ini", value: "8", tone: "ok" }, { label: "Total terverifikasi", value: "Rp 5,9 jt" }] },
      { t: "pipeline", id: "invoices", statuses: ["Menunggu", "Bukti diunggah", "Lunas"], items: invoices, search: true, actions: {
        Menunggu: [{ label: "Pembayar unggah bukti (contoh)", to: "Bukti diunggah", toast: "Bukti diunggah ke penyimpanan privat.", tone: "ghost" }],
        "Bukti diunggah": [{ label: "Verifikasi", to: "Lunas", toast: "Pembayaran terverifikasi. Pembayar diberi tahu." }, { label: "Tolak bukti", to: "Menunggu", toast: "Bukti ditolak. Pembayar diminta mengunggah ulang.", tone: "ghost" }],
      } },
    ],
  },
  "/keuangan/laporan": {
    title: "Laporan keuangan", subtitle: "Laporan bulanan. Angka adalah contoh.", reqs: ["FN-03"],
    blocks: [
      { t: "buttons", buttons: [{ label: "Ekspor Excel", toast: "Contoh: berkas Excel diunduh." }, { label: "Cetak", toast: "Contoh: membuka tampilan cetak.", tone: "ghost" }] },
      { t: "bars", title: "Pembayaran terverifikasi per bulan (juta rupiah)", bars: [{ label: "Jul", value: 62, display: "6,2" }, { label: "Agu", value: 48, display: "4,8" }, { label: "Sep", value: 71, display: "7,1" }, { label: "Okt", value: 59, display: "5,9" }] },
      { t: "table", title: "Oktober 2026", columns: ["Jenis", "Jumlah", "Nominal", "Status"], statusColumn: 3, rows: [["Biaya bergabung", "3", "Rp 4.500.000", "Lunas"], ["Iuran semester", "2", "Rp 1.300.000", "Lunas"], ["Biaya bergabung", "1", "Rp 1.500.000", "Menunggu"]] },
    ],
  },
};
