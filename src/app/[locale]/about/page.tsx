import type { Metadata } from "next";
import { useTranslations } from "next-intl";
import { getTranslations } from "next-intl/server";
import { getAlternates } from "@/lib/seo";
import DetailPage from "@/components/DetailPage";
import CloudinaryVideo from "@/components/CloudinaryVideo";
import VideoPlayer from "@/components/VideoPlayer";

type Params = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("aboutTitle"),
    description: t("aboutDescription"),
    alternates: getAlternates(locale, "about"),
  };
}

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    <DetailPage
      backHref="/#about"
      colorScheme="bg-red-dark text-red-light"
      media={
        <VideoPlayer className="h-full w-full">
          <CloudinaryVideo className="h-full w-full object-cover" />
        </VideoPlayer>
      }
      date={t("date")}
      title={
        <>
          <span className="font-serif font-semibold">{t("titlePrefix")}</span>{" "}
          <span className="font-posterman font-black">{t("titleSuffix")}</span>
        </>
      }
    >
      <p>{t("detailParagraph1")}</p>
      <p>{t("detailParagraph2")}</p>
      <p>{t("detailParagraph3")}</p>
      <p>{t("detailParagraph4")}</p>
    </DetailPage>
  );
}
