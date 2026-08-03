import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import type { Content } from "@prismicio/client";
import { createClient, PRISMIC_LOCALE } from "@/prismicio";
import { getAlternates, SITE_URL } from "@/lib/seo";
import DetailNav from "@/components/DetailNav";
import SyncPageBackground from "@/components/SyncPageBackground";
import BlogGrid from "@/components/BlogGrid";
import SocialDock from "@/components/SocialDock";

const PAGE_SIZE = 12;

type Params = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("blogTitle"),
    description: t("blogDescription"),
    alternates: getAlternates("blog"),
    openGraph: {
      title: t("blogTitle"),
      description: t("blogDescription"),
      images: [`${SITE_URL}/videos/hero-poster.webp`],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function BlogPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const client = createClient();

  const response = await client.getByType<Content.BlogPostDocument>(
    "blog_post",
    {
      lang: PRISMIC_LOCALE,
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
      {/* Keeps the overscroll rubber band the same colour as the page. */}
      <SyncPageBackground targetId="main-content" />

      <DetailNav activeItem="blog" />

      <BlogGrid
        initialPosts={response.results}
        locale={locale}
        totalPages={response.total_pages}
      />

      <SocialDock />
    </main>
  );
}
