import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import * as prismic from "@prismicio/client";
import { PrismicNextImage } from "@prismicio/next";
import { createClient, localeMap } from "@/prismicio";
import type { Content } from "@prismicio/client";
import UdocuLogo from "@/components/UdocuLogo";
import {
  FacebookIcon,
  InstagramIcon,
  YouTubeIcon,
} from "@/components/SocialIcons";

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(
    locale === "nl" ? "nl-NL" : "en-US",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  );
}

function PostCard({
  post,
  locale,
  featured = false,
}: {
  post: Content.BlogPostDocument;
  locale: string;
  featured?: boolean;
}) {
  return (
    <Link
      href={`/${locale}/blog/${post.uid}`}
      className="group mb-8 block break-inside-avoid"
    >
      {post.data.image?.url && (
        <div className="overflow-hidden">
          <PrismicNextImage
            field={post.data.image}
            // alt={post.data.title}
            className="w-full object-cover transition-opacity duration-300 group-hover:opacity-90"
          />
        </div>
      )}
      <div
        className="pt-2 pb-2"
        style={
          featured ? { backgroundColor: "var(--color-red-light)" } : undefined
        }
      >
        <div className={featured ? "px-5 py-4 md:px-6" : ""}>
          {post.data.publish_date && (
            <p
              className="mb-1 font-helvetica text-xs font-light"
              style={{ color: featured ? "var(--color-red-dark)" : "white" }}
            >
              {formatDate(post.data.publish_date, locale)}
            </p>
          )}
          <h3
            className="font-bold"
            style={
              featured
                ? {
                    fontFamily: "var(--font-garamond)",
                    fontSize: "38px",
                    lineHeight: "43px",
                    letterSpacing: "0%",
                    color: "var(--color-red-dark)",
                  }
                : {
                    fontFamily: "var(--font-garamond)",
                    fontSize: "38px",
                    lineHeight: "43px",
                    letterSpacing: "0%",
                    color: "white",
                  }
            }
          >
            {prismic.asText(post.data.title)}
          </h3>
        </div>
      </div>
    </Link>
  );
}

export default async function BlogPage() {
  const t = await getTranslations("nav");
  const locale = await getLocale();
  const client = createClient();

  const posts = await client.getAllByType<Content.BlogPostDocument>(
    "blog_post",
    {
      lang: localeMap[locale] ?? "nl-be",
      orderings: [{ field: "my.blog_post.publish_date", direction: "desc" }],
    },
  );

  const [featured, ...rest] = [...posts, ...posts, ...posts];

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

      {/* Masonry: 2 cols on mobile, 4 cols on desktop */}
      <div className="columns-2 gap-8 px-2 pb-16 md:columns-4 md:px-4">
        {posts.length === 0 && (
          <p className="p-8 text-white/60">No posts yet.</p>
        )}

        {featured && (
          <PostCard post={featured} locale={locale} featured={true} />
        )}

        {rest.map((post) => (
          <PostCard key={post.id} post={post} locale={locale} />
        ))}
      </div>

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
