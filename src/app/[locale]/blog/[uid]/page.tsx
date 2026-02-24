import { Metadata } from "next";
import { notFound } from "next/navigation";
import * as prismic from "@prismicio/client";
import { PrismicRichText } from "@prismicio/react";
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
        lang: localeMap[locale] ?? "en-us",
      },
    );

    return {
      title: prismic.asText(page.data.title),
      description: prismic.asText(page.data.lead),
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
      lang: localeMap[locale] ?? "en-us",
    });
  } catch {
    notFound();
  }

  const mediaUrl =
    page.data.media_url.link_type === "Web"
      ? (page.data.media_url as prismic.FilledLinkToWebField).url
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

        <div>
          <PrismicRichText field={page.data.lead} />
        </div>

        <div>
          <PrismicRichText field={page.data.body} />
        </div>

        {mediaUrl && (
          <div>
            {mediaUrl.match(/\.(mp4|webm|ogg)$/) ? (
              <video src={mediaUrl} controls />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={mediaUrl} alt="" />
            )}
          </div>
        )}
      </article>
    </main>
  );
}
