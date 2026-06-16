"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("error");
  const locale = useLocale();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <h1 className="mb-4 font-posterman text-[72px] font-black leading-none md:text-[120px]">
        500
      </h1>
      <p className="mb-2 font-serif text-2xl font-semibold">{t("heading")}</p>
      <p className="mb-8 font-serif text-lg opacity-70">{t("description")}</p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="font-helvetica text-sm font-medium uppercase tracking-widest underline underline-offset-4 transition-opacity hover:opacity-70 focus-visible:opacity-70 focus-visible:outline-none"
        >
          {t("retry")}
        </button>
        <Link
          href={`/${locale}`}
          className="font-helvetica text-sm font-medium uppercase tracking-widest underline underline-offset-4 transition-opacity hover:opacity-70 focus-visible:opacity-70 focus-visible:outline-none"
        >
          {t("backHome")}
        </Link>
      </div>
    </main>
  );
}
