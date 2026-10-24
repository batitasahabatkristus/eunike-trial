import { notFound } from "next/navigation";
import { getMessages } from "@/lib/i18n";
import { isLocale } from "@/lib/routes";
import { About, Vision } from "@/components/site/Sections";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale);
  return (
    <div className="page-pad">
      <><About m={m.about} locale={locale} /><Vision m={m.vision} /></>
    </div>
  );
}
