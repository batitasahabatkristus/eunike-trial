import type { UploadTicket } from "@/app/(app)/(shell)/sk/keluarga/actions";

export const TOO_BIG = "Berkas terlalu besar. Maksimal 50 MB per berkas.";

/** PUTs a file to the destination a server action approved. Reports percent progress. Browser-only. */
export function putFile(t: UploadTicket, file: File, onProgress: (p: number) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!t.ok || !t.url) return reject(new Error(t.message ?? "Unggahan belum bisa dimulai."));
    const x = new XMLHttpRequest();
    x.open("PUT", t.url);
    let body: XMLHttpRequestBodyInit = file;
    if (t.mode === "supabase") { const f = new FormData(); f.append("cacheControl", "3600"); f.append("", file); body = f; x.setRequestHeader("x-upsert", "false"); }
    else x.setRequestHeader("Content-Type", file.type);
    x.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    x.onload = () => (x.status >= 200 && x.status < 300 ? resolve() : reject(new Error(x.status === 413 ? TOO_BIG : x.status === 415 ? "Jenis berkas tidak didukung." : "Unggahan gagal. Coba lagi.")));
    x.onerror = () => reject(new Error("Unggahan terputus. Periksa sambungan lalu coba lagi."));
    x.send(body);
  });
}
