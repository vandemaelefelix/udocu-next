"use client";

import { useRef } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import ArrowLink from "@/components/ArrowLink";
import { motion, useScroll, useTransform } from "motion/react";
import { useIsMobile } from "@/hooks/useIsMobile";
import bioPhoto from "@/assets/images/who-am-i.png";

export default function WhoAmISection() {
  const t = useTranslations("whoAmI");
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();

  // Text parallax: text slides up as section enters viewport
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start center", "start start"],
  });

  // Entrance phase: image fades in and pans up as section enters the viewport
  const { scrollYProgress: scrollProgressEntrance } = useScroll({
    target: sectionRef,
    offset: ["0.3 1", "0 0"],
  });

  // Scroll-through phase: parallax + fade-out while sticky (like AboutSection)
  const { scrollYProgress: scrollProgressThrough } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Entrance: fade in from 0 → 1 (complete at ~67% of entrance)
  const entranceOpacity = useTransform(scrollProgressEntrance, [0, 1], [0, 1]);

  // Scroll-through: fade out from 1 → 0 as you scroll past
  const scrollThroughOpacity = useTransform(
    scrollProgressThrough,
    [0, 1],
    [1, 0],
  );

  // Combined opacity: multiply entrance × scroll-through
  const imageOpacity = useTransform(
    () => entranceOpacity.get() * scrollThroughOpacity.get(),
  );

  // Entrance parallax: image pans upward into position
  const entranceY = useTransform(scrollProgressEntrance, [0, 1], [-15, 0]);

  // Scroll-through parallax: subtle continued pan (like AboutSection's 5% → -5%)
  const scrollThroughY = useTransform(scrollProgressThrough, [0, 1], [5, -5]);

  // Combined Y: sum both parallax values, output as percentage
  const imageY = useTransform(
    () => `${entranceY.get() + scrollThroughY.get()}%`,
  );

  // Parallax: text moves up faster than natural scroll
  const textY = useTransform(scrollYProgress, [0, 1], [80, 0]);

  return (
    <section
      ref={sectionRef}
      id="who-am-i"
      className="flex min-h-screen flex-col md:min-h-[150vh] md:flex-row"
    >
      {/* Left: title + bio + links pushed to bottom */}
      <div className="flex w-full flex-col px-6 py-12 md:h-screen md:w-2/5 md:px-12 md:py-16 ">
        <motion.div
          style={{ y: isMobile ? 0 : textY }}
          className="md:mt-auto md:max-w-93"
        >
          <h2 className="mb-10 font-serif text-[40px] font-semibold leading-12 md:text-[74px] md:leading-[88px]">
            {t("title")}
          </h2>
          <p className="font-serif text-[18px] font-normal leading-5.5 md:text-[20px]">
            {t("bio")}
          </p>

          <div className="mt-8 flex flex-col gap-4 md:gap-16">
            <ArrowLink href={`/${locale}/who-am-i`}>
              {t("readMoreLink")}
            </ArrowLink>
            <ArrowLink href="#contact">{t("contactLink")}</ArrowLink>
          </div>
        </motion.div>
      </div>

      {/* Right: sticky full-height photo — mirrors AboutSection's image */}
      <motion.div
        className="relative order-first h-[50vh] w-full shrink-0 overflow-hidden md:sticky md:top-0 md:order-last md:h-screen md:w-3/5 md:self-start"
        style={{ opacity: isMobile ? 1 : imageOpacity }}
      >
        <motion.div
          style={{ y: isMobile ? 0 : imageY }}
          className="absolute inset-[-10%]"
        >
          <Image
            src={bioPhoto}
            alt={t("imageAlt")}
            fill
            className="object-cover object-center"
            sizes="(max-width: 767px) 100vw, 60vw"
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
