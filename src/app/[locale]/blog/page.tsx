import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import * as prismic from "@prismicio/client";
import { createClient, localeMap } from "@/prismicio";
import type { Content } from "@prismicio/client";

export default async function BlogPage() {
  const t = await getTranslations("blog");
  const locale = await getLocale();
  const client = createClient();

  const posts = await client.getAllByType<Content.BlogPostDocument>(
    "blog_post",
    {
      lang: localeMap[locale] ?? "en-us",
      orderings: [{ field: "my.blog_post.publish_date", direction: "desc" }],
    },
  );

  return (
    <main>
      <h1>{t("title")}</h1>

      {posts.length === 0 && <p>No posts yet.</p>}

      <ul>
        {posts.map((post) => (
          <li key={post.id}>
            <Link href={`/${locale}/blog/${post.uid}`}>
              <h2>{prismic.asText(post.data.title)}</h2>
            </Link>
            {post.data.publish_date && (
              <time dateTime={post.data.publish_date}>
                {new Date(post.data.publish_date).toLocaleDateString(locale, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </time>
            )}
            <p>{prismic.asText(post.data.lead)}</p>
          </li>
        ))}
      </ul>
    </main>
  );
}
