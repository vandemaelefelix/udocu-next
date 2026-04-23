import type { Metadata } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { garamond, helveticaNeue, posterman } from "../fonts";
import { SITE_URL } from "@/lib/seo";
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
    title: {
      default: t("title"),
      template: `%s — ${t("title")}`,
    },
    description: t("description"),
    metadataBase: new URL(SITE_URL),
    openGraph: {
      siteName: t("title"),
      locale: locale === "en" ? "en_US" : "nl_BE",
      alternateLocale: locale === "en" ? "nl_BE" : "en_US",
      type: "website",
    },
  };
}

const fontVariables = [garamond, helveticaNeue, posterman]
  .map((f) => f.variable)
  .join(" ");

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

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
  const t = await getTranslations({ locale, namespace: "a11y" });

  return (
    <html lang={locale}>
      <body className={`${fontVariables} antialiased`}>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-black focus:outline-none"
        >
          {t("skipToContent")}
        </a>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "Organization",
            name: "udocu",
            url: SITE_URL,
            founder: {
              "@type": "Person",
              name: "Kurt Vandemaele",
            },
            contactPoint: {
              "@type": "ContactPoint",
              email: "Kurtvandemaele@udocu.be",
              telephone: "+32475731156",
              contactType: "customer service",
            },
          }}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "udocu",
            url: SITE_URL,
            inLanguage: ["en", "nl"],
          }}
        />
        <NextIntlClientProvider messages={messages}>
          {children}
          <NoiseOverlay />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
