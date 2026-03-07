import { getTranslations } from "next-intl/server";
import backgroundHero from "@/assets/images/background-hero.png";
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
import { createClient } from "@/prismicio";
import type { Content } from "@prismicio/client";

export default async function HomePage() {
  const t = await getTranslations("home");
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
      <main>
        <StickyNav />

        <ParallaxHero backgroundImage={backgroundHero}>
          <div className="w-[90vw] md:w-auto">
            <UdocuLogo className="w-full" color="var(--color-green-light)" />
            <p className="user-select-none mt-4 font-serif text-4xl font-bold leading-tight tracking-[0.019em] text-green-light md:whitespace-nowrap md:text-[80px] md:leading-24">
              {t("tagline")}
            </p>
          </div>
        </ParallaxHero>

        <ScrollBackground>
          <AboutSection />

          <div className="md:-mt-[50vh]">
            <WhoAmISection />
          </div>

          <WorkSection interviews={interviews} />

          <div className="h-96"></div>
          <ContactSection />

          <SocialDock />
        </ScrollBackground>
      </main>
    </ScrollColorProvider>
  );
}
