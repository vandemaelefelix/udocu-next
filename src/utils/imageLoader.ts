import type { ImageLoaderProps } from "next/image";

/**
 * A `next/image` loader for images hosted on Prismic (`images.prismic.io`).
 *
 * Prismic serves images through imgix, a full image CDN that already resizes
 * and reformats on the fly via URL parameters. Routing those images through
 * Vercel's Image Optimization on top is redundant and consumes the account's
 * Image Cache Writes quota. Passing this loader to a `next/image` component
 * makes Next.js request the resized variant straight from imgix, so Vercel
 * never optimizes (or caches) it — matching how `PrismicNextImage` already
 * behaves by default.
 *
 * The width/quality Next.js asks for are applied as imgix params, and
 * `auto=format,compress` lets imgix pick the best format (AVIF/WebP) per
 * browser. `fit=max` prevents upscaling beyond the source dimensions. Any crop
 * (`rect`) already present on the Prismic URL is preserved.
 */
export function prismicImageLoader({
  src,
  width,
  quality,
}: ImageLoaderProps): string {
  const url = new URL(src);
  url.searchParams.set("auto", "format,compress");
  url.searchParams.set("fit", "max");
  url.searchParams.set("w", width.toString());
  // Let the width drive the output size so the aspect ratio is preserved.
  url.searchParams.delete("h");
  url.searchParams.set("q", (quality ?? 75).toString());
  return url.toString();
}
