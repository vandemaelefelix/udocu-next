import Image, { type StaticImageData } from "next/image";
import DetailNav from "@/components/DetailNav";
import type { ReactNode } from "react";

interface DetailPageProps {
  backHref: string;
  colorScheme: string;
  image?: StaticImageData;
  imageAlt?: string;
  imageClassName?: string;
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
  media,
  date,
  title,
  children,
}: DetailPageProps) {
  return (
    <main className={`min-h-screen ${colorScheme}`}>
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
        </div>
      </div>

      {/* Date, title & body */}
      <article className="mx-auto max-w-5xl px-8 py-8 md:py-12">
        <p className="mb-6 font-helvetica text-xs uppercase tracking-widest opacity-60">
          {date}
        </p>

        <h1 className="mb-8 text-[40px] leading-12 md:text-[74px] md:leading-[88px]">
          {title}
        </h1>

        <div className="space-y-6 font-serif text-[16px] font-normal leading-6 md:text-[18px] md:leading-7">
          {children}
        </div>
      </article>
    </main>
  );
}
