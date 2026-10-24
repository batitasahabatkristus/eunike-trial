import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.SITE_URL ?? "http://localhost:3000";
  return {
    rules: [{ userAgent: "*", allow: ["/id", "/en"], disallow: ["/beranda", "/sk/", "/ktb/", "/event/", "/staf/", "/markom/", "/konseling/", "/keuangan/", "/pengurus", "/masuk"] }],
    sitemap: `${base}/sitemap.xml`,
  };
}
