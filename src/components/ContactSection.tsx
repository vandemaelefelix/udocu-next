"use client";

import { useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, useScroll, useTransform } from "motion/react";
import { usePostHog } from "posthog-js/react";
import { useIsMobile } from "@/hooks/useIsMobile";
import contactImage from "@/assets/images/contact-image.jpg";
import SocialLinks from "@/components/SocialLinks";
import GlitchText from "@/components/GlitchText";

export default function ContactSection() {
  const t = useTranslations("contact");
  const sectionRef = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();
  const posthog = usePostHog();

  // Entrance phase: image fades in and pans up as section enters the viewport
  const { scrollYProgress: scrollProgressEntrance } = useScroll({
    target: sectionRef,
    offset: ["0.3 1", "0 0"],
  });

  // Entrance: fade in from 0 → 1
  const entranceOpacity = useTransform(scrollProgressEntrance, [0, 1], [0, 1]);

  // Entrance parallax: image pans upward into position
  const entranceY = useTransform(scrollProgressEntrance, [0, 1], [-15, 0]);

  // Combined Y: output as percentage
  const imageY = useTransform(() => `${entranceY.get()}%`);

  return (
    <section
      ref={sectionRef}
      id="contact"
      className="flex min-h-screen flex-col md:h-screen md:flex-row"
    >
      {/* Left: image with text overlay */}
      <motion.div
        className="relative h-[45vh] w-full overflow-hidden md:h-auto md:w-3/5"
        style={{ opacity: isMobile ? 1 : entranceOpacity }}
      >
        <motion.div
          style={{ y: isMobile ? 0 : imageY }}
          className="absolute inset-[-10%]"
        >
          <Image
            src={contactImage}
            alt="Contact"
            fill
            className="object-cover object-center"
            sizes="(max-width: 767px) 100vw, 60vw"
            priority
          />
        </motion.div>
        {/* "LET'S TALK" overlay */}
        <div className="absolute inset-0 flex flex-col justify-end px-6 pb-8 md:px-8 md:pb-12">
          {t("overlay")
            .split("\n")
            .map((line, i) => (
              <p
                key={i}
                className={`font-posterman font-black uppercase text-orange-dark${i > 0 ? " ml-16 md:ml-48" : ""}`}
                style={{
                  fontSize: "clamp(100px, 25vw, 300px)",
                  lineHeight: "1",
                }}
              >
                {line}
              </p>
            ))}
        </div>
      </motion.div>

      {/* Right: contact details */}
      <div className="flex w-full flex-col justify-end px-6 pb-8 pt-8 text-white md:w-2/5 md:px-12 md:pb-12 md:pt-0">
        <div>
          <h2
            className="mb-6 font-posterman font-black uppercase leading-none"
            style={{ fontSize: "clamp(28px, 3.5vw, 52px)" }}
          >
            {t("name")}
          </h2>
          <div className="space-y-1 font-serif text-[18px] leading-6.5">
            <p>
              <a
                href={`mailto:${t("email")}`}
                className="rounded transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2"
                onClick={() =>
                  posthog.capture("contact_link_clicked", { type: "email" })
                }
              >
                <GlitchText>{t("email")}</GlitchText>
              </a>
            </p>
            <p>
              <a
                href={`tel:${t("phone").replace(/\s/g, "")}`}
                className="rounded transition-opacity hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2"
                onClick={() =>
                  posthog.capture("contact_link_clicked", { type: "phone" })
                }
              >
                <GlitchText>{t("phone")}</GlitchText>
              </a>
            </p>
          </div>
          <div className="mt-6 font-serif text-[18px] leading-6.5">
            <p>{t("addressLine1")}</p>
            <p>{t("addressLine2")}</p>
          </div>
          <SocialLinks className="mt-6 flex items-center gap-4" iconSize={28} />
        </div>
      </div>
    </section>
  );
}
