import type { MetadataRoute } from "next";
import { createClient } from "@/prismicio";
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
    client.getAllByType<Content.BlogPostDocument>("blog_post", { lang: "*" }),
    client.getAllByType<Content.InterviewDocument>("interview", { lang: "*" }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = staticPages.flatMap((page) =>
    ["en", "nl"].map((locale) => ({
      url: `${SITE_URL}/${locale}${page.path}`,
      lastModified: new Date(),
      changeFrequency: page.changeFrequency,
      priority: page.priority,
      alternates: {
        languages: {
          en: `${SITE_URL}/en${page.path}`,
          nl: `${SITE_URL}/nl${page.path}`,
        },
      },
    })),
  );

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => {
    const locale = post.lang === "nl-be" ? "nl" : "en";
    const otherLocale = locale === "en" ? "nl" : "en";
    return {
      url: `${SITE_URL}/${locale}/blog/${post.uid}`,
      lastModified: post.last_publication_date
        ? new Date(post.last_publication_date)
        : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: {
          [locale]: `${SITE_URL}/${locale}/blog/${post.uid}`,
          [otherLocale]: `${SITE_URL}/${otherLocale}/blog/${post.uid}`,
        },
      },
    };
  });

  const interviewEntries: MetadataRoute.Sitemap = interviews.map(
    (interview) => {
      const locale = interview.lang === "nl-be" ? "nl" : "en";
      const otherLocale = locale === "en" ? "nl" : "en";
      return {
        url: `${SITE_URL}/${locale}/work/${interview.uid}`,
        lastModified: interview.last_publication_date
          ? new Date(interview.last_publication_date)
          : new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
        alternates: {
          languages: {
            [locale]: `${SITE_URL}/${locale}/work/${interview.uid}`,
            [otherLocale]: `${SITE_URL}/${otherLocale}/work/${interview.uid}`,
          },
        },
      };
    },
  );

  return [...staticEntries, ...blogEntries, ...interviewEntries];
}
