import { notFound } from "next/navigation";
import { getMessages } from "@/lib/i18n";
import { isLocale } from "@/lib/routes";
import { Ministries } from "@/components/site/Sections";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const m = getMessages(locale);
  return (
    <div className="page-pad">
      <Ministries m={m.ministries} locale={locale} />
    </div>
  );
}
