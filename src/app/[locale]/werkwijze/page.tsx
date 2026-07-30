import type { Metadata } from "next";
import {
  getMessages,
  getTranslations,
  setRequestLocale,
} from "next-intl/server";
import { getAlternates } from "@/lib/seo";
import DetailPage from "@/components/DetailPage";
import NumberedPoints from "@/components/NumberedPoints";

const POINT_KEY_PATTERN = /^point(\d+)$/;

/** Numeric point indices (1, 2, 3, ...) present in the werkwijze namespace, sorted ascending. */
function pointIndices(werkwijzeMessages: Record<string, unknown>): number[] {
  return Object.keys(werkwijzeMessages)
    .map((key) => key.match(POINT_KEY_PATTERN))
    .filter((match): match is RegExpMatchArray => match !== null)
    .map((match) => Number(match[1]))
    .sort((a, b) => a - b);
}

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
  // The point count is derived from messages/nl.json rather than hardcoded,
  // so adding or removing a point`n` key there is reflected automatically.
  const messages = await getMessages({ locale });
  const werkwijzeMessages = messages.werkwijze as Record<string, unknown>;
  const points = pointIndices(werkwijzeMessages).map((n) => t(`point${n}`));

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
