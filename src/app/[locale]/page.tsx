import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getAlternates } from "@/lib/seo";
import UdocuLogo from "@/components/UdocuLogo";
import ParallaxHero from "@/components/ParallaxHero";
import ScrollBackground from "@/components/ScrollBackground";
import StickyNav from "@/components/StickyNav";
import AboutSection from "@/components/AboutSection";
import WhoAmISection from "@/components/WhoAmISection";
import WorkSection from "@/components/WorkSection";
import ContactSection from "@/components/ContactSection";
import SocialDock from "@/components/SocialDock";
import { ScrollColorProvider } from "@/context/ScrollColorContext";
import MagneticScroll from "@/components/MagneticScroll";
import { createClient } from "@/prismicio";
import type { Content } from "@prismicio/client";

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
    alternates: getAlternates(locale),
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
      lang: "*",
      orderings: [{ field: "my.interview.publish_date", direction: "desc" }],
    },
  );

  return (
    <ScrollColorProvider>
      <MagneticScroll />
      <main id="main-content">
        <StickyNav />

        <ParallaxHero
          backgroundVideo="/videos/hero-video.mp4"
          backgroundVideoPoster="/videos/hero-poster.jpg"
        >
          <div className="w-[90vw] md:w-auto">
            <UdocuLogo
              aria-hidden="true"
              className="w-full"
              color="var(--color-green-light)"
            />
            <h1 className="user-select-none mt-4 font-serif text-4xl font-bold leading-tight tracking-[0.019em] text-green-light md:whitespace-nowrap md:text-[80px] md:leading-24">
              {t("tagline")}
            </h1>
          </div>
        </ParallaxHero>

        <ScrollBackground>
          <AboutSection />

          <div className="md:-mt-[50vh]">
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
