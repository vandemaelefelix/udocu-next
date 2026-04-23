import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

export default function NotFound() {
  const t = useTranslations("notFound");
  const locale = useLocale();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-4 font-posterman text-[72px] font-black leading-none md:text-[120px]">
        404
      </h1>
      <p className="mb-2 font-serif text-2xl font-semibold">{t("heading")}</p>
      <p className="mb-8 font-serif text-lg opacity-70">{t("description")}</p>
      <Link
        href={`/${locale}`}
        className="font-helvetica text-sm font-medium uppercase tracking-widest underline underline-offset-4 transition-opacity hover:opacity-70"
      >
        {t("backHome")}
      </Link>
    </main>
  );
}
