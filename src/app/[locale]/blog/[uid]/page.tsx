import { Metadata } from "next";
import { notFound } from "next/navigation";
import * as prismic from "@prismicio/client";
import { PrismicRichText } from "@prismicio/react";
import { PrismicNextImage } from "@prismicio/next";
import { createClient, localeMap } from "@/prismicio";
import type { Content } from "@prismicio/client";
import { formatDate } from "@/utils/formatDate";
import { getAlternates, SITE_URL } from "@/lib/seo";
import DetailPage from "@/components/DetailPage";
import YouTubeEmbed from "@/components/YouTubeEmbed";

type Params = { locale: string; uid: string };

export async function generateStaticParams() {
  const client = createClient();
  const documents = await client.getAllByType("blog_post", { lang: "*" });

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
    const page = await client.getByUID<Content.BlogPostDocument>(
      "blog_post",
      uid,
      {
        lang: localeMap[locale] ?? "nl-be",
      },
    );

    const title = prismic.asText(page.data.title) ?? undefined;
    const description =
      prismic.asText(page.data.body)?.slice(0, 160) ?? undefined;
    const images = page.data.image?.url ? [{ url: page.data.image.url }] : [];

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images,
        type: "article",
        publishedTime: page.data.publish_date ?? undefined,
        authors: ["Kurt Vandemaele"],
      },
      twitter: { card: "summary_large_image", title, description, images },
      alternates: getAlternates(locale, `blog/${uid}`),
    };
  } catch {
    return {};
  }
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, uid } = await params;
  const client = createClient();

  let page: Content.BlogPostDocument;
  try {
    page = await client.getByUID<Content.BlogPostDocument>("blog_post", uid, {
      lang: localeMap[locale] ?? "nl-be",
    });
  } catch {
    notFound();
  }

  const videoUrl =
    page.data.video_url.link_type === "Web"
      ? (page.data.video_url as prismic.FilledLinkToWebField).url
      : null;

  const formattedDate = page.data.publish_date
    ? formatDate(page.data.publish_date, locale)
    : "";

  const title = prismic.asText(page.data.title);

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: prismic.asText(page.data.body)?.slice(0, 200) ?? undefined,
    image: page.data.image?.url ?? undefined,
    datePublished: page.data.publish_date ?? undefined,
    author: {
      "@type": "Person",
      name: "Kurt Vandemaele",
      url: `${SITE_URL}/${locale}/who-am-i`,
    },
    publisher: {
      "@type": "Organization",
      name: "udocu",
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}/${locale}/blog/${uid}`,
  };

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
        name: "Blog",
        item: `${SITE_URL}/${locale}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <DetailPage
        backHref={`/${locale}/blog`}
        colorScheme="bg-red-dark text-red-light"
        media={
          videoUrl ? (
            <YouTubeEmbed url={videoUrl} title={title ?? undefined} />
          ) : page.data.image?.url ? (
            <PrismicNextImage
              field={page.data.image}
              fill
              className="object-cover object-center"
              sizes="100vw"
              priority
            />
          ) : undefined
        }
        date={formattedDate}
        title={title}
      >
        <PrismicRichText field={page.data.body} />
      </DetailPage>
    </>
  );
}
