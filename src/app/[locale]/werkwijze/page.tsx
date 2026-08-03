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

  // The point count is derived from messages/nl.json rather than hardcoded,
  // so adding or removing a point`n` key there is reflected automatically.
  const messages = await getMessages({ locale });
  const werkwijzeMessages = messages.werkwijze as Record<string, unknown>;

  // Kurt marks the key phrase of each point in bold. The copy carries <b> tags
  // for those, so the points go through t.rich rather than plain t().
  //
  // Weight alone is not enough here: EB Garamond's heavier grades sit close to
  // its regular, so at body size on the dark teal the phrases barely lift off.
  // blue-lighter carries the rest, and raises their contrast (6.2:1 against
  // blue-dark, versus 5.5:1 for the body) rather than trading it away, which
  // dimming the surrounding text would have done.
  const points = pointIndices(werkwijzeMessages).map((n) =>
    t.rich(`point${n}`, {
      b: (chunks) => (
        <strong className="font-extrabold text-blue-lighter">{chunks}</strong>
      ),
    }),
  );

  return (
    <DetailPage
      backHref="/"
      activeItem="werkwijze"
      colorScheme="bg-blue-dark text-blue-light"
      overlayBgColor="var(--color-blue-dark)"
      overlayTextColor="var(--color-blue-light)"
      title={t("title")}
    >
      {/* This page runs one step up from DetailPage's shared body size, which
          is set for shorter pages. At this length the extra size keeps the
          14 points readable, and closes the gap to the lead. */}
      <div className="space-y-6 text-[18px] leading-[26px] md:text-[20px] md:leading-8">
        {/* Kurt set the whole intro in bold. At this size the bold is no longer
            needed to lift it off the page, and dropping it keeps extrabold +
            blue-lighter meaning one thing only: his key phrases in the points. */}
        <p className="text-[24px] leading-8 text-blue-lighter md:text-[28px] md:leading-[38px]">
          {t("lead")}
        </p>

        <p>{t("questions")}</p>

        <NumberedPoints points={points} />
      </div>
    </DetailPage>
  );
}
