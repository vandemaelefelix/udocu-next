import { useTranslations } from "next-intl";
import DetailPage from "@/components/DetailPage";
import tvBackground from "@/assets/images/tv-background-image.png";

export default function AboutPage() {
  const t = useTranslations("about");

  return (
    <DetailPage
      backHref="/#about"
      colorScheme="bg-red-dark text-red-light"
      image={tvBackground}
      imageAlt=""
      imageClassName="object-cover"
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
