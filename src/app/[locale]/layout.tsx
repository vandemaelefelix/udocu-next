import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { garamond, helveticaNeue, posterman } from "../fonts";
import NoiseOverlay from "@/components/NoiseOverlay";
import "../globals.css";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

const fontVariables = [garamond, helveticaNeue, posterman]
  .map((f) => f.variable)
  .join(" ");

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "nl")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale}>
      <body className={`${fontVariables} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          {children}
          <NoiseOverlay />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
