import Image, { type StaticImageData } from "next/image";
import DetailNav from "@/components/DetailNav";
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
  date: string;
  title: ReactNode;
  children: ReactNode;
}

export default function DetailPage({
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
}: DetailPageProps) {
  return (
    <main id="main-content" className={`min-h-screen ${colorScheme} pb-48`}>
      <DetailNav backHref={backHref} />

      {/* Cover media */}
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

      {/* Date, title & body */}
      <article className="mx-auto max-w-5xl px-8 pt-8 pb-16 md:pt-12 md:pb-24">
        <p className="mb-6 font-helvetica text-xs uppercase tracking-widest opacity-60">
          {date}
        </p>

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
