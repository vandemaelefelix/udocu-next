"use client";

import { useRef, useEffect, useSyncExternalStore } from "react";
import Image, { type StaticImageData } from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "motion/react";
import { useIsMobile } from "@/hooks/useIsMobile";

// Returns false during SSR / first paint and true once hydrated, without a
// setState-in-effect. Lets us defer attaching the video source to the client.
const emptySubscribe = () => () => {};
function useHydrated() {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false,
  );
}

interface ParallaxHeroProps {
  backgroundImage?: StaticImageData;
  backgroundVideo?: string;
  backgroundVideoPoster?: string;
  /** Portrait (9:16) cut served on small screens; falls back to the desktop video. */
  backgroundVideoMobile?: string;
  backgroundVideoPosterMobile?: string;
  children: React.ReactNode;
}

export default function ParallaxHero({
  backgroundImage,
  backgroundVideo,
  backgroundVideoPoster,
  backgroundVideoMobile,
  backgroundVideoPosterMobile,
  children,
}: ParallaxHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const isMobile = useIsMobile();
  const prefersReducedMotion = useReducedMotion();

  // Attach the video source only after hydration so the correct per-device file
  // is requested exactly once — mobile never downloads the heavier desktop cut.
  const mounted = useHydrated();

  const videoSrc =
    isMobile && backgroundVideoMobile ? backgroundVideoMobile : backgroundVideo;

  // CSS custom properties feed the `.hero-poster` background-image rule in
  // globals.css, so the browser picks the right poster from a plain media
  // query — never gated behind hydration/isMobile like the video src is.
  const posterStyle = {
    "--hero-poster-mobile": backgroundVideoPosterMobile
      ? `url(${backgroundVideoPosterMobile})`
      : backgroundVideoPoster
        ? `url(${backgroundVideoPoster})`
        : undefined,
    "--hero-poster-desktop": backgroundVideoPoster
      ? `url(${backgroundVideoPoster})`
      : undefined,
  } as React.CSSProperties;

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
  }, [prefersReducedMotion, videoSrc, mounted]);

  const background = videoSrc ? (
    <video
      ref={videoRef}
      src={mounted ? videoSrc : undefined}
      autoPlay
      loop
      muted
      playsInline
      className="absolute inset-0 h-full w-full object-cover pointer-events-none"
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
        <div className="absolute inset-0 hero-poster" style={posterStyle}>
          {background}
        </div>
        <div
          className="absolute inset-x-0 top-0 h-32 z-10 pointer-events-none"
          style={{
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
          }}
        />
        <div className="relative z-10 w-fit text-center">{children}</div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen items-center justify-center overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 hero-poster"
        style={{ y: bgY, ...posterStyle }}
      >
        {background}
      </motion.div>
      <div
        className="absolute inset-x-0 top-0 h-32 z-10 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, transparent 100%)",
        }}
      />
      <motion.div
        className="relative z-10 w-fit text-center"
        style={{ y: contentY, opacity }}
      >
        {children}
      </motion.div>
    </section>
  );
}
