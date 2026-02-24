import { useTranslations } from "next-intl";

export default function WorkPage() {
  const t = useTranslations("work");

  return (
    <main>
      <h1>{t("title")}</h1>
    </main>
  );
}
