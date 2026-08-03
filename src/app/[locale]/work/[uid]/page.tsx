import { Metadata } from "next";
import { notFound } from "next/navigation";
import * as prismic from "@prismicio/client";
import { createClient, PRISMIC_LOCALE } from "@/prismicio";
import type { Content } from "@prismicio/client";
import { getAlternates, SITE_URL } from "@/lib/seo";
import DetailBackLink from "@/components/DetailBackLink";
import { getTranslations } from "next-intl/server";
import DetailNav from "@/components/DetailNav";
import YouTubeEmbed from "@/components/YouTubeEmbed";
import SocialLinks from "@/components/SocialLinks";
import { getColorPair } from "@/utils/colors";

type Params = { locale: string; uid: string };

export async function generateStaticParams() {
  const client = createClient();
  const documents = await client.getAllByType("interview", {
    lang: PRISMIC_LOCALE,
  });

  return documents.map((doc) => ({ locale: "nl", uid: doc.uid }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { uid } = await params;
  const client = createClient();

  try {
    const page = await client.getByUID<Content.InterviewDocument>(
      "interview",
      uid,
      { lang: PRISMIC_LOCALE },
    );

    const title = page.data.name ?? undefined;
    const images = page.data.image_url?.url
      ? [{ url: page.data.image_url.url }]
      : [];

    return {
      title,
      openGraph: { title, images },
      twitter: { card: "summary_large_image", title, images },
      alternates: getAlternates(`work/${uid}`),
    };
  } catch {
    return {};
  }
}

export default async function WorkDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { uid } = await params;
  const client = createClient();

  let page: Content.InterviewDocument;
  try {
    page = await client.getByUID<Content.InterviewDocument>("interview", uid, {
      lang: PRISMIC_LOCALE,
    });
  } catch {
    notFound();
  }

  const videoUrl =
    page.data.video_url.link_type === "Web"
      ? (page.data.video_url as prismic.FilledLinkToWebField).url
      : null;

  const colors = getColorPair(uid);
  const t = await getTranslations("nav");

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Work",
        item: `${SITE_URL}/work`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: page.data.name,
      },
    ],
  };

  const videoJsonLd = videoUrl
    ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: page.data.name,
        thumbnailUrl: page.data.image_url?.url ?? undefined,
        embedUrl: videoUrl,
        uploadDate: page.data.publish_date ?? undefined,
        publisher: {
          "@type": "Organization",
          name: "udocu",
          url: SITE_URL,
        },
      }
    : null;

  return (
    <main
      id="main-content"
      className={`relative flex min-h-screen flex-col md:h-screen md:overflow-hidden ${colors.bg} ${colors.text}`}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {videoJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
        />
      )}

      <div className="shrink-0">
        <DetailNav
          activeItem="work"
          overlayBgColor={colors.overlayBg}
          overlayTextColor={colors.overlayText}
        />
      </div>

      {/* Mobile back link: in-flow (scrolls with the page) instead of
          sitting in the sticky header. Desktop keeps its own back link
          further down, centered below the content. */}
      <div className="px-8 pt-6 pb-2 md:hidden">
        <DetailBackLink
          href="/#work"
          className="font-helvetica text-[16px] font-medium uppercase leading-5 tracking-widest transition-opacity hover:opacity-70"
        >
          {t("back")}
        </DetailBackLink>
      </div>

      <div className="flex flex-1 flex-col px-8 pb-8 md:pb-16">
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center gap-8 md:gap-10">
          {page.data.name && (
            <h1 className="text-center font-posterman text-[40px] font-black uppercase leading-[1.1] md:text-[64px]">
              {page.data.name}
            </h1>
          )}

          {videoUrl && (
            <div className="relative aspect-video w-full overflow-hidden">
              <YouTubeEmbed
                url={videoUrl}
                title={page.data.name ?? undefined}
              />
            </div>
          )}

          <div className="hidden justify-center md:flex">
            <DetailBackLink
              href="/#work"
              className="font-helvetica text-[16px] font-medium uppercase leading-5 tracking-widest transition-opacity hover:opacity-70"
            >
              {t("back")}
            </DetailBackLink>
          </div>
        </div>
      </div>

      <SocialLinks className="absolute right-8 bottom-6 hidden gap-4 md:flex" />
    </main>
  );
}
