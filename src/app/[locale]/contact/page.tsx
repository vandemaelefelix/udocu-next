import { useTranslations } from "next-intl";

export default function ContactPage() {
  const t = useTranslations("contact");

  return (
    <main>
      <h1>{t("title")}</h1>
    </main>
  );
}
