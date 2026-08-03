import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAlternates } from "@/lib/seo";
import DetailPage from "@/components/DetailPage";
import AboutVideo from "@/components/AboutVideo";
import VideoPlayer from "@/components/VideoPlayer";

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
    title: t("aboutTitle"),
    description: t("aboutDescription"),
    alternates: getAlternates("about"),
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <DetailPage
      backHref="/#about"
      activeItem="about"
      colorScheme="bg-red-dark text-red-light"
      media={
        <VideoPlayer className="h-full w-full">
          <AboutVideo
            src="/videos/about.v2.mp4"
            poster="/videos/about-poster.webp"
            preload="none"
            className="h-full w-full object-cover"
          />
        </VideoPlayer>
      }
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
    </DetailPage>
  );
}
