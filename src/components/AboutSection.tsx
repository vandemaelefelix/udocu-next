"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useIsMobile } from "@/hooks/useIsMobile";
import tvBackground from "@/assets/images/tv-background-image.png";

export default function AboutSection() {
  const t = useTranslations("about");
  const sectionRef = useRef<HTMLElement>(null);
  const [opacity, setOpacity] = useState(1);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isMobile) return;

    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const fadeStart = vh * 1.3;
      const fadeEnd = vh * 1.15;
      setOpacity(
        Math.max(
          0,
          Math.min(1, (rect.bottom - fadeEnd) / (fadeStart - fadeEnd)),
        ),
      );
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isMobile]);

  return (
    <section
      ref={sectionRef}
      id="about"
      className="flex min-h-screen flex-col md:min-h-[150vh] md:flex-row"
    >
      {/* Image */}
      <div
        className="relative h-[50vh] w-full shrink-0 md:sticky md:top-0 md:z-10 md:h-screen md:w-3/5 md:self-start"
        style={{ opacity: isMobile ? 1 : opacity }}
      >
        <Image src={tvBackground} alt="" fill className="object-cover" />
      </div>

      {/* Text content */}
      <div className="flex w-full flex-col px-6 py-12 md:h-screen md:w-2/5 md:px-12 md:py-24">
        <div className="md:mt-auto md:max-w-93">
          <h2 className="mb-10 font-posterman text-[40px] font-black leading-12 md:text-[74px] md:leading-22">
            {t("title")}
          </h2>
          <div className="space-y-6 font-serif text-[18px] font-normal leading-5.5 md:text-[20px]">
            <p>{t("paragraph1")}</p>
            <p>{t("paragraph2")}</p>
            <p>{t("paragraph3")}</p>
            <p>{t("paragraph4")}</p>
          </div>
          <a
            href="#contact"
            className="group mt-10 inline-flex items-center gap-2 font-helvetica text-[16px] font-medium uppercase leading-5 transition-opacity hover:opacity-70"
          >
            {t("contactLink")}{" "}
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-200 group-hover:translate-x-1"
            >
              &rarr;
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
