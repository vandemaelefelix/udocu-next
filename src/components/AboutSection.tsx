"use client";

import { useRef } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { motion, useScroll, useTransform } from "motion/react";
import { useIsMobile } from "@/hooks/useIsMobile";
import tvBackground from "@/assets/images/tv-background-image.png";
import Link from "next/link";

export default function AboutSection() {
  const t = useTranslations("about");
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();

  // Scroll animation for the opcaity of the image
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end end"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0]);

  // Parallax: image pans upward inside the sticky container as you scroll
  const imageY = useTransform(scrollYProgress, [0, 1], ["5%", "-5%"]);

  return (
    <section
      ref={sectionRef}
      id="about"
      className={`flex min-h-screen flex-col text-red-light md:min-h-[150vh] md:flex-row`}
    >
      {/* Image */}
      <motion.div
        className="relative h-[50vh] w-full shrink-0 overflow-hidden md:sticky md:top-0 md:z-10 md:h-screen md:w-3/5 md:self-start"
        style={{ opacity: isMobile ? 1 : opacity }}
      >
        <motion.div
          style={{ y: isMobile ? 0 : imageY }}
          className="absolute inset-[-10%]"
        >
          <Image src={tvBackground} alt="" fill className="object-cover" />
        </motion.div>
      </motion.div>

      {/* Text content */}
      <div className="flex w-full flex-col px-6 py-12 md:h-screen md:w-2/5 md:px-12 md:py-24">
        <div className="md:mt-auto md:max-w-93">
          <h2 className="mb-10 whitespace-nowrap text-[40px] leading-12 md:text-[74px] md:leading-[88px]">
            <span className="font-serif font-semibold">{t("titlePrefix")}</span>{" "}
            <span className="font-posterman font-black">
              {t("titleSuffix")}
            </span>
          </h2>
          <div className="space-y-6 font-serif text-[18px] font-normal leading-5.5 md:text-[20px]">
            <p>{t("paragraph1")}</p>
            <p>{t("paragraph2")}</p>
            <p>{t("paragraph3")}</p>
            <p>{t("paragraph4")}</p>
          </div>
          <div className="flex flex-col gap-16 mt-8">
            <Link
              href={`/${locale}/about`}
              className="group inline-flex items-center gap-2 font-helvetica text-[16px] font-medium uppercase leading-5 transition-opacity hover:opacity-70"
            >
              {t("readMoreLink")}{" "}
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-200 group-hover:translate-x-1"
              >
                &rarr;
              </span>
            </Link>
            <a
              href="#contact"
              className="group inline-flex items-center gap-2 font-helvetica text-[16px] font-medium uppercase leading-5 transition-opacity hover:opacity-70"
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
      </div>
    </section>
  );
}
