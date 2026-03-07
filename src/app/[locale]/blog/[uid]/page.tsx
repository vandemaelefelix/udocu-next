import { Metadata } from "next";
import { notFound } from "next/navigation";
import * as prismic from "@prismicio/client";
import { PrismicRichText } from "@prismicio/react";
import { PrismicNextImage } from "@prismicio/next";
import { createClient, localeMap } from "@/prismicio";
import type { Content } from "@prismicio/client";

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

    return {
      title: prismic.asText(page.data.title),
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

  return (
    <main>
      <article>
        <PrismicRichText field={page.data.title} />

        {page.data.publish_date && (
          <time dateTime={page.data.publish_date}>
            {new Date(page.data.publish_date).toLocaleDateString(locale, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        )}

        {page.data.image?.url && (
          <PrismicNextImage field={page.data.image} alt="" />
        )}

        <div>
          <PrismicRichText field={page.data.body} />
        </div>

        {videoUrl && (
          <div>
            {videoUrl.match(/\.(mp4|webm|ogg)$/) ? (
              <video src={videoUrl} controls />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={videoUrl} alt="" />
            )}
          </div>
        )}
      </article>
    </main>
  );
}
