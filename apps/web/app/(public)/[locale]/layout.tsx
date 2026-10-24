import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../site.css";
import { fontVars } from "@/lib/fonts";
import { getMessages } from "@/lib/i18n";
import { LOCALES, isLocale } from "@/lib/routes";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Sections";
import { Effects } from "@/components/site/Effects";

export const dynamicParams = false;
export const generateStaticParams = () => LOCALES.map((locale) => ({ locale }));

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const m = getMessages(locale).meta;
  return {
    metadataBase: new URL(process.env.SITE_URL ?? "http://localhost:3000"),
    title: { default: m.title, template: "%s · Yayasan Eunike" },
    description: m.description,
    themeColor: "#612E8F",
    alternates: { canonical: `/${locale}`, languages: { id: "/id", en: "/en", "x-default": "/id" } },
    openGraph: { type: "website", siteName: "Yayasan Eunike", title: m.title, description: m.description, locale: locale === "id" ? "id_ID" : "en_US", url: `/${locale}` },
    twitter: { card: "summary_large_image", title: m.title, description: m.description },
  };
}

export default async function SiteLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale);
  return (
    <html lang={locale} className={fontVars} data-scroll-behavior="smooth">
      <body>
        <a className="skip-link" href="#main">{m.nav.skip}</a>
        <Header locale={locale} m={m.nav} />
        <main id="main">{children}</main>
        <Footer m={m.footer} locale={locale} />
        <Effects />
      </body>
    </html>
  );
}
