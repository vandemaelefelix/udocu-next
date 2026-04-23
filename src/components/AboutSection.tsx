"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { motion, useScroll, useTransform } from "motion/react";
import { useIsMobile } from "@/hooks/useIsMobile";
import tvBackground from "@/assets/images/tv-background-image.png";
import tvFrameOverlay from "@/assets/images/tv-frame-overlay.png";
import CloudinaryVideo from "@/components/CloudinaryVideo";
import VolumeIcon from "@/components/icons/VolumeIcon";
import ArrowLink from "@/components/ArrowLink";
import Link from "next/link";

export default function AboutSection() {
  const t = useTranslations("about");
  const locale = useLocale();
  const sectionRef = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const toggleMute = useCallback(() => {
    const videoEl = videoContainerRef.current?.querySelector("video");
    if (videoEl) {
      videoEl.muted = !videoEl.muted;
      setIsMuted(videoEl.muted);
    }
  }, []);

  // Scroll animation for the opacity of the image
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
      {/* Image with video playing inside the TV */}
      <motion.div
        className="relative h-[50vh] w-full shrink-0 overflow-hidden md:sticky md:top-0 md:z-10 md:h-screen md:w-3/5 md:self-start"
        style={{ opacity: isMobile ? 1 : opacity }}
      >
        <motion.div
          style={{ y: isMobile ? 0 : imageY, scale: 1.6 }}
          className="absolute inset-[-10%] origin-center overflow-hidden"
        >
          {/*
           * Single coordinate space: a div sized to the image's native
           * aspect ratio (1856×2304 ≈ 0.806:1), centered and scaled to
           * cover the container — just like object-cover, but everything
           * inside shares the same coordinates.
           */}
          <div
            ref={videoContainerRef}
            className="absolute"
            style={{
              /* native image aspect ratio */
              aspectRatio: "1856 / 2304",
              /* cover: fill the shorter axis, center the overflow */
              width: "auto",
              height: "auto",
              minWidth: "100%",
              minHeight: "100%",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Background image */}
            <Image
              src={tvFrameOverlay}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 767px) 100vw, 60vw"
            />

            {/* Video in the TV screen cutout */}
            <Link
              href={`/${locale}/about`}
              className="group absolute cursor-pointer overflow-hidden"
              style={{
                top: "37%",
                left: "37%",
                width: "23%",
                height: "15.5%",
              }}
            >
              <CloudinaryVideo className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
              {/* CRT screen effect overlay */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "repeating-linear-gradient(0deg, rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px, transparent 1px, transparent 3px)",
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)",
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 mix-blend-overlay opacity-10"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(255,0,0,0.5), rgba(0,255,0,0.5), rgba(0,0,255,0.5))",
                  backgroundSize: "3px 100%",
                }}
              />
            </Link>

            {/* TV frame overlay on top */}
            <Image
              src={tvFrameOverlay}
              alt=""
              fill
              className="pointer-events-none"
              sizes="(max-width: 767px) 100vw, 60vw"
            />
          </div>
        </motion.div>

        {/* Mute toggle at the bottom of the image */}
        <button
          type="button"
          onClick={toggleMute}
          className="absolute bottom-4 right-4 z-20 flex h-9 w-9 items-center cursor-pointer justify-center rounded-full bg-red-dark text-red-light transition-opacity hover:opacity-70"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          <VolumeIcon muted={isMuted} className="h-4 w-4" />
        </button>
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
          <div className="flex flex-col gap-4 md:gap-16 mt-8">
            <ArrowLink href={`/${locale}/about`}>{t("readMoreLink")}</ArrowLink>
            <ArrowLink href="#contact">{t("contactLink")}</ArrowLink>
          </div>
        </div>
      </div>
    </section>
  );
}
