"use client";

import { useLocale, useTranslations } from "next-intl";
import type { Content } from "@prismicio/client";
import {
  motion,
  animate as motionAnimate,
  useMotionValue,
  useScroll,
  useSpring,
  useMotionValueEvent,
  useAnimate,
  useTransform,
  type MotionValue,
} from "motion/react";
import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

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

const SCROLL_THRESHOLD = 0.35; // scroll progress at which the animation triggers
const ITEM_STAGGER = 0.06; // delay between each item's animation (seconds)
const ANIM_DURATION_SEC = 0.6; // duration of each item's animation (seconds)

const filteredInterviews = (interviews: Content.InterviewDocument[]) =>
  interviews
    .filter((i) => i.data.image_url?.url)
    .map((i) => ({
      id: i.id,
      uid: i.uid,
      imageUrl: i.data.image_url.url!,
      alt: i.data.image_url.alt ?? "",
    }));

export default function WorkSection({ interviews }: Props) {
  const locale = useLocale();
  const t = useTranslations();
  const items = filteredInterviews(interviews);
  const isMobile = useIsMobile();

  const displayedItems = items.map((item) => ({
    href: `/${locale}/work/${item.uid}`,
    ...item,
  }));

  const itemCount = displayedItems.length;
  const setWidth = itemCount * STEP; // width of one full set of items

  if (itemCount === 0) return null;

  if (isMobile) {
    return <MobileWorkSection displayedItems={displayedItems} t={t} />;
  }

  // Desktop carousel (with scroll animations)
  return (
    <DesktopWorkSection
      displayedItems={displayedItems}
      itemCount={itemCount}
      setWidth={setWidth}
      t={t}
    />
  );
}

const MOBILE_ITEM_SIZE = 280;
const MOBILE_GAP = 24; // gap-6
const MOBILE_STEP = MOBILE_ITEM_SIZE + MOBILE_GAP;
const MOBILE_COPIES = 10;
const MOBILE_MIDDLE_COPY = 5;

