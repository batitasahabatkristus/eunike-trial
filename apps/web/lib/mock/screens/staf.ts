import type { Item, Screen } from "../types";

/** ST-01..ST-04 and PG-01/02 mockup. The leave list is shared by Staf, Kepala Departemen and HRD so the workflow can be walked in order. */
const leave: Item[] = [
  { id: "l1", title: "Cuti tahunan · 3 hari", sub: "10–12 Nov · Anda", status: "Menunggu Head", body: "Alasan: keperluan keluarga." },
  { id: "l2", title: "Izin sakit · 1 hari", sub: "14 Okt · Anda", status: "Terverifikasi" },
  { id: "l3", title: "Cuti tahunan · 2 hari", sub: "21–22 Des · Bu Maria", status: "Menunggu Head" },
  { id: "l4", title: "Cuti tahunan · 5 hari", sub: "28 Des–3 Jan · Pak Yohan", status: "Menunggu HRD" },
];
const statuses = ["Menunggu Head", "Menunggu HRD", "Terverifikasi", "Ditolak"];

export const STAF: Record<string, Screen> = {
  "/staf/saya": {
    title: "Staf", subtitle: "Absensi, cuti, dan pengajuan Anda.", reqs: ["ST-01"],
    blocks: [
      { t: "stats", items: [{ label: "Sisa cuti", value: "9 hari" }, { label: "Hadir bulan ini", value: "17" }, { label: "WFH", value: "2" }, { label: "Izin", value: "1" }] },
      { t: "checklist", id: "absen", title: "Hari ini", options: ["Hadir", "WFH", "Izin"], summary: "Status hari ini diisi: {n} dari {total}", save: "Catat Masuk / Pulang", saveToast: "Masuk tercatat 08.04 (contoh).", rows: [{ id: "today", name: "Senin 26 Okt", sub: "Masuk · Pulang" }] },
      { t: "form", id: "cuti-baru", into: "leave", intoStatus: "Menunggu Head", title: "Ajukan cuti", submit: "Ajukan cuti", successTitle: "Pengajuan terkirim", successText: "Diteruskan ke Kepala Departemen. Lihat di Pengajuan saya.", resetLabel: "Ajukan lagi", fields: [
        { name: "j", label: "Jenis", kind: "select", options: ["Cuti tahunan", "Izin sakit", "Izin lain"], required: true, error: "Jenis belum dipilih" }, { name: "m", label: "Mulai", kind: "date", required: true, error: "Tanggal mulai belum diisi" }, { name: "s", label: "Sampai", kind: "date" }, { name: "a", label: "Alasan", kind: "textarea" }] },
      { t: "pipeline", id: "leave", title: "Pengajuan saya dan tim", statuses, items: leave, tones: { Ditolak: "bad", Terverifikasi: "ok" }, actions: {} },
      { t: "buttons", buttons: [{ label: "Evaluasi diri", toast: "Buka menu Evaluasi diri di bawah.", tone: "ghost" }] },
    ],
  },
  "/staf/saya/evaluasi": {
    title: "Evaluasi diri", subtitle: "Isi tahap dan nilai Anda. OPEN Q-12: arti skema K, A1, A2 menunggu jawaban.", reqs: ["ST-04"],
    blocks: [{ t: "form", id: "evaluasi", submit: "Simpan evaluasi", successTitle: "Evaluasi tersimpan", successText: "Atasan dapat membacanya setelah Anda mengirim.", resetLabel: "Ubah lagi", fields: [
      { name: "tahap", label: "Tahap", kind: "select", options: ["K", "A1", "A2"], required: true, error: "Tahap belum dipilih" }, { name: "nilai", label: "Nilai diri", kind: "chips", options: ["1", "2", "3", "4", "5"] }, { name: "c", label: "Catatan", kind: "textarea" }] }],
  },
  "/staf/head": {
    title: "Persetujuan cuti", subtitle: "Pengajuan dari departemen Anda.", reqs: ["ST-02"],
    blocks: [{ t: "pipeline", id: "leave", statuses, items: leave, tones: { Ditolak: "bad", Terverifikasi: "ok" }, actions: {
      "Menunggu Head": [{ label: "Setujui", to: "Menunggu HRD", toast: "Disetujui. Diteruskan ke HRD." }, { label: "Tolak", to: "Ditolak", toast: "Ditolak. Staf diberi tahu.", tone: "ghost", ask: [{ name: "a", label: "Alasan", kind: "textarea", required: true, error: "Alasan belum diisi" }] }],
    } }],
  },
  "/staf/hrd": {
    title: "HRD", subtitle: "Verifikasi cuti yang sudah disetujui Kepala Departemen.", reqs: ["ST-03"],
    blocks: [{ t: "pipeline", id: "leave", statuses, items: leave, tones: { Ditolak: "bad", Terverifikasi: "ok" }, actions: {
      "Menunggu HRD": [{ label: "Verifikasi", to: "Terverifikasi", toast: "Terverifikasi. Sisa cuti staf berkurang otomatis." }, { label: "Tolak", to: "Ditolak", toast: "Ditolak.", tone: "ghost" }],
    } }],
  },
};

export const PENGURUS: Screen = {
  title: "Eunike hari ini", subtitle: "Ringkasan gabungan. Tidak menampilkan data pribadi keluarga atau isi konseling.", reqs: ["PG-01", "PG-02"],
  blocks: [
    { t: "stats", items: [{ label: "Keluarga aktif", value: "196", tone: "ok" }, { label: "Program berjalan", value: "6" }, { label: "Staf aktif", value: "18" }, { label: "Acara pekan ini", value: "1" }] },
    { t: "bars", title: "Kehadiran per program (pekan lalu)", bars: [{ label: "SK", value: 83 }, { label: "KTB", value: 81 }, { label: "Acara", value: 70 }, { label: "Staf", value: 94 }] },
    { t: "cards", title: "Perlu perhatian", items: [
      { title: "3 permintaan konseling baru", sub: "Hanya jumlah. Isi hanya dibaca konselor.", badge: "Konseling", tone: "warn" },
      { title: "12 pendaftar menunggu keputusan", sub: "Admissions", badge: "Pendaftaran", tone: "warn" },
      { title: "2 tagihan menunggu verifikasi", sub: "Keuangan", badge: "Keuangan", tone: "info" },
      { title: "1 kelompok KTB tanpa fasilitator", sub: "KTB", badge: "KTB", tone: "bad" },
    ] },
    { t: "notice", lock: true, text: "Ringkasan ini tidak menampilkan data pribadi keluarga atau isi konseling." },
  ],
};
