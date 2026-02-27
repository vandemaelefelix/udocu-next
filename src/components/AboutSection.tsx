"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import tvBackground from "@/assets/images/tv-background-image.png";

export default function AboutSection() {
  const t = useTranslations("about");
  const sectionRef = useRef<HTMLElement>(null);
  const [opacity, setOpacity] = useState(1);

  // TODO: Fade out image with grain effect. It should look like an old tv
  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const fadeStart = vh * 1.3; // start fading when section is nearly gone
      const fadeEnd = vh * 1.15; // fully faded before sticky element unsticks
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
  }, []);

  return (
    <section ref={sectionRef} id="about" className="flex min-h-[150vh]">
      <div
        className="sticky top-0 z-10 h-screen w-3/5 shrink-0 self-start"
        style={{ opacity }}
      >
        <Image src={tvBackground} alt="" fill className="object-cover" />
      </div>
      <div className="flex h-screen w-2/5 flex-col px-12 py-24">
        <div className="mt-auto max-w-93">
          <h2 className="mb-10 font-posterman text-[74px] font-black leading-22">
            {t("title")}
          </h2>
          <div className="space-y-6 font-serif text-[20px] font-normal leading-5.5">
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
