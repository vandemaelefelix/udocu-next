"use client";

import { useCallback, useEffect, useRef } from "react";
import Image, { type StaticImageData } from "next/image";
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
  const bgRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  const onScroll = useCallback(() => {
    const section = sectionRef.current;
    const bg = bgRef.current;
    const content = contentRef.current;
    if (!section || !bg || !content) return;

    const scrollY = window.scrollY;
    const sectionHeight = section.offsetHeight;

    if (scrollY > sectionHeight) return;

    const progress = scrollY / sectionHeight;

    bg.style.transform = `translateY(${scrollY * 0.5}px)`;
    content.style.transform = `translateY(${scrollY * 0.15}px)`;
    content.style.opacity = `${1 - progress * 1.2}`;
  }, []);

  useEffect(() => {
    if (isMobile) {
      // Reset any transforms on mobile
      if (bgRef.current) bgRef.current.style.transform = "";
      if (contentRef.current) {
        contentRef.current.style.transform = "";
        contentRef.current.style.opacity = "";
      }
      return;
    }

    let rafId: number;

    function handleScroll() {
      rafId = requestAnimationFrame(onScroll);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, [onScroll, isMobile]);

  return (
    <section
      ref={sectionRef}
      className="relative flex h-screen items-center justify-center overflow-hidden"
    >
      <div ref={bgRef} className="absolute inset-0 will-change-transform">
        <Image
          src={backgroundImage}
          alt="background hero"
          fill
          className="object-cover"
          priority
        />
      </div>
      <div
        ref={contentRef}
        className="relative z-10 w-fit text-center will-change-transform"
      >
        {children}
      </div>
    </section>
  );
}
