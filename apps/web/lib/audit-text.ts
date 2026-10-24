export interface AuditRow { action: string; row_table: string | null; before: Record<string, unknown> | null; after: Record<string, unknown> | null }
const STATUS: Record<string, string> = { draft: "Draf", review: "Menunggu tinjau", scheduled: "Terjadwal", published: "Terbit" };

/** Plain-Indonesian line for the dashboard's "Aktivitas terbaru". Never includes names or message text. */
export function describeAudit(r: AuditRow): string {
  const a = r.after ?? {}, b = r.before ?? {};
  switch (r.row_table) {
    case "lessons": {
      const n = (a.number ?? b.number) as number | undefined;
      if (r.action === "INSERT") return `Membuat Pelajaran ${n ?? ""}`.trim();
      if (a.status !== b.status) return `Pelajaran ${n}: ${STATUS[String(b.status)] ?? b.status} → ${STATUS[String(a.status)] ?? a.status}`;
      return `Memperbarui Pelajaran ${n}`;
    }
    case "epk_reports": return a.status === "published" ? "Menerbitkan laporan semester" : "Memperbarui laporan semester";
    case "families": return a.data_status !== b.data_status ? `Status data keluarga → ${a.data_status === "ok" ? "terkonfirmasi" : a.data_status === "cor" ? "perlu koreksi" : "perlu dicek"}` : "Memperbarui data keluarga";
    case "sk_class_members": return r.action === "DELETE" ? "Memindahkan anak dari kelas" : "Menempatkan anak di kelas";
    case "sk_meetings": return r.action === "ATTENDANCE_SAVED" ? `Menyimpan absensi (${(a.rows as number) ?? "?"} baris)` : "Memperbarui pertemuan";
    case "user_roles": return r.action === "INSERT" ? "Memberi peran" : r.action === "DELETE" ? "Mencabut peran" : a.active === false ? "Menonaktifkan peran" : "Memperbarui peran";
    default: return r.action;
  }
}
