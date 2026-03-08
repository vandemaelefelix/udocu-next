import { Metadata } from "next";
import { notFound } from "next/navigation";
import * as prismic from "@prismicio/client";
import { PrismicRichText } from "@prismicio/react";
import { createClient, localeMap } from "@/prismicio";
import type { Content } from "@prismicio/client";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import DetailNav from "@/components/DetailNav";
import CloudinaryVideo from "@/components/CloudinaryVideo";
import VideoPlayer from "@/components/VideoPlayer";
import {
  FacebookIcon,
  InstagramIcon,
  YouTubeIcon,
} from "@/components/SocialIcons";

type Params = { locale: string; uid: string };

/**
 * Theme color pairs — one is chosen per work item based on a hash of the UID
 * so the colour is deterministic but feels random.
 */
const COLOR_PAIRS = [
  { bg: "bg-contact-bg", text: "text-orange-light" },
  { bg: "bg-green-dark", text: "text-green-light" },
  { bg: "bg-red-dark", text: "text-red-light" },
  { bg: "bg-blue-dark", text: "text-blue-light" },
] as const;

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

function getColorPair(uid: string) {
  return COLOR_PAIRS[hashString(uid) % COLOR_PAIRS.length];
}

// ─── Static params ──────────────────────────────────────────────────
export async function generateStaticParams() {
  const client = createClient();
  const documents = await client.getAllByType("interview");
  return documents.map((doc) => ({ uid: doc.uid }));
}

// ─── Metadata ───────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale, uid } = await params;
  const client = createClient();

  try {
    let page: Content.InterviewDocument;
    try {
      page = await client.getByUID<Content.InterviewDocument>(
        "interview",
        uid,
        { lang: localeMap[locale] ?? "nl-be" },
      );
    } catch {
      page = await client.getByUID<Content.InterviewDocument>(
        "interview",
        uid,
        { lang: "*" },
      );
    }

    return {
      title: page.data.name ?? undefined,
      description: prismic.asText(page.data.lead),
    };
  } catch {
    return {};
  }
}

// ─── Page ───────────────────────────────────────────────────────────
export default async function WorkDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale, uid } = await params;
  const client = createClient();

  let page: Content.InterviewDocument;
  try {
    page = await client.getByUID<Content.InterviewDocument>("interview", uid, {
      lang: localeMap[locale] ?? "nl-be",
    });
  } catch {
    try {
      page = await client.getByUID<Content.InterviewDocument>(
        "interview",
        uid,
        { lang: "*" },
      );
    } catch {
      notFound();
    }
  }

  const colors = getColorPair(uid);
  const t = await getTranslations("nav");

  const formattedDate = page.data.publish_date
    ? new Date(page.data.publish_date).toLocaleDateString(locale, {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <main
      className={`relative flex min-h-screen flex-col md:h-screen md:overflow-hidden ${colors.bg} ${colors.text}`}
    >
      {/* ── Nav ── */}
      <div className="shrink-0">
        <DetailNav
          backHref={`/${locale}/#work`}
          activeItem="work"
          mobileBackOnly
        />
      </div>

      {/* ── Content: two-column layout, vertically centered on desktop ── */}
      <div className="flex flex-1 flex-col px-8 pb-8 md:flex-row md:items-center md:gap-12 md:pb-16 lg:gap-16">
        {/* Left column — name, description, date, back */}
        <div className="flex flex-col md:w-[38%] md:shrink-0">
          {/* Name */}
          <h1 className="mb-6 font-posterman text-[48px] font-black uppercase leading-[1.1] md:mb-8 md:text-[72px]">
            {page.data.name}
          </h1>

          {/* Video on mobile only — shown between name and text */}
          <div className="mb-6 md:hidden">
            <div className="relative aspect-video w-full overflow-hidden">
              <VideoPlayer className="h-full w-full">
                <CloudinaryVideo className="h-full w-full object-cover" />
              </VideoPlayer>
            </div>
          </div>

          {/* Lead */}
          <div className="mb-4 font-serif text-[20px] font-semibold leading-7 md:text-[24px] md:leading-8">
            <PrismicRichText field={page.data.lead} />
          </div>

          {/* Date */}
          {formattedDate && (
            <time
              dateTime={page.data.publish_date!}
              className="mb-6 block font-helvetica text-xs uppercase tracking-widest opacity-60"
            >
              {formattedDate}
            </time>
          )}

          {/* Body */}
          <div className="mb-8 space-y-4 font-helvetica text-[14px] font-light leading-5 opacity-80 md:text-[15px] md:leading-6">
            <PrismicRichText field={page.data.body} />
          </div>

          {/* Back link — desktop only, below text */}
          <div className="hidden md:block">
            <Link
              href={`/${locale}/#work`}
              className="group inline-flex items-center gap-2 font-helvetica text-[16px] font-medium uppercase leading-5 tracking-widest transition-opacity hover:opacity-70"
            >
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-200 group-hover:-translate-x-1"
              >
                &larr;
              </span>
              {t("back")}
            </Link>
          </div>
        </div>

        {/* Right column — video (desktop only) */}
        <div className="hidden flex-1 md:block">
          <div className="relative aspect-video w-full overflow-hidden">
            <VideoPlayer className="h-full w-full">
              <CloudinaryVideo className="h-full w-full object-cover" />
            </VideoPlayer>
          </div>
        </div>
      </div>

      {/* ── Social icons (desktop) ── */}
      <div className="absolute right-8 bottom-6 hidden gap-4 md:flex">
        <a
          href="https://facebook.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
        >
          <FacebookIcon className="h-5 w-5 transition-opacity hover:opacity-70" />
        </a>
        <a
          href="https://instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
        >
          <InstagramIcon className="h-5 w-5 transition-opacity hover:opacity-70" />
        </a>
        <a
          href="https://youtube.com"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="YouTube"
        >
          <YouTubeIcon className="h-5 w-5 transition-opacity hover:opacity-70" />
        </a>
      </div>
    </main>
  );
}
