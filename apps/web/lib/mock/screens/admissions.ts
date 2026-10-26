import type { Block, Item, Screen } from "../types";

/** AM-01..AM-10 mockup. Sample content only. */
const wizard: Block = {
  t: "steps", id: "daftar",
  steps: [
    { title: "Data pasangan", intro: "Isi data kalian berdua. Tanda * wajib diisi.", fields: [
      { name: "suami", label: "Nama suami", required: true }, { name: "istri", label: "Nama istri", required: true },
      { name: "wa", label: "Nomor WhatsApp", kind: "tel", required: true, error: "Nomor WA belum diisi", placeholder: "08xxxxxxxxxx" },
      { name: "email", label: "Email", placeholder: "nama@email.com" },
      { name: "gereja", label: "Gereja", placeholder: "Nama gereja" },
      { name: "anak", label: "Jumlah anak", kind: "number" },
    ] },
    { title: "Data individu", intro: "Satu referee untuk masing-masing. Tautan referensi dikirim setelah formulir dikirim.", tabs: [
      { label: "Suami", fields: [
        { name: "s_lahir", label: "Tanggal lahir suami", kind: "date" }, { name: "s_kerja", label: "Pekerjaan suami" },
        { name: "s_ref", label: "Nama referee suami", required: true }, { name: "s_refwa", label: "WhatsApp referee suami", kind: "tel", required: true, error: "Nomor WA referee suami belum diisi" } ] },
      { label: "Istri", fields: [
        { name: "i_lahir", label: "Tanggal lahir istri", kind: "date" }, { name: "i_kerja", label: "Pekerjaan istri" },
        { name: "i_ref", label: "Nama referee istri", required: true }, { name: "i_refwa", label: "WhatsApp referee istri", kind: "tel", required: true, error: "Nomor WA referee istri belum diisi" } ] },
    ] },
    { title: "Jurnal", intro: "Ceritakan perjalanan iman keluarga kalian dengan kata-kata sendiri.", fields: [
      { name: "jurnal", label: "Jurnal keluarga", kind: "textarea", required: true, placeholder: "Mengapa kalian ingin bergabung di Sahabat Kristus?", help: "Jawab dengan jujur. Tidak ada jawaban yang salah." },
    ], counter: { field: "jurnal", min: 50 } },
  ],
  successTitle: "Terima kasih, formulir terkirim", successText: "Tautan referensi sudah dikirim ke kedua referee lewat WhatsApp. Simpan nomor ini untuk melihat status.",
  codePrefix: "SK-", successHref: { href: "/sk/daftar/status", label: "Lihat status" },
};

const statuses = ["Pending", "Perlu Jawaban", "Interview", "Selesai", "Diterima", "Ditolak", "Active"];
const apps: Item[] = [
  { id: "a1", title: "Keluarga Hartono", sub: "Andre & Maria · SK-0412", status: "Pending", tag: "Referensi 1 dari 2", meta: [["Gereja", "GKI Pondok Indah"], ["Anak", "1 (2 tahun)"], ["Jurnal", "Menunggu pembaca"]], body: "Ringkasan: pasangan muda, anak pertama usia 2 tahun, mencari komunitas parenting Kristen." },
  { id: "a2", title: "Keluarga Lim", sub: "Kevin & Stella · SK-0413", status: "Perlu Jawaban", tag: "Referensi 2 dari 2", meta: [["Catatan admin", "Mohon lengkapi alamat dan pekerjaan istri."]] },
  { id: "a3", title: "Keluarga Tanoto", sub: "Yohan & Ruth · SK-0409", status: "Interview", tag: "Rabu 14.00", meta: [["Pewawancara", "Pak Samuel"], ["Tempat", "Ruang A Eunike"]] },
  { id: "a4", title: "Keluarga Wibowo", sub: "Dimas & Intan · SK-0405", status: "Selesai", tag: "Rekomendasi: Siap", meta: [["Kesiapan", "5"], ["Komitmen", "4"], ["Kesesuaian", "5"]] },
  { id: "a5", title: "Keluarga Gozali", sub: "Michael & Lina · SK-0401", status: "Diterima", tag: "Tagihan terkirim", meta: [["Tagihan", "Rp 1.500.000 (menunggu)"]] },
];

