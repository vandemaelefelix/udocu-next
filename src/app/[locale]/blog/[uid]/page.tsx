import { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import * as prismic from "@prismicio/client";
import { PrismicRichText } from "@prismicio/react";
import { PrismicNextImage } from "@prismicio/next";
import { createClient, localeMap } from "@/prismicio";
import type { Content } from "@prismicio/client";
import { formatDate } from "@/utils/formatDate";
import DetailPage from "@/components/DetailPage";

type Params = { locale: string; uid: string };

export async function generateStaticParams() {
  const client = createClient();
  const documents = await client.getAllByType("blog_post");

  return documents.map((doc) => ({
    uid: doc.uid,
  }));
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
    const images = page.data.image?.url ? [{ url: page.data.image.url }] : [];

    return {
      title,
      openGraph: { title, images },
      twitter: { card: "summary_large_image", title, images },
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

  return (
    <DetailPage
      backHref={`/${locale}/blog`}
      colorScheme="bg-red-dark text-red-light"
      media={
        page.data.image?.url ? (
          <PrismicNextImage
            field={page.data.image}
            alt=""
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority
          />
        ) : undefined
      }
      date={formattedDate}
      title={prismic.asText(page.data.title)}
    >
      <PrismicRichText field={page.data.body} />

      {videoUrl && (
        <div className="relative mt-8 aspect-video w-full overflow-hidden">
          {videoUrl.match(/\.(mp4|webm|ogg)$/) ? (
            <video src={videoUrl} controls className="h-full w-full" />
          ) : (
            <Image
              src={videoUrl}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 800px"
            />
          )}
        </div>
      )}
    </DetailPage>
  );
}
