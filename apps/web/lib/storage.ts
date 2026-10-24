import "server-only";
import path from "node:path";

export const MAX_BYTES = 50 * 1024 * 1024; // SK-11: 50 MB per file
export const MAX_FILES = 3;
export const ALLOWED_MIME = /^(image\/(jpeg|png|webp|heic|heif)|video\/(mp4|quicktime|webm))$/;
export const BUCKETS = ["memory-markers", "lesson-assets"] as const;
export type Bucket = (typeof BUCKETS)[number];

/** Dev and tests store files here; deployed environments use Supabase Storage (private buckets, signed URLs, 15 minutes). */
export const localRoot = () => process.env.LOCAL_UPLOAD_DIR ?? path.join(process.cwd(), ".data", "uploads");
export const safeFileName = (n: string) => n.normalize("NFKD").replace(/[^\w.\-]+/g, "_").replace(/^\.+/, "").slice(-80) || "berkas";
export const PATH_RE = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[\w.-]{1,130}$/i;

// Lesson art and the Pustaka library: images only, 10 MB, stored as <lesson_id or "pustaka">/<uuid>-<name>
export const ASSET_MAX_BYTES = 10 * 1024 * 1024;
export const ASSET_MIME = /^image\/(jpeg|png|webp)$/;
export const ASSET_RE = /^[0-9a-z-]{3,36}\/[\w.-]{1,130}$/i;
