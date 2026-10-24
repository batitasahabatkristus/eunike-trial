import { notFound } from "next/navigation";
import { getMessages } from "@/lib/i18n";
import { isLocale } from "@/lib/routes";
import { SITE_LINKS } from "@/lib/site";
import { About, Contact, Ecosystem, Hero, Journey, Ministries, Partner, Ribbon, Stories, Vision } from "@/components/site/Sections";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale);
  // F-06: Organization (NGO) structured data. No founding year until Eunike confirms the "Since 1998" claim (Q-08).
  const ld = {
    "@context": "https://schema.org",
    "@type": "NGO",
    name: "Yayasan Eunike",
    description: m.meta.description,
    url: process.env.SITE_URL ?? "http://localhost:3000",
    email: SITE_LINKS.email,
    telephone: SITE_LINKS.phoneLabel,
    sameAs: [SITE_LINKS.website, SITE_LINKS.instagram],
    areaServed: "Jakarta, Indonesia",
    inLanguage: locale,
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <Hero m={m.hero} locale={locale} />
      <Ribbon items={m.ribbon} />
      <About m={m.about} locale={locale} />
      <Vision m={m.vision} />
      <Ministries m={m.ministries} locale={locale} />
      <Ecosystem m={m.ecosystem} />
      <Journey m={m.journey} />
      <Stories m={m.stories} />
      <Partner m={m.partner} locale={locale} />
      <Contact m={m.contact} locale={locale} />
    </>
  );
}
