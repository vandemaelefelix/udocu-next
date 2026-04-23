import { getLocale } from "next-intl/server";
import type { Content } from "@prismicio/client";
import { createClient, localeMap } from "@/prismicio";
import DetailNav from "@/components/DetailNav";
import BlogGrid from "@/components/BlogGrid";
import SocialLinks from "@/components/SocialLinks";

const PAGE_SIZE = 12;

export default async function BlogPage() {
  const locale = await getLocale();
  const client = createClient();

  const response = await client.getByType<Content.BlogPostDocument>(
    "blog_post",
    {
      lang: localeMap[locale] ?? "nl-be",
      orderings: [{ field: "my.blog_post.publish_date", direction: "desc" }],
      pageSize: PAGE_SIZE,
      page: 1,
    },
  );

  return (
    <main
      className="min-h-screen text-red-light"
      style={{ backgroundColor: "var(--color-red-dark)" }}
    >
      {/* Nav */}
      <DetailNav backHref={`/${locale}`} activeItem="blog" hideBackLink />

      {/* Blog grid with stagger animation + infinite scroll */}
      <BlogGrid
        initialPosts={response.results}
        locale={locale}
        totalPages={response.total_pages}
      />

      {/* Footer social icons */}
      <SocialLinks
        className="flex justify-end gap-4 px-8 pb-6"
        iconClassName="h-5 w-5 text-red-light transition-opacity hover:opacity-70"
      />
    </main>
  );
}
