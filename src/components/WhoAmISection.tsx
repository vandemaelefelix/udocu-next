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

  // Entrance scroll range: section top enters viewport bottom → section top at viewport top
  // WhoAmI visual top at y=2250: tracks scrollY 1350 → 2250
  const { scrollYProgress: scrollProgressEntrance } = useScroll({
    target: sectionRef,
    offset: ["0 1", "0 0"],
  });

  // Scroll-through: tracks scrollY 2250 → 2700 (section pinned then scrolls away)
  const { scrollYProgress: scrollProgressThrough } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  // Text parallax: slides up as section approaches
  const { scrollYProgress: scrollProgressText } = useScroll({
    target: sectionRef,
    offset: ["start center", "start start"],
  });

  // Portrait entrance: full scroll range — portrait fades in as WhoAmI physically
  // slides up into the viewport. TV is fading simultaneously on the opposite side,
  // creating the bilateral crossfade feel.
  const portraitEntranceRaw = useTransform(
    scrollProgressEntrance,
    [0, 1],
    [0, 1],
  );
  const portraitEntranceOpacity = useTransform(portraitEntranceRaw, (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  );

  // Portrait scroll-through: fades out as section scrolls away
  const scrollThroughOpacity = useTransform(
    scrollProgressThrough,
    [0, 1],
    [1, 0],
  );

  // Portrait combined opacity: entrance × scroll-through
  const imageOpacity = useTransform(
    () => portraitEntranceOpacity.get() * scrollThroughOpacity.get(),
  );

  // Portrait entrance scale: starts slightly zoomed in, settles to 100% as portrait appears
  const portraitEntranceScale = useTransform(portraitEntranceRaw, (t) => {
    const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    return 1.05 - 0.05 * eased; // 1.05 → 1.0
  });

  // Portrait entrance parallax: subtle upward pan
  const entranceY = useTransform(scrollProgressEntrance, [0, 1], [-20, 0]);

  // Portrait scroll-through parallax
  const scrollThroughY = useTransform(scrollProgressThrough, [0, 1], [5, -5]);

  // Combined portrait Y
  const imageY = useTransform(
    () => `${entranceY.get() + scrollThroughY.get()}%`,
  );

  // Text parallax (positions text before it becomes visible)
  const textY = useTransform(scrollProgressText, [0, 1], [80, 0]);
  // Text appears in the final third of WhoAmI's entrance — when TV is nearly gone.
  // Uses scrollProgressEntrance (0→1 as scrollY 1350→2250) so text and portrait
  // share the same scroll reference, keeping both sides synchronized.
  const textOpacity = useTransform(scrollProgressEntrance, [0.7, 1], [0, 1]);

  return (
    <section
      ref={sectionRef}
      id="who-am-i"
      className="flex min-h-screen flex-col md:min-h-[150vh] md:flex-row"
    >
      {/* Left: title + bio + links — fades in as WhoAmI scrolls into view.
          `relative z-20` lifts this interactive column above the About
          section's sticky TV image (z-10 on the opposite column): during the
          scroll cross-dissolve the two overlap, and an opacity-0 image still
          captures pointer events, which would otherwise swallow clicks on the
          "read more"/contact links here. */}
      <motion.div
        className="relative z-20 flex w-full flex-col px-6 py-12 md:h-screen md:w-2/5 md:px-12 md:py-16"
        style={{ opacity: isMobile ? 1 : textOpacity }}
      >
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
      </motion.div>

      {/* Right: sticky portrait — cross-dissolves with About TV on opposite column */}
      <motion.div
        className="relative order-first h-[50vh] w-full shrink-0 overflow-hidden md:sticky md:top-0 md:order-last md:h-screen md:w-3/5 md:self-start"
        style={{ opacity: isMobile ? 1 : imageOpacity }}
      >
        <motion.div
          style={{
            y: isMobile ? 0 : imageY,
            scale: isMobile ? 1 : portraitEntranceScale,
          }}
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
        {/* Photographer credit — required attribution, white text in the bottom corner */}
        <span className="pointer-events-none absolute bottom-3 right-3 z-10 font-helvetica text-xs tracking-wide text-white/80 md:bottom-4 md:right-4">
          {t("photoCredit")}
        </span>
      </motion.div>
    </section>
  );
}
