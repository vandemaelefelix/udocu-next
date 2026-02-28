"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Content } from "@prismicio/client";
import {
  motion,
  useMotionValue,
  useScroll,
  useTransform,
  MotionValue,
} from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";

type Props = {
  interviews: Content.InterviewDocument[];
};

const GAP = 24; // gap-6 = 1.5rem = 24px

// Configurable item sizing
const ITEM_SIZE = {
  className: "w-96 h-96",
  px: 384, // matches w-96 (24rem = 384px)
};

const STEP = ITEM_SIZE.px + GAP; // width of one item slot
const COPIES = 6; // number of repeated sets for infinite illusion

const STAGGER = 0.0; // scroll progress offset between each item
const ANIM_DURATION = 0.6; // scroll progress range each item animates over

const filteredInterviews = (interviews: Content.InterviewDocument[]) =>
  interviews
    .filter((i) => i.data.image_url?.url)
    .map((i) => ({
      id: i.id,
      uid: i.uid,
      imageUrl: i.data.image_url.url!,
      alt: i.data.image_url.alt ?? "",
    }));

function circOutEasing(t: number): number {
  return Math.sqrt(1 - Math.pow(t - 1, 2));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function WorkSection({ interviews }: Props) {
  const locale = useLocale();
  const t = useTranslations();
  const items = filteredInterviews(interviews);

  const displayedItems = items.map((item) => ({
    href: `/${locale}/interviews/${item.uid}`,
    ...item,
  }));

  const itemCount = displayedItems.length;
  const setWidth = itemCount * STEP; // width of one full set of items

  // Repeat items for seamless infinite scrolling
  const repeatedItems = Array.from({ length: COPIES }, (_, copyIdx) =>
    displayedItems.map((item, i) => ({
      ...item,
      key: `${item.id}-${copyIdx}`,
      flexIndex: copyIdx * itemCount + i,
    })),
  ).flat();

  // Start centered on the middle copy (copy index 3)
  const x = useMotionValue(-3 * setWidth);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Normalize x back to the center copy range
  // Since all copies are identical, shifting by setWidth is visually imperceptible
  const normalizeX = useCallback(
    (val: number) => {
      if (setWidth === 0) return val;
      const mod = ((-val % setWidth) + setWidth) % setWidth;
      return -(mod + 3 * setWidth);
    },
    [setWidth],
  );

  // Wheel scrolling — normalize immediately on each event since
  // shifting by setWidth is visually identical (no debounce needed)
  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const handleWheel = (e: WheelEvent) => {
      // Only handle horizontal scrolling if deltaX is significant and greater than deltaY
      // This prevents vertical scroll events from triggering carousel movement
      const horizontalIntensity = Math.abs(e.deltaX);
      const verticalIntensity = Math.abs(e.deltaY);

      // Require horizontal movement to be at least 2x stronger than vertical
      if (horizontalIntensity < verticalIntensity * 2) return;

      e.preventDefault();
      x.set(normalizeX(x.get() - e.deltaX));
    };

    wrapper.addEventListener("wheel", handleWheel, { passive: false });
    return () => wrapper.removeEventListener("wheel", handleWheel);
  }, [x, normalizeX]);

  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start center", "end start"],
  });

  // the title should appear together with the first item, so it has the same stagger and duration but no translateY, just opacity
  const titleOpacity = useTransform(scrollYProgress, (progress: number) => {
    const start = 0 * STAGGER;
    const end = Math.min(1, start + ANIM_DURATION);
    if (end <= start) return 1;
    return clamp((progress - start) / (end - start), 0, 1);
  });

  if (itemCount === 0) return null;

  return (
    <section
      ref={sectionRef}
      id="work"
      className="flex min-h-[100vh] flex-col overflow-x-clip"
    >
      {/* Sticky wrapper: measures width, does NOT clip overflow */}
      <div ref={wrapperRef} className="sticky top-2/5 z-10">
        <motion.h1
          className="absolute top-0 left-4 pb-4 translate-y-[-100%] font-posterman font-black text-[74px] leading-22 tracking-normal"
          style={{
            opacity: titleOpacity,
          }}
        >
          {t("work.title")}
        </motion.h1>
        {/* Draggable row: no overflow constraint so Y-translated items show */}
        <motion.div
          className="flex gap-6 cursor-grab w-max"
          drag="x"
          dragElastic={0.05}
          dragTransition={{ power: 0.3, timeConstant: 300 }}
          whileDrag={{ cursor: "grabbing" }}
          style={{ x }}
          onDragTransitionEnd={() => {
            x.set(normalizeX(x.get()));
          }}
        >
          {repeatedItems.map((item) => (
            <CarouselItem
              key={item.key}
              flexIndex={item.flexIndex}
              item={item}
              x={x}
              scrollYProgress={scrollYProgress}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const CarouselItem = ({
  item,
  flexIndex,
  x,
  scrollYProgress,
}: {
  item: { id: string; href: string; imageUrl: string; alt: string };
  flexIndex: number;
  x: MotionValue<number>;
  scrollYProgress: MotionValue<number>;
}) => {
  // Compute visual index: leftmost visible item = 0, next = 1, etc.
  // Items off-screen left (vi < 0) are clamped to 0 so they're already
  // fully "entered" and don't visibly appear at the viewport edge.
  const y = useTransform([scrollYProgress, x], ([progress, xVal]: number[]) => {
    const screenPos = flexIndex * STEP + xVal;
    const vi = clamp(Math.round(screenPos / STEP), 0, 20);
    const initialY = vi * 150;
    const start = vi * STAGGER;
    const end = Math.min(1, start + ANIM_DURATION);
    if (end <= start) return initialY;
    const t = clamp((progress - start) / (end - start), 0, 1);
    return initialY * (1 - circOutEasing(t));
  });

  const opacity = useTransform(
    [scrollYProgress, x],
    ([progress, xVal]: number[]) => {
      const screenPos = flexIndex * STEP + xVal;
      const vi = clamp(Math.round(screenPos / STEP), 0, 20);
      const start = vi * STAGGER;
      const end = Math.min(1, start + ANIM_DURATION);
      if (end <= start) return 1;
      return clamp((progress - start) / (end - start), 0, 1);
    },
  );

  return (
    <a href={item.href} className="no-underline">
      <motion.div
        data-carousel-item
        className={`shrink-0 rounded-lg overflow-hidden bg-gray-100 ${ITEM_SIZE.className}`}
        style={{ y, opacity }}
      >
        <Image
          src={item.imageUrl}
          alt={item.alt}
          className="w-full h-full object-cover"
          loading="lazy"
          width={ITEM_SIZE.px}
          height={ITEM_SIZE.px}
        />
      </motion.div>
    </a>
  );
};
