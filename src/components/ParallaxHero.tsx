"use client";

import { useCallback, useEffect, useRef } from "react";
import Image, { type StaticImageData } from "next/image";

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

  const onScroll = useCallback(() => {
    const section = sectionRef.current;
    const bg = bgRef.current;
    const content = contentRef.current;
    if (!section || !bg || !content) return;

    const scrollY = window.scrollY;
    const sectionHeight = section.offsetHeight;

    // Only apply effect while the hero is in view
    if (scrollY > sectionHeight) return;

    const progress = scrollY / sectionHeight; // 0 → 1

    // Background moves at 50% scroll speed (parallax)
    bg.style.transform = `translateY(${scrollY * 0.5}px)`;

    // Content moves up slightly faster and fades out
    content.style.transform = `translateY(${scrollY * 0.15}px)`;
    content.style.opacity = `${1 - progress * 1.2}`;
  }, []);

  useEffect(() => {
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
  }, [onScroll]);

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
