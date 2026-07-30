import Image, { type StaticImageData } from "next/image";
import { getTranslations } from "next-intl/server";
import DetailNav from "@/components/DetailNav";
import DetailBackLink from "@/components/DetailBackLink";
import type { ReactNode } from "react";

interface DetailPageProps {
  backHref: string;
  colorScheme: string;
  image?: StaticImageData;
  imageAlt?: string;
  imageClassName?: string;
  /** Optional photographer/copyright credit shown in the cover image's bottom corner */
  imageCredit?: string;
  /** Optional custom media element (e.g. a video) that replaces the cover image */
  media?: ReactNode;
  date?: string;
  title: ReactNode;
  children: ReactNode;
  /** Mobile overlay background, forwarded to DetailNav. Defaults to red-dark. */
  overlayBgColor?: string;
  /** Mobile overlay text colour, forwarded to DetailNav. Defaults to red-light. */
  overlayTextColor?: string;
}

export default async function DetailPage({
  backHref,
  colorScheme,
  image,
  imageAlt = "",
  imageClassName = "object-cover object-center",
  imageCredit,
  media,
  date,
  title,
  children,
  overlayBgColor,
  overlayTextColor,
}: DetailPageProps) {
  const t = await getTranslations("nav");

  return (
    <main id="main-content" className={`min-h-screen ${colorScheme} pb-48`}>
      <DetailNav
        overlayBgColor={overlayBgColor}
        overlayTextColor={overlayTextColor}
      />

      {/* Back link: in-flow so it scrolls with the page instead of sitting
          in the sticky header (which only holds the logo/menu row). */}
      <div className="mx-auto max-w-5xl px-8 pt-6 pb-8 md:pt-8">
        <DetailBackLink
          href={backHref}
          className="font-helvetica text-[16px] font-medium uppercase leading-5 tracking-widest transition-opacity hover:opacity-70 focus-visible:opacity-70 focus-visible:outline-none"
        >
          {t("back")}
        </DetailBackLink>
      </div>

      {/* Cover media (optional: pages without a cover skip the block entirely) */}
      {(media || image) && (
        <div className="mx-auto max-w-5xl px-8">
          <div className="relative aspect-video w-full overflow-hidden">
            {media ??
              (image && (
                <Image
                  src={image}
                  alt={imageAlt}
                  fill
                  className={imageClassName}
                  sizes="100vw"
                  priority
                />
              ))}
            {imageCredit && (
              <span className="pointer-events-none absolute bottom-2 right-2 z-10 font-helvetica text-xs tracking-wide text-white/80 md:bottom-3 md:right-3">
                {imageCredit}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Date, title & body */}
      <article className="mx-auto max-w-5xl px-8 pt-8 pb-16 md:pt-12 md:pb-24">
        {date && (
          <p className="mb-6 font-helvetica text-xs uppercase tracking-widest opacity-60">
            {date}
          </p>
        )}

        <h1 className="mb-8 font-serif text-[40px] font-semibold leading-[1] tracking-normal md:text-[72px] md:leading-[72px]">
          {title}
        </h1>

        <div className="space-y-6 font-serif text-[16px] font-normal leading-6 md:text-[18px] md:leading-7">
          {children}
        </div>
      </article>
    </main>
  );
}
