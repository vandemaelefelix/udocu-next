import { useTranslations } from "next-intl";
import DetailPage from "@/components/DetailPage";
import bioPhoto from "@/assets/images/who-am-i.png";

export default function WhoAmIPage() {
  const t = useTranslations("whoAmI");

  return (
    <DetailPage
      backHref="/#who-am-i"
      colorScheme="bg-green-dark text-green-light"
      image={bioPhoto}
      imageAlt={t("imageAlt")}
      date={t("date")}
      title={<span className="font-serif font-semibold">{t("title")}</span>}
    >
      <p>{t("detailParagraph1")}</p>
      <p>{t("detailParagraph2")}</p>
    </DetailPage>
  );
}