const pendaftar: Screen = {
  title: "Pendaftar SK", subtitle: "Semua permohonan keluarga baru, dari formulir sampai keputusan.", reqs: ["AM-05", "AM-06", "AM-10"],
  blocks: [
    { t: "stats", items: [{ label: "Pending", value: "12" }, { label: "Perlu jawaban", value: "3", tone: "warn" }, { label: "Wawancara pekan ini", value: "4" }, { label: "Diterima bulan ini", value: "6", tone: "ok" }] },
    { t: "pipeline", id: "apps", statuses, items: apps, search: true, tones: { Ditolak: "bad", Active: "ok", Diterima: "ok", "Perlu Jawaban": "warn" },
      actions: {
        Pending: [
          { label: "Minta data tambahan", to: "Perlu Jawaban", toast: "Status Perlu Jawaban. Catatan dikirim ke pendaftar.", ask: [{ name: "n", label: "Catatan untuk pendaftar", kind: "textarea", required: true, error: "Catatan belum diisi" }] },
          { label: "Jadwalkan wawancara", to: "Interview", toast: "Wawancara dijadwalkan. Undangan terkirim.", tone: "ghost", ask: [
            { name: "p", label: "Pewawancara", kind: "select", options: ["Pak Samuel", "Bu Ruth", "Pak Daniel"], required: true }, { name: "d", label: "Tanggal", kind: "date", required: true },
            { name: "j", label: "Jam", kind: "time" }, { name: "t", label: "Tempat", placeholder: "Ruang A Eunike" }] },
        ],
        "Perlu Jawaban": [{ label: "Jawaban diterima (contoh)", to: "Pending", toast: "Pendaftar melengkapi data. Status kembali Pending.", tone: "ghost" }],
        Interview: [{ label: "Hasil wawancara masuk (contoh)", to: "Selesai", toast: "Pewawancara menyimpan penilaian.", tone: "ghost" }],
        Selesai: [
          { label: "Terima", to: "Diterima", toast: "Diterima. Tagihan dibuat dan dikirim ke Bendahara." },
          { label: "Tidak diterima", to: "Ditolak", tone: "danger", toast: "Pesan penolakan yang lembut (sudah disetujui) dikirim." },
        ],
        Diterima: [{ label: "Pembayaran lunas (contoh)", to: "Active", toast: "Lunas. Akun orang tua dibuat dan undangan terkirim.", tone: "ghost" }],
      } },
  ],
};

const detail: Screen = {
  title: "Detail pendaftar · Keluarga Hartono", subtitle: "SK-0412 · Status: Pending", reqs: ["AM-05", "AM-06"],
  blocks: [
    { t: "buttons", buttons: [{ label: "Minta data tambahan", toast: "Contoh: status berubah ke Perlu Jawaban." }, { label: "Jadwalkan wawancara", toast: "Contoh: undangan wawancara terkirim.", tone: "ghost" }, { label: "Putuskan", toast: "Contoh: pilih Diterima atau Tidak diterima.", tone: "ghost" }] },
    { t: "tabs", tabs: [
      { label: "Ringkasan", blocks: [{ t: "kv", rows: [["Suami", "Andre Hartono"], ["Istri", "Maria Hartono"], ["Anak", "Nathan, 2 tahun"], ["Gereja", "GKI Pondok Indah"], ["Dikirim", "12 Okt 2026"]] }] },
      { label: "Formulir suami", blocks: [{ t: "kv", rows: [["Pekerjaan", "Insinyur"], ["Lahir", "4 Mar 1991"], ["Referee", "Pak Hendra (siap)"]] }] },
      { label: "Formulir istri", blocks: [{ t: "kv", rows: [["Pekerjaan", "Guru"], ["Lahir", "9 Jul 1992"], ["Referee", "Bu Lisa (belum menjawab)"]] }] },
      { label: "Referensi", blocks: [{ t: "table", columns: ["Referee", "Untuk", "Jawaban"], rows: [["Pak Hendra", "Suami", "Siap"], ["Bu Lisa", "Istri", "Menunggu"]], statusColumn: 2 }] },
      { label: "Jurnal", blocks: [{ t: "notice", tone: "info", text: "Kami rindu keluarga kami bertumbuh bersama komunitas yang mengajarkan kasih…" }] },
      { label: "Wawancara", blocks: [{ t: "notice", tone: "info", text: "Belum dijadwalkan." }] },
      { label: "Riwayat status", blocks: [{ t: "timeline", steps: [{ label: "Formulir terkirim", state: "done", note: "12 Okt" }, { label: "Pemeriksaan berkas", state: "now" }, { label: "Referensi 1 dari 2", state: "todo" }, { label: "Wawancara", state: "todo" }, { label: "Keputusan", state: "todo" }] }] },
    ] },
  ],
};

