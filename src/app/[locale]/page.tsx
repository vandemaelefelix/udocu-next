import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";
import { getAlternates } from "@/lib/seo";
import UdocuLogo from "@/components/UdocuLogo";
import ParallaxHero from "@/components/ParallaxHero";
import ScrollBackground from "@/components/ScrollBackground";
import StickyNav from "@/components/StickyNav";
import AboutSection from "@/components/AboutSection";
const WhoAmISection = dynamic(() => import("@/components/WhoAmISection"));
import WorkSection from "@/components/WorkSection";
const ContactSection = dynamic(() => import("@/components/ContactSection"));
import SocialDock from "@/components/SocialDock";
import { ScrollColorProvider } from "@/context/ScrollColorContext";
import ThemeColorSync from "@/components/ThemeColorSync";
import MagneticScroll from "@/components/MagneticScroll";
import { createClient, PRISMIC_LOCALE } from "@/prismicio";
import type { Content } from "@prismicio/client";
import { HomepageSectionTracker } from "@/components/HomepageSectionTracker";

type Params = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("homeTitle"),
    description: t("homeDescription"),
    alternates: getAlternates(),
  };
}

export default async function HomePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  const client = createClient();
  const interviews = await client.getAllByType<Content.InterviewDocument>(
    "interview",
    {
      lang: PRISMIC_LOCALE,
      orderings: [{ field: "my.interview.publish_date", direction: "desc" }],
    },
  );

  return (
    <ScrollColorProvider>
      <HomepageSectionTracker />
      <ThemeColorSync />
      <MagneticScroll />
      <main id="main-content">
        <StickyNav />

        <ParallaxHero
          backgroundVideo="/videos/hero-video.v2.mp4"
          backgroundVideoPoster="/videos/hero-poster.webp"
          backgroundVideoMobile="/videos/hero-video-mobile.v2.mp4"
          backgroundVideoPosterMobile="/videos/hero-poster-mobile.webp"
        >
          <div className="flex flex-col items-center">
            {/* Logo is capped by height on desktop (md:h-[48vh]) so the
                vertically-centred hero block always clears the fixed nav; width
                is auto to preserve the logo's aspect ratio. Mobile keeps the
                full-width logo. */}
            <UdocuLogo
              aria-hidden="true"
              className="h-auto w-[90vw] md:h-[48vh] md:w-auto md:max-w-[92vw]"
              color="var(--color-green-light)"
            />
            <h1 className="user-select-none mt-4 max-w-[92vw] text-center font-serif text-4xl font-bold leading-tight tracking-[0.019em] text-green-light md:whitespace-nowrap md:text-[80px] md:leading-24">
              {t("tagline")}
            </h1>
          </div>
        </ParallaxHero>

        <ScrollBackground>
          <AboutSection />

          <div className="md:-mt-[100vh]">
            <WhoAmISection />
          </div>
          <div className="md:-mt-[25vh]">
            <WorkSection interviews={interviews} />
          </div>

          <ContactSection />

          <SocialDock />
        </ScrollBackground>
      </main>
    </ScrollColorProvider>
  );
}
