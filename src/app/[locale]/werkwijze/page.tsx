import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAlternates } from "@/lib/seo";
import DetailPage from "@/components/DetailPage";
import NumberedPoints from "@/components/NumberedPoints";

type Params = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("werkwijzeTitle"),
    description: t("werkwijzeDescription"),
    alternates: getAlternates("werkwijze"),
  };
}

export default async function WerkwijzePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("werkwijze");

  // Kurt supplied the price as his final point. It leads instead, because the
  // reason this page exists is that visitors could not find the price.
  const points = Array.from({ length: 12 }, (_, i) => t(`point${i + 1}`));

  return (
    <DetailPage
      backHref="/"
      colorScheme="bg-blue-dark text-blue-light"
      overlayBgColor="var(--color-blue-dark)"
      overlayTextColor="var(--color-blue-light)"
      title={t("title")}
    >
      <p className="font-serif text-[20px] leading-7 md:text-[24px] md:leading-9">
        {t("price")}
      </p>

      <NumberedPoints points={points} />
    </DetailPage>
  );
}
