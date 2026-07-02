"use client";

import { useRef, useEffect } from "react";
import Image, { type StaticImageData } from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "motion/react";
import { useIsMobile } from "@/hooks/useIsMobile";

interface ParallaxHeroProps {
  backgroundImage?: StaticImageData;
  backgroundVideo?: string;
  backgroundVideoPoster?: string;
  children: React.ReactNode;
}

export default function ParallaxHero({
  backgroundImage,
  backgroundVideo,
  backgroundVideoPoster,
  children,
}: ParallaxHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const opacity = useTransform(scrollYProgress, [0, 1], [1, -0.2]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (prefersReducedMotion) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [prefersReducedMotion]);

  const background =
    backgroundVideo && !isMobile ? (
      <video
        ref={videoRef}
        src={backgroundVideo}
        autoPlay
        loop
        muted
        playsInline
        poster={backgroundVideoPoster}
        className="absolute inset-0 h-full w-full object-cover pointer-events-none"
      />
    ) : backgroundVideoPoster && isMobile ? (
      <Image
        src={backgroundVideoPoster}
        alt=""
        aria-hidden="true"
        fill
        className="object-cover"
        sizes="100vw"
        priority
      />
    ) : backgroundImage ? (
      <Image
        src={backgroundImage}
        alt=""
        aria-hidden="true"
        fill
        className="object-cover"
        sizes="100vw"
        priority
      />
    ) : null;

  if (isMobile) {
    return (
      <section
        ref={sectionRef}
        className="relative flex h-screen items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0">{background}</div>
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
        {background}
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