const status: Screen = {
  title: "Status pendaftaran", subtitle: "Keluarga Hartono · SK-0412", reqs: ["AM-03"],
  blocks: [{ t: "tabs", tabs: [
    { label: "Pending", blocks: [{ t: "timeline", steps: [{ label: "Formulir terkirim", state: "done", note: "12 Okt" }, { label: "Pemeriksaan berkas", state: "now", note: "Sedang diperiksa admin" }, { label: "Referensi 1 dari 2", state: "todo" }, { label: "Wawancara", state: "todo" }, { label: "Keputusan", state: "todo" }] }] },
    { label: "Perlu Jawaban", blocks: [{ t: "notice", tone: "err", text: "Admin meminta data tambahan: mohon lengkapi alamat dan pekerjaan istri." }, { t: "buttons", buttons: [{ label: "Lengkapi data", toast: "Contoh: membuka formulir yang perlu dilengkapi." }] }, { t: "timeline", steps: [{ label: "Formulir terkirim", state: "done" }, { label: "Pemeriksaan berkas", state: "now", note: "Menunggu jawaban Anda" }, { label: "Wawancara", state: "todo" }, { label: "Keputusan", state: "todo" }] }] },
    { label: "Active", blocks: [{ t: "notice", tone: "ok", text: "Selamat datang di Sahabat Kristus! Akun orang tua Anda sudah aktif. Anda akan menerima undangan lewat WhatsApp." }] },
  ] }],
};

const referee: Screen = {
  title: "Formulir referensi", subtitle: "Tautan satu kali untuk Pak Hendra, referee Andre Hartono.", reqs: ["AM-04"],
  blocks: [
    { t: "notice", tone: "info", text: "Jawaban Anda hanya dibaca tim pendaftaran. Setelah dikirim, tautan ini tidak berlaku lagi." },
    { t: "form", id: "referee", submit: "Kirim referensi", successTitle: "Terima kasih atas referensi Anda", successText: "Tautan ini sudah tidak berlaku.", resetLabel: "Coba isi lagi (contoh)", fields: [
      { name: "q1", label: "Sudah berapa lama Anda mengenal mereka?", kind: "textarea", required: true },
      { name: "q2", label: "Bagaimana kehidupan iman mereka?", kind: "textarea", required: true },
      { name: "q3", label: "Bagaimana mereka mendidik anak?", kind: "textarea" },
      { name: "q4", label: "Bagaimana hubungan mereka sebagai pasangan?", kind: "textarea" },
      { name: "q5", label: "Apa kekuatan mereka?", kind: "textarea" },
      { name: "q6", label: "Apa yang perlu didampingi?", kind: "textarea" },
      { name: "r", label: "Penilaian Anda", kind: "select", options: ["Siap", "Perlu pendampingan", "Belum siap"], required: true },
      { name: "c", label: "Saya setuju jawaban saya dibaca tim pendaftaran", kind: "check", required: true, error: "Persetujuan belum dicentang" },
    ] },
  ],
};

const pasangan: Screen = {
  title: "Pasangan", subtitle: "Pasangan yang sudah diterima, per kelas.", reqs: ["AM-09"],
  blocks: [{ t: "cards", items: [
    { title: "Keluarga Gozali", sub: "Michael & Lina", badge: "Elia", tone: "info" }, { title: "Keluarga Santoso", sub: "Daniel & Rina", badge: "Elia", tone: "info" },
    { title: "Keluarga Pranata", sub: "Sari & Eko", badge: "Markus", tone: "info" }, { title: "Keluarga Halim", sub: "Linda & Budi", badge: "Markus", tone: "info" },
    { title: "Keluarga Tanoto", sub: "Yohan & Ruth", badge: "Belum ada kelas", tone: "warn" },
  ] }],
};

const wawancaraAdmin: Screen = {
  title: "Wawancara", subtitle: "Jadwal dan hasil wawancara.", reqs: ["AM-06"],
  blocks: [{ t: "table", columns: ["Keluarga", "Pewawancara", "Waktu", "Status"], statusColumn: 3, rows: [["Keluarga Tanoto", "Pak Samuel", "Rabu 14.00", "Dijadwalkan"], ["Keluarga Wibowo", "Bu Ruth", "Senin 10.00", "Selesai"], ["Keluarga Lim", "Pak Daniel", "Kamis 16.00", "Dijadwalkan"]] }],
};

