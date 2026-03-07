import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import type { Content } from "@prismicio/client";
import { createClient, localeMap } from "@/prismicio";
import UdocuLogo from "@/components/UdocuLogo";
import BlogGrid from "@/components/BlogGrid";
import {
  FacebookIcon,
  InstagramIcon,
  YouTubeIcon,
} from "@/components/SocialIcons";

const PAGE_SIZE = 12;

export default async function BlogPage() {
  const t = await getTranslations("nav");
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

  const NAV_ITEMS = ["about", "who-am-i", "work", "contact", "blog"] as const;

  return (
    <main
      className="min-h-screen"
      style={{ backgroundColor: "var(--color-red-dark)", color: "white" }}
    >
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-6 md:px-8">
        <Link href={`/${locale}`}>
          <UdocuLogo
            color="white"
            className="h-6 w-auto max-w-24 md:h-10 md:max-w-48"
          />
        </Link>
        <ul className="hidden gap-8 font-helvetica text-xs font-medium uppercase tracking-widest md:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item}>
              <Link
                href={
                  item === "blog" ? `/${locale}/blog` : `/${locale}#${item}`
                }
                className={`transition-opacity hover:opacity-70 ${item === "blog" ? "underline underline-offset-4" : ""}`}
              >
                {t(item)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Blog grid with stagger animation + infinite scroll */}
      <BlogGrid
        initialPosts={response.results}
        locale={locale}
        totalPages={response.total_pages}
      />

      {/* Footer social icons */}
      <div className="flex justify-end gap-4 px-8 pb-6">
        <a
          href="https://facebook.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
        >
          <FacebookIcon className="h-5 w-5 text-white transition-opacity hover:opacity-70" />
        </a>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
        >
          <InstagramIcon className="h-5 w-5 text-white transition-opacity hover:opacity-70" />
        </a>
        <a
          href="https://youtube.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="YouTube"
        >
          <YouTubeIcon className="h-5 w-5 text-white transition-opacity hover:opacity-70" />
        </a>
      </div>
    </main>
  );
}
