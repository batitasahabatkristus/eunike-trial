import { notFound } from "next/navigation";
import { getMessages } from "@/lib/i18n";
import { isLocale } from "@/lib/routes";
import { Contact } from "@/components/site/Sections";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale);
  return (
    <div className="page-pad">
      <Contact m={m.contact} locale={locale} />
    </div>
  );
}