const MobileWorkSection = ({
  displayedItems,
  t,
}: {
  displayedItems: { id: string; href: string; imageUrl: string; alt: string }[];
  t: (key: string) => string;
}) => {
  const itemCount = displayedItems.length;
  const setWidth = itemCount * MOBILE_STEP;

  const repeatedItems = Array.from({ length: MOBILE_COPIES }, (_, copyIdx) =>
    displayedItems.map((item) => ({
      ...item,
      key: `${item.id}-${copyIdx}`,
    })),
  ).flat();

  // Start in the middle copy so there's equal buffer on both sides
  const x = useMotionValue(-MOBILE_MIDDLE_COPY * setWidth);

  const normalizeX = useCallback(
    (val: number) => {
      if (setWidth === 0) return val;
      const mod = ((-val % setWidth) + setWidth) % setWidth;
      return -(mod + MOBILE_MIDDLE_COPY * setWidth);
    },
    [setWidth],
  );

  return (
    <section id="work" className="h-screen overflow-x-clip">
      <div className="h-full flex flex-col items-start justify-center">
        <h2 className="font-posterman font-black text-[48px] leading-12 mb-8 text-center px-4">
          {t("work.title")}
        </h2>
        <div className="w-full overflow-hidden">
          <motion.div
            className="flex gap-6 cursor-grab pl-4 w-max"
            drag="x"
            dragElastic={0}
            dragConstraints={{
              left: -(MOBILE_COPIES - 1) * setWidth,
              right: 0,
            }}
            dragTransition={{
              power: 0.3,
              timeConstant: 250,
              // Snap to the nearest item from wherever the spring lands —
              // no normalization here so the spring never animates backwards
              modifyTarget: (target) =>
                Math.round(target / MOBILE_STEP) * MOBILE_STEP,
            }}
            whileDrag={{ cursor: "grabbing" }}
            style={{ x }}
            onDragTransitionEnd={() => {
              // Silently teleport to the equivalent position in the middle copy
              // range — visually identical since content repeats every setWidth
              x.set(normalizeX(x.get()));
            }}
          >
            {repeatedItems.map((item) => (
              <a
                key={item.key}
                href={item.href}
                className="shrink-0 no-underline"
              >
                <div
                  className="rounded-lg overflow-hidden bg-gray-100"
                  style={{ width: MOBILE_ITEM_SIZE, height: MOBILE_ITEM_SIZE }}
                >
                  <Image
                    src={item.imageUrl}
                    alt={item.alt}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    width={MOBILE_ITEM_SIZE}
                    height={MOBILE_ITEM_SIZE}
                  />
                </div>
              </a>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const DesktopWorkSection = ({
  displayedItems,
  itemCount,
  setWidth,
  t,
}: {
  displayedItems: { id: string; href: string; imageUrl: string; alt: string }[];
  itemCount: number;
  setWidth: number;
  t: (key: string) => string;
}) => {
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
  const { scrollYProgress, scrollY } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  // The difference between actual scroll and a smoothed version gives instant
  // displacement while scrolling, that naturally settles back to 0
  const smoothScrollY = useSpring(scrollY, { damping: 50, stiffness: 200 });
  const scrollDelta = useTransform(
    [scrollY, smoothScrollY],
    ([raw, smooth]: number[]) => raw - smooth,
  );

  // Disable inertia during programmatic scroll (nav clicks)
  useEffect(() => {
    let scrollIdleTimer: ReturnType<typeof setTimeout> | null = null;
    let isProgrammatic = false;

    function syncSpring() {
      if (!isProgrammatic) return;
      smoothScrollY.jump(scrollY.get());
    }

    function onProgrammaticScroll() {
      isProgrammatic = true;
      smoothScrollY.jump(scrollY.get());
      window.addEventListener("scroll", syncSpring, { passive: true });
    }

    function onScrollIdle() {
      if (!isProgrammatic) return;
      if (scrollIdleTimer) clearTimeout(scrollIdleTimer);
      scrollIdleTimer = setTimeout(() => {
        isProgrammatic = false;
        window.removeEventListener("scroll", syncSpring);
      }, 600);
    }

    window.addEventListener("programmatic-scroll", onProgrammaticScroll);
    window.addEventListener("scroll", onScrollIdle, { passive: true });

    return () => {
      window.removeEventListener("programmatic-scroll", onProgrammaticScroll);
      window.removeEventListener("scroll", onScrollIdle);
      window.removeEventListener("scroll", syncSpring);
      if (scrollIdleTimer) clearTimeout(scrollIdleTimer);
    };
  }, [scrollY, smoothScrollY]);

  // Track whether items should be visible based on scroll threshold
  const [isVisible, setIsVisible] = useState(false);

  useMotionValueEvent(scrollYProgress, "change", (progress) => {
    if (progress >= SCROLL_THRESHOLD && !isVisible) {
      setIsVisible(true);
    }
  });

  return (
    <section
      ref={sectionRef}
      id="work"
      className="flex h-screen flex-col items-start justify-center overflow-clip"
    >
      <div ref={wrapperRef}>
        <motion.h2
          className="pl-4 pb-4 font-posterman font-black text-[74px] leading-22 tracking-normal mb-4"
          animate={{ opacity: isVisible ? 1 : undefined }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          {t("work.title")}
        </motion.h2>
        {/* Draggable row */}
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
              isVisible={isVisible}
              scrollDelta={scrollDelta}
            />
          ))}
        </motion.div>
        <div className="flex gap-4 pl-4 pt-6">
          <button
            type="button"
            aria-label={t("work.previous")}
            className="p-2 transition-opacity hover:opacity-50"
            onClick={() => {
              const target = x.get() + STEP * 3;
              motionAnimate(x, target, {
                duration: 1.2,
                ease: [0.4, 0, 0.1, 1],
              }).then(() => x.set(normalizeX(x.get())));
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M20 6L10 16L20 26"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <button
            type="button"
            aria-label={t("work.next")}
            className="p-2 transition-opacity hover:opacity-50"
            onClick={() => {
              const target = x.get() - STEP * 3;
              motionAnimate(x, target, {
                duration: 1.2,
                ease: [0.4, 0, 0.1, 1],
              }).then(() => x.set(normalizeX(x.get())));
            }}
          >
            <svg
              width="32"
              height="32"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 6L22 16L12 26"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
};

const INERTIA_SCALE = 0.06; // how much scroll delta maps to Y per index

const CarouselItem = ({
  item,
  flexIndex,
  x,
  isVisible,
  scrollDelta,
}: {
  item: { id: string; href: string; imageUrl: string; alt: string };
  flexIndex: number;
  x: MotionValue<number>;
  isVisible: boolean;
  scrollDelta: MotionValue<number>;
}) => {
  const [scope, animate] = useAnimate();

  // Compute the visual index (position on screen) to determine stagger delay
  const getVisualIndex = useCallback(() => {
    const screenPos = flexIndex * STEP + x.get();
    return Math.round(screenPos / STEP);
  }, [flexIndex, x]);

  // Direct Y offset from scroll delta — no extra springs, instant response
  const inertiaY = useTransform(scrollDelta, (d) => {
    const vi = getVisualIndex();
    return d * vi * INERTIA_SCALE;
  });

  // Combine entrance Y animation + inertia offset
  const entranceY = useMotionValue(0);

  // Enter animation only — no exit
  useEffect(() => {
    if (!isVisible) return;
    const vi = getVisualIndex();
    const delay = vi * ITEM_STAGGER;
    const entryY = vi * 150;

    entranceY.set(entryY);
    animate(entranceY, 0, {
      duration: ANIM_DURATION_SEC,
      delay,
      ease: [0.0, 0.55, 0.45, 1],
    });
    animate(
      scope.current,
      { opacity: 1 },
      {
        duration: ANIM_DURATION_SEC,
        delay,
        ease: [0.0, 0.55, 0.45, 1],
      },
    );
  }, [isVisible, animate, scope, entranceY, getVisualIndex]);

  const combinedY = useTransform(
    [entranceY, inertiaY],
    ([entry, inertia]: number[]) => entry + inertia,
  );

  return (
    <a href={item.href} className="no-underline">
      <motion.div
        ref={scope}
        data-carousel-item
        className={`shrink-0 rounded-lg overflow-hidden bg-gray-100 ${ITEM_SIZE.className}`}
        style={{ y: combinedY }}
        initial={{ opacity: 0 }}
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
