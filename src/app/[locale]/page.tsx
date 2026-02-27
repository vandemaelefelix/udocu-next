import { useTranslations } from "next-intl";
import backgroundHero from "@/assets/images/background-hero.png";
import UdocuLogo from "@/components/UdocuLogo";
import ParallaxHero from "@/components/ParallaxHero";
import ScrollBackground from "@/components/ScrollBackground";
import StickyNav from "@/components/StickyNav";
import AboutSection from "@/components/AboutSection";
import WorkSection from "@/components/WorkSection";
import ContactSection from "@/components/ContactSection";
import SocialDock from "@/components/SocialDock";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <main>
      <ParallaxHero backgroundImage={backgroundHero}>
        <UdocuLogo className="w-full" color="var(--color-green-light)" />
        <p className="user-select-none mt-4 whitespace-nowrap font-serif text-[80px] font-bold leading-24 tracking-[0.019em] text-green-light">
          {t("tagline")}
        </p>
      </ParallaxHero>

      <ScrollBackground>
        <StickyNav />
        <AboutSection />
        <SocialDock />
        <div className="-mt-[95vh]">
          <WorkSection />
        </div>
        <ContactSection />
      </ScrollBackground>
    </main>
  );
}
