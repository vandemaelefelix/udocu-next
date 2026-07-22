import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { getAlternates } from "@/lib/seo";
import DetailPage from "@/components/DetailPage";
import bioPhoto from "@/assets/images/who-am-i.png";

type Params = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("whoAmITitle"),
    description: t("whoAmIDescription"),
    alternates: getAlternates(locale, "who-am-i"),
  };
}

export default function WhoAmIPage() {
  const t = useTranslations("whoAmI");

  return (
    <DetailPage
      backHref="/#who-am-i"
      colorScheme="bg-green-dark text-green-light"
      image={bioPhoto}
      imageAlt={t("imageAlt")}
      imageCredit={t("photoCredit")}
      date={t("date")}
      title={<span className="font-serif font-semibold">{t("title")}</span>}
    >
      <p>{t("detailParagraph1")}</p>
      <p>{t("detailParagraph2")}</p>
    </DetailPage>
  );
}
