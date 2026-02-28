"use client";

import { useRef } from "react";
import Image, { type StaticImageData } from "next/image";
import { motion, useScroll, useTransform } from "motion/react";
import { useIsMobile } from "@/hooks/useIsMobile";

interface ParallaxHeroProps {
  backgroundImage: StaticImageData;
  children: React.ReactNode;
}

export default function ParallaxHero({
  backgroundImage,
  children,
}: ParallaxHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const isMobile = useIsMobile();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, -0.2]);

  if (isMobile) {
    return (
      <section
        ref={sectionRef}
        className="relative flex h-screen items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0">
          <Image
            src={backgroundImage}
            alt="background hero"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="relative z-10 w-fit text-center">{children}</div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen items-center justify-center overflow-hidden"
    >
      <motion.div className="absolute inset-0" style={{ y: bgY }}>
        <Image
          src={backgroundImage}
          alt="background hero"
          fill
          className="object-cover"
          priority
        />
      </motion.div>
      <motion.div
        className="relative z-10 w-fit text-center"
        style={{ y: contentY, opacity }}
      >
        {children}
      </motion.div>
    </section>
  );
}
