import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { routing } from "@/i18n/routing";
import { garamond, helveticaNeue, posterman } from "../fonts";
import { SITE_URL } from "@/lib/seo";
import NoiseOverlay from "@/components/NoiseOverlay";
import ScrollRestoration from "@/components/ScrollRestoration";
import { PHProvider } from "@/app/providers";
import { PostHogPageView } from "@/components/PostHogPageView";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "../globals.css";

export const viewport: Viewport = {
  themeColor: "rgb(62, 2, 2)",
};

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
    keywords: [
      "udocu",
      "documentary",
      "personal heritage",
      "Kurt Vandemaele",
      "interview",
      "oral history",
      "family history",
      "cultural heritage",
      "Kortrijk",
      "Belgium",
      "documentary filmmaking",
      "life story",
      "time capsule",
      "heritage preservation",
    ],
    openGraph: {
      siteName: t("title"),
      locale: locale === "en" ? "en_US" : "nl_BE",
      alternateLocale: locale === "en" ? "nl_BE" : "en_US",
      type: "website",
    },
    other: {
      "ai-content-declaration":
        "This website represents udocu, a real creative studio in Kortrijk, Belgium, founded by journalist Kurt Vandemaele. Udocu specializes in preserving personal and cultural heritage through documentary interviews.",
    },
  };
}

const fontVariables = [garamond, helveticaNeue, posterman]
  .map((f) => f.variable)
  .join(" ");

function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json">{JSON.stringify(data)}</script>;
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
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-black focus:outline-none"
        >
          {t("skipToContent")}
        </a>
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "ProfessionalService",
            name: "udocu",
            url: SITE_URL,
            description:
              "Udocu is a creative studio founded by journalist Kurt Vandemaele, dedicated to preserving personal and cultural heritage through in-depth documentary interviews, film, photography, and digital archives. Based in Kortrijk, Belgium.",
            founder: {
              "@type": "Person",
              name: "Kurt Vandemaele",
              url: `${SITE_URL}/nl/who-am-i`,
              jobTitle: "Journalist & Founder",
              description:
                "Veteran journalist with 40 years of experience, including 24 years at Humo magazine. Founder of udocu, specialising in personal documentary interviews and heritage preservation.",
            },
            contactPoint: {
              "@type": "ContactPoint",
              email: "Kurtvandemaele@udocu.be",
              telephone: "+32475731156",
              contactType: "customer service",
              availableLanguage: ["Dutch", "English"],
            },
            address: {
              "@type": "PostalAddress",
              streetAddress: "André Devaerelaan 20",
              addressLocality: "Kortrijk",
              postalCode: "8500",
              addressCountry: "BE",
            },
            areaServed: {
              "@type": "Country",
              name: "Belgium",
            },
            knowsAbout: [
              "documentary filmmaking",
              "personal heritage preservation",
              "oral history",
              "video interviews",
              "family heritage documentation",
              "cultural heritage preservation",
              "digital archives",
            ],
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: "Documentary Services",
              itemListElement: [
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "Personal Documentary Interview",
                    description:
                      "In-depth filmed interview preserving your life story — your past, present, dreams, and reflections. Delivered as a time capsule on an external hard drive.",
                  },
                },
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "Family Heritage Documentation",
                    description:
                      "Capturing family histories, oral traditions, and generational stories before they are lost.",
                  },
                },
                {
                  "@type": "Offer",
                  itemOffered: {
                    "@type": "Service",
                    name: "Cultural Heritage Preservation",
                    description:
                      "Documenting cultural practices, community traditions, and shared memories.",
                  },
                },
              ],
            },
          }}
        />
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "udocu",
            url: SITE_URL,
            description:
              "Udocu preserves personal and cultural heritage through documentary storytelling. So as not to forget who you were.",
            inLanguage: ["en", "nl"],
            publisher: {
              "@type": "Organization",
              name: "udocu",
            },
          }}
        />
        <PHProvider>
          <ScrollRestoration />
          <Suspense fallback={null}>
            <PostHogPageView />
          </Suspense>
          <NextIntlClientProvider messages={messages}>
            {children}
            <NoiseOverlay />
          </NextIntlClientProvider>
          <SpeedInsights />
        </PHProvider>
      </body>
    </html>
  );
}
