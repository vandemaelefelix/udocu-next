import type { MetadataRoute } from "next";
import { createClient, PRISMIC_LOCALE } from "@/prismicio";
import type { Content } from "@prismicio/client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.udocu.be";

const staticPages = [
  { path: "", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/who-am-i", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/work", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" as const },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const client = createClient();

  const [blogPosts, interviews] = await Promise.all([
    client.getAllByType<Content.BlogPostDocument>("blog_post", {
      lang: PRISMIC_LOCALE,
    }),
    client.getAllByType<Content.InterviewDocument>("interview", {
      lang: PRISMIC_LOCALE,
    }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.uid}`,
    lastModified: post.last_publication_date
      ? new Date(post.last_publication_date)
      : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const interviewEntries: MetadataRoute.Sitemap = interviews.map(
    (interview) => ({
      url: `${SITE_URL}/work/${interview.uid}`,
      lastModified: interview.last_publication_date
        ? new Date(interview.last_publication_date)
        : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }),
  );

  return [...staticEntries, ...blogEntries, ...interviewEntries];
}
