import type { MetadataRoute } from "next";
import { LOCALES } from "@/lib/routes";

const PAGES = ["", "/tentang", "/program", "/kontak", "/privasi", "/syarat"];

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.SITE_URL ?? "http://localhost:3000";
  return LOCALES.flatMap((l) =>
    PAGES.map((p) => ({
      url: `${base}/${l}${p}`,
      alternates: { languages: Object.fromEntries(LOCALES.map((x) => [x, `${base}/${x}${p}`])) },
    })),
  );
}