const jurnal: Screen = {
  title: "Pembaca jurnal", subtitle: "Jurnal yang ditugaskan kepada Anda.", reqs: ["AM-07"],
  blocks: [{ t: "pipeline", id: "jurnal", statuses: ["Ditugaskan", "Selesai dibaca"], empty: "Tidak ada jurnal yang ditugaskan.", items: [
    { id: "j1", title: "Keluarga Hartono", sub: "SK-0412 · 312 kata", status: "Ditugaskan", body: "Kami rindu keluarga kami bertumbuh bersama komunitas yang mengajarkan kasih. Sejak Nathan lahir, kami sadar bahwa mendidik anak butuh teman seperjalanan…" },
    { id: "j2", title: "Keluarga Lim", sub: "SK-0413 · 284 kata", status: "Ditugaskan", body: "Iman kami diuji ketika kami pindah kota. Kami belajar berdoa bersama setiap malam dan ingin memperdalam kebiasaan itu…" },
    { id: "j3", title: "Keluarga Wibowo", sub: "SK-0405 · 401 kata", status: "Selesai dibaca", meta: [["Catatan", "Jujur dan hangat."]] },
  ], actions: { Ditugaskan: [{ label: "Tandai selesai", to: "Selesai dibaca", toast: "Jurnal ditandai selesai.", ask: [{ name: "n", label: "Catatan Anda", kind: "textarea" }] }] } }],
};

const interviewer: Screen = {
  title: "Pewawancara", subtitle: "Wawancara yang dijadwalkan untuk Anda.", reqs: ["AM-08"],
  blocks: [{ t: "pipeline", id: "wawancara", statuses: ["Dijadwalkan", "Selesai"], items: [
    { id: "w1", title: "Keluarga Tanoto", sub: "Rabu 14.00 · Ruang A Eunike", status: "Dijadwalkan", meta: [["Referensi", "2 dari 2 siap"]] },
    { id: "w2", title: "Keluarga Lim", sub: "Kamis 16.00 · Ruang B", status: "Dijadwalkan" },
    { id: "w3", title: "Keluarga Wibowo", sub: "Senin 10.00", status: "Selesai", meta: [["Rekomendasi", "Siap"]] },
  ], actions: { Dijadwalkan: [{ label: "Isi penilaian", to: "Selesai", toast: "Penilaian tersimpan. Status wawancara Selesai.", ask: [
    { name: "k", label: "Kesiapan (1-5)", kind: "select", options: ["1", "2", "3", "4", "5"], required: true }, { name: "m", label: "Komitmen (1-5)", kind: "select", options: ["1", "2", "3", "4", "5"], required: true },
    { name: "s", label: "Kesesuaian (1-5)", kind: "select", options: ["1", "2", "3", "4", "5"], required: true }, { name: "r", label: "Rekomendasi", kind: "select", options: ["Siap", "Perlu pendampingan", "Belum siap"], required: true },
    { name: "c", label: "Catatan", kind: "textarea" }] }] } }],
};

const terkirim: Screen = {
  title: "Formulir terkirim", reqs: ["AM-02"],
  blocks: [{ t: "notice", tone: "ok", text: "Terima kasih. Formulir Anda sudah kami terima." }, { t: "buttons", buttons: [{ label: "Lihat status pendaftaran", toast: "Contoh: membuka halaman status." }] }],
};

export const ADMISSIONS: Record<string, Screen> = {
  "/sk/daftar": { title: "Pendaftaran Sahabat Kristus", subtitle: "Tiga langkah. Tersimpan otomatis, bisa dilanjutkan lewat tautan email atau WhatsApp.", reqs: ["AM-01", "AM-02"], blocks: [wizard] },
  "/sk/daftar/individu": { title: "Pendaftaran Sahabat Kristus", subtitle: "Langkah 2 dari 3", reqs: ["AM-01"], blocks: [wizard] },
  "/sk/daftar/jurnal": { title: "Pendaftaran Sahabat Kristus", subtitle: "Langkah 3 dari 3", reqs: ["AM-01"], blocks: [wizard] },
  "/sk/daftar/terkirim": terkirim,
  "/sk/daftar/status": status,
  "/sk/referensi/[token]": referee,
  "/sk/admin/pendaftar": pendaftar,
  "/sk/admin/pendaftar/[id]": detail,
  "/sk/admin/pendaftar/pasangan": pasangan,
  "/sk/admin/pendaftar/wawancara": wawancaraAdmin,
  "/sk/admin/wawancara": wawancaraAdmin,
  "/sk/admin/wawancara/saya": interviewer,
  "/sk/admin/jurnal": jurnal,
};
