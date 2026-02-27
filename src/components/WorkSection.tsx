"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

// Placeholder work items — will be replaced with Prismic data
const WORK_ITEMS = [
  { id: 1, color: "#c4956a" },
  { id: 2, color: "#8a7d6b" },
  { id: 3, color: "#6b8a7d" },
  { id: 4, color: "#917d6b" },
  { id: 5, color: "#6b7d8a" },
  { id: 6, color: "#8a6b7d" },
  { id: 7, color: "#7d8a6b" },
  { id: 8, color: "#6b8a80" },
  { id: 9, color: "#9a8b6a" },
  { id: 10, color: "#6a7b9a" },
];

const ITEM_WIDTH = 280;
const GAP = 24;
const ITEM_STRIDE = ITEM_WIDTH + GAP;
const SET_WIDTH = WORK_ITEMS.length * ITEM_STRIDE;

// Scroll space for the entry animation (vh)
const SCROLL_HEIGHT_VH = 200;

// How far the row drifts left during entry (px)
const DRIFT_DISTANCE = 250;

// Title appears after this progress
const TITLE_THRESHOLD = 0.35;

export default function WorkSection() {
  const t = useTranslations("work");
  const sectionRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(0);

  // Carousel offset after entry is done — driven by arrow buttons
  const carouselOffsetRef = useRef(0);
  const [carouselOffset, setCarouselOffset] = useState(0);
  const animFrameRef = useRef<number>(0);

  const entryComplete = progress >= 1;

  // Track scroll progress
  const onScroll = useCallback(() => {
    const section = sectionRef.current;
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const sectionHeight = section.offsetHeight;
    const viewportHeight = window.innerHeight;

    const scrolled = -rect.top;
    const totalScrollable = sectionHeight - viewportHeight;
    if (totalScrollable <= 0) {
      setProgress(0);
      return;
    }
    const rawProgress = scrolled / totalScrollable;
    setProgress(Math.max(0, Math.min(1, rawProgress)));
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

  // Smooth animate carousel offset toward target
  const animateCarousel = useCallback((target: number) => {
    cancelAnimationFrame(animFrameRef.current);

    const animate = () => {
      const current = carouselOffsetRef.current;
      const diff = target - current;

      if (Math.abs(diff) < 0.5) {
        // Wrap for infinite loop
        let final = target % SET_WIDTH;
        if (final > 0) final -= SET_WIDTH;
        carouselOffsetRef.current = final;
        setCarouselOffset(final);
        return;
      }

      carouselOffsetRef.current = current + diff * 0.08;
      setCarouselOffset(carouselOffsetRef.current);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  const scrollCarousel = (direction: "left" | "right") => {
    const step = ITEM_STRIDE * 2;
    const target =
      direction === "left"
        ? carouselOffsetRef.current + step
        : carouselOffsetRef.current - step;
    animateCarousel(target);
  };

  // Entry drift (eased) — starts at DRIFT_DISTANCE and eases down to 0
  const driftEased = 1 - Math.pow(1 - progress, 2);
  const entryOffset = (1 - driftEased) * DRIFT_DISTANCE;

  // Unified track position — no jump between entry and carousel.
  // Always anchored on the middle set (-SET_WIDTH). During entry, entryOffset
  // pushes items right; it eases to 0 so the carousel starts exactly in place.
  const trackX = -SET_WIDTH + entryOffset + carouselOffset;

  // Title fade
  const titleProgress = Math.max(
    0,
    Math.min(1, (progress - TITLE_THRESHOLD) / 0.2),
  );
  const titleEased = 1 - Math.pow(1 - titleProgress, 2);

  // Render a full set of items. The middle set (index 1) gets the entry animation.
  const renderSet = (setIndex: number) =>
    WORK_ITEMS.map((item, index) => {
      const isEntrySet = setIndex === 1;

      let translateY = 0;
      let opacity = 1;

      if (!entryComplete && isEntrySet) {
        // Staggered left-to-right: each item delayed by 7% of scroll progress
        const staggerDelay = index * 0.07;
        const fadeEnd = staggerDelay + 0.2;
        const fadeProgress = Math.max(
          0,
          Math.min(1, (progress - staggerDelay) / (fadeEnd - staggerDelay)),
        );
        opacity = 1 - Math.pow(1 - fadeProgress, 3);

        // Per-item vertical rise: starts at the stagger point, finishes
        // at progress=1 so it stays coupled with the horizontal drift.
        const verticalProgress = Math.max(
          0,
          (progress - staggerDelay) / (1 - staggerDelay),
        );
        const verticalEased = 1 - Math.pow(1 - verticalProgress, 2);
        translateY = (1 - verticalEased) * 40;
      } else if (!entryComplete && !isEntrySet) {
        opacity = 0;
      }

      return (
        <div
          key={`${setIndex}-${item.id}`}
          className="aspect-[3/4] flex-shrink-0 overflow-hidden rounded-sm"
          style={{
            width: ITEM_WIDTH,
            transform: `translateY(${translateY}%)`,
            opacity,
            transition: !isEntrySet ? "opacity 0.6s ease" : undefined,
            backgroundColor: item.color,
          }}
        />
      );
    });

  return (
    <section
      id="work"
      ref={sectionRef}
      style={{ height: `${SCROLL_HEIGHT_VH}vh` }}
    >
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden px-8 pt-24 pb-12">
        {/* Title — appears later */}
        <h2
          className="mb-10 font-posterman text-[74px] font-black leading-[88px]"
          style={{
            opacity: titleEased,
            transform: `translateY(${(1 - titleEased) * 30}px)`,
          }}
        >
          {t("title")}
        </h2>

        {/* Image track — all movement via translateX, no native scroll */}
        <div className="relative flex-1 overflow-hidden">
          <div
            className="absolute top-0 left-0 flex h-full items-center"
            style={{
              gap: GAP,
              transform: `translateX(${trackX}px)`,
              willChange: "transform",
            }}
          >
            {renderSet(0)}
            {renderSet(1)}
            {renderSet(2)}
          </div>
        </div>

        {/* Navigation arrows */}
        <div className="mt-auto flex items-center gap-4 pt-8">
          <button
            onClick={() => scrollCarousel("left")}
            className="text-3xl transition-opacity hover:opacity-70"
            style={{ opacity: entryComplete ? 1 : 0 }}
            aria-label="Previous"
            disabled={!entryComplete}
            aria-hidden={!entryComplete}
            tabIndex={entryComplete ? 0 : -1}
          >
            &larr;
          </button>
          <button
            onClick={() => scrollCarousel("right")}
            className="text-3xl transition-opacity hover:opacity-70"
            style={{ opacity: entryComplete ? 1 : 0 }}
            aria-label="Next"
            disabled={!entryComplete}
            aria-hidden={!entryComplete}
            tabIndex={entryComplete ? 0 : -1}
          >
            &rarr;
          </button>
        </div>
      </div>
    </section>
  );
}
