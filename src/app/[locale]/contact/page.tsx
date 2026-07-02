import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAlternates } from "@/lib/seo";
import ContactSection from "@/components/ContactSection";

type Params = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("contactTitle"),
    description: t("contactDescription"),
    alternates: getAlternates(locale, "contact"),
  };
}

export default function ContactPage() {
  return (
    <main id="main-content">
      <ContactSection />
    </main>
  );
}
