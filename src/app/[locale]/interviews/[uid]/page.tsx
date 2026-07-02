import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import * as prismic from "@prismicio/client";
import { PrismicRichText } from "@prismicio/react";
import { getTranslations } from "next-intl/server";
import { createClient, localeMap } from "@/prismicio";
import type { Content } from "@prismicio/client";
import { formatDate } from "@/utils/formatDate";
import { getAlternates, SITE_URL } from "@/lib/seo";
import YouTubeEmbed from "@/components/YouTubeEmbed";

type Params = { locale: string; uid: string };

export async function generateStaticParams() {
  const client = createClient();
  const documents = await client.getAllByType("interview", { lang: "*" });

  return documents.flatMap((doc) =>
    ["en", "nl"].map((locale) => ({ locale, uid: doc.uid })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, uid } = await params;
  const client = createClient();

  try {
    let page: Content.InterviewDocument;
    try {
      page = await client.getByUID<Content.InterviewDocument>(
        "interview",
        uid,
        {
          lang: localeMap[locale] ?? "nl-be",
        },
      );
    } catch {
      page = await client.getByUID<Content.InterviewDocument>(
        "interview",
        uid,
        {
          lang: "*",
        },
      );
    }

    const title = page.data.name ?? undefined;
    const description = prismic.asText(page.data.lead) ?? undefined;
    const images = page.data.image_url?.url
      ? [{ url: page.data.image_url.url }]
      : [];

    return {
      title,
      description,
      openGraph: { title, description, images },
      twitter: { card: "summary_large_image", title, description, images },
      alternates: getAlternates(locale, `interviews/${uid}`),
    };
  } catch {
    return {};
  }
}

export default async function InterviewPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, uid } = await params;
  const t = await getTranslations("nav");
  const client = createClient();

  let page: Content.InterviewDocument;
  try {
    page = await client.getByUID<Content.InterviewDocument>("interview", uid, {
      lang: localeMap[locale] ?? "nl-be",
    });
  } catch {
    try {
      page = await client.getByUID<Content.InterviewDocument>(
        "interview",
        uid,
        {
          lang: "*",
        },
      );
    } catch {
      notFound();
    }
  }

  const videoUrl =
    page.data.video_url.link_type === "Web"
      ? (page.data.video_url as prismic.FilledLinkToWebField).url
      : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_URL}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Work",
        item: `${SITE_URL}/${locale}/work`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: page.data.name,
      },
    ],
  };

  return (
    <main
      id="main-content"
      className="min-h-screen bg-black px-6 py-12 text-white md:px-16"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <Link
        href={`/${locale}/#work`}
        className="mb-10 inline-block font-sans text-sm uppercase tracking-widest opacity-60 transition-opacity hover:opacity-100"
      >
        ← {t("back")}
      </Link>

      <article className="mx-auto max-w-3xl">
        {videoUrl ? (
          <div className="relative mb-10 aspect-video w-full overflow-hidden rounded">
            <YouTubeEmbed url={videoUrl} title={page.data.name ?? undefined} />
          </div>
        ) : page.data.image_url?.url ? (
          <div className="relative mb-10 aspect-square w-full max-w-sm overflow-hidden rounded">
            <Image
              src={page.data.image_url.url}
              alt={page.data.image_url.alt ?? page.data.name ?? ""}
              fill
              sizes="(max-width: 768px) 100vw, 384px"
              className="object-cover"
            />
          </div>
        ) : null}

        <h1 className="mb-4 font-serif text-4xl font-bold md:text-6xl">
          {page.data.name}
        </h1>

        {page.data.publish_date && (
          <time
            dateTime={page.data.publish_date}
            className="mb-6 block font-sans text-sm uppercase tracking-widest opacity-60"
          >
            {formatDate(page.data.publish_date, locale)}
          </time>
        )}

        <div className="mb-8 font-serif text-xl leading-relaxed opacity-80">
          <PrismicRichText field={page.data.lead} />
        </div>

        <div className="prose prose-invert prose-lg max-w-none font-serif leading-relaxed">
          <PrismicRichText field={page.data.body} />
        </div>
      </article>
    </main>
  );
}
