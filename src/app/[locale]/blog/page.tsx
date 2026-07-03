import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import type { Content } from "@prismicio/client";
import { createClient, localeMap } from "@/prismicio";
import { getAlternates, SITE_URL } from "@/lib/seo";
import DetailNav from "@/components/DetailNav";
import BlogGrid from "@/components/BlogGrid";
import SocialLinks from "@/components/SocialLinks";

const PAGE_SIZE = 12;

type Params = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("blogTitle"),
    description: t("blogDescription"),
    alternates: getAlternates(locale, "blog"),
    openGraph: {
      title: t("blogTitle"),
      description: t("blogDescription"),
      images: [`${SITE_URL}/videos/hero-poster.webp`],
    },
    twitter: { card: "summary_large_image" },
  };
}

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
      id="main-content"
      className="min-h-screen text-red-light"
      style={{ backgroundColor: "var(--color-red-dark)" }}
    >
      <DetailNav backHref={`/${locale}`} activeItem="blog" hideBackLink />

      <BlogGrid
        initialPosts={response.results}
        locale={locale}
        totalPages={response.total_pages}
      />

      <SocialLinks
        className="flex justify-end gap-4 px-8 pb-6"
        iconClassName="h-5 w-5 text-red-light transition-opacity hover:opacity-70"
      />
    </main>
  );
}
