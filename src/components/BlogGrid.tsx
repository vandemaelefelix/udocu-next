"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import * as prismic from "@prismicio/client";
import { PrismicNextImage } from "@prismicio/next";
import { motion, useInView } from "motion/react";
import { useTranslations } from "next-intl";
import { usePostHog } from "posthog-js/react";
import type { Content } from "@prismicio/client";
import { formatDate } from "@/utils/formatDate";

function PostCard({
  post,
  locale,
  featured = false,
  priority = false,
  staggerDelay,
  onCardClick,
}: {
  post: Content.BlogPostDocument;
  locale: string;
  featured?: boolean;
  priority?: boolean;
  staggerDelay: number;
  onCardClick: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-50px 0px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
      transition={{
        duration: 0.4,
        ease: [0.25, 0.1, 0.25, 1],
        delay: staggerDelay,
      }}
      className="break-inside-avoid"
    >
      <Link
        href={`/${locale}/blog/${post.uid}`}
        className="group mb-8 block"
        onClick={onCardClick}
      >
        {post.data.image?.url && (
          <div className="overflow-hidden">
            <PrismicNextImage
              field={{
                ...post.data.image,
                // Fall back to the post title when no alt is set in Prismic so
                // the cover image is never announced without a description.
                alt:
                  post.data.image.alt ||
                  prismic.asText(post.data.title) ||
                  null,
              }}
              className="w-full object-cover transition-opacity duration-300 group-hover:opacity-90"
              // Eager-load the first row (above the fold) — the LCP lives here.
              priority={priority}
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
                style={{
                  color: featured
                    ? "var(--color-red-dark)"
                    : "var(--color-red-light)",
                }}
              >
                {formatDate(post.data.publish_date, locale)}
              </p>
            )}
            <h3
              className="text-[26px] leading-[30px] font-bold md:text-[38px] md:leading-[43px]"
              style={{
                fontFamily: "var(--font-garamond)",
                letterSpacing: "0%",
                color: featured
                  ? "var(--color-red-dark)"
                  : "var(--color-red-light)",
              }}
            >
              {prismic.asText(post.data.title)}
            </h3>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

interface BlogGridProps {
  initialPosts: Content.BlogPostDocument[];
  locale: string;
  totalPages: number;
}

interface PostWithBatchIndex {
  post: Content.BlogPostDocument;
  /** Index within its batch, used to calculate stagger delay */
  batchIndex: number;
}

export default function BlogGrid({
  initialPosts,
  locale,
  totalPages,
}: BlogGridProps) {
  const t = useTranslations("blog");
  const posthog = usePostHog();
  const [items, setItems] = useState<PostWithBatchIndex[]>(
    initialPosts.map((post, i) => ({ post, batchIndex: i })),
  );
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(totalPages > 1);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    const nextPage = page + 1;
    posthog.capture("blog_load_more", { page: nextPage });

    try {
      const res = await fetch(
        `/api/blog?page=${nextPage}&locale=${encodeURIComponent(locale)}`,
      );
      const data = await res.json();

      const newItems: PostWithBatchIndex[] = data.results.map(
        (post: Content.BlogPostDocument, i: number) => ({
          post,
          batchIndex: i,
        }),
      );

      setItems((prev) => [...prev, ...newItems]);
      setPage(nextPage);
      setHasMore(nextPage < data.totalPages);
    } catch (error) {
      console.error("Failed to load more posts:", error);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, page, locale, posthog]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore]);

  return (
    <>
      <div className="columns-1 gap-8 px-6 pb-16 md:columns-4 md:px-4">
        {items.length === 0 && (
          <p className="p-8 text-red-light/60">{t("noPosts")}</p>
        )}

        {items.map(({ post, batchIndex }, i) => (
          <PostCard
            key={`${post.id}-${i}`}
            post={post}
            locale={locale}
            featured={i === 0}
            // Eager-load the cards likely above the fold. In a 4-column masonry
            // the LCP image's DOM index varies with content, so cover the top
            // area with margin (trade-off: a few extra eager images on mobile).
            priority={i < 6}
            staggerDelay={batchIndex * 0.07}
            onCardClick={() =>
              posthog.capture("blog_post_clicked", {
                uid: post.uid,
                title: prismic.asText(post.data.title),
                featured: i === 0,
              })
            }
          />
        ))}
      </div>

      <div aria-live="polite" aria-atomic="true">
        {hasMore && (
          <div ref={sentinelRef} className="flex justify-center py-8">
            {loading && (
              <div
                className="h-6 w-6 animate-spin rounded-full border-2 border-red-light/30 border-t-red-light"
                role="status"
                aria-label={t("loadingMore")}
              />
            )}
          </div>
        )}
      </div>
    </>
  );
}
