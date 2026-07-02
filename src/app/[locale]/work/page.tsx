import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { getAlternates } from "@/lib/seo";

type Params = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("workTitle"),
    description: t("workDescription"),
    alternates: getAlternates(locale, "work"),
  };
}

export default function WorkPage() {
  const t = useTranslations("work");

  return (
    <main id="main-content">
      <h1>{t("title")}</h1>
    </main>
  );
}
