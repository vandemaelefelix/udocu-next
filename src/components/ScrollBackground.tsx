"use client";

import { useCallback, useEffect, useRef } from "react";
import { useScrollColor } from "@/context/ScrollColorContext";

interface ColorStop {
  bg: [number, number, number];
  text: [number, number, number];
}

interface SectionLayout {
  top: number;
  height: number;
}

// Hero bg is Bordeaux (never green) so body/html overscroll and theme-color
// stay Bordeaux; the hero div itself is hidden behind the video. Text is green.
const HERO_STOP: ColorStop = {
  bg: [62, 2, 2],
  text: [174, 212, 115],
};

const COLOR_STOPS: ColorStop[] = [
  { bg: [62, 2, 2], text: [180, 150, 214] },
  { bg: [104, 97, 33], text: [174, 212, 115] },
  { bg: [45, 95, 99], text: [197, 232, 230] },
  { bg: [92, 40, 0], text: [218, 85, 28] },
];

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function rgbToString(r: number, g: number, b: number): string {
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

function interpolateColor(
  c1: [number, number, number],
  c2: [number, number, number],
  t: number,
): [number, number, number] {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}

function measureSections(el: HTMLElement): {
  wrapperOffsetTop: number;
  sections: SectionLayout[];
} {
  const wrapperRect = el.getBoundingClientRect();
  const wrapperOffsetTop = wrapperRect.top + window.scrollY;
  const sectionEls = el.querySelectorAll<HTMLElement>(
    ":scope > section, :scope > * > section",
  );
  const sections: SectionLayout[] = [];
  sectionEls.forEach((section) => {
    const rect = section.getBoundingClientRect();
    sections.push({
      top: rect.top + window.scrollY - wrapperOffsetTop,
      height: rect.height,
    });
  });
  return { wrapperOffsetTop, sections };
}

export default function ScrollBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { bgColor, textColor, setColors } = useScrollColor();
  const cacheRef = useRef<{
    wrapperOffsetTop: number;
    sections: SectionLayout[];
  } | null>(null);

  const recalculate = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    cacheRef.current = measureSections(el);
  }, []);

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    if (!cacheRef.current) {
      cacheRef.current = measureSections(el);
    }

    const { wrapperOffsetTop, sections } = cacheRef.current;
    const sectionCount = sections.length;

    if (sectionCount <= 1) {
      setColors(
        rgbToString(...COLOR_STOPS[0].bg),
        rgbToString(...COLOR_STOPS[0].text),
        rgbToString(...COLOR_STOPS[0].bg),
      );
      return;
    }

    const scrollY = window.scrollY;
    const viewportMiddle = window.innerHeight / 2;
    const wrapperTop = wrapperOffsetTop - scrollY;

    if (wrapperTop > 0) {
      // Hero zone: bgColor stays Bordeaux (hidden under video); chrome is olive.
      setColors(
        rgbToString(...HERO_STOP.bg),
        rgbToString(...HERO_STOP.text),
        "#686121",
      );
      return;
    }

    const transitionTargets: number[] = [];
    sections.forEach((section, i) => {
      if (i === 1) {
        transitionTargets.push(section.top + viewportMiddle);
      } else {
        transitionTargets.push(section.top + section.height / 2);
      }
    });

    const scrollPos = viewportMiddle - wrapperTop;

    const maxIndex = Math.min(sectionCount, COLOR_STOPS.length);

    let index = 0;
    let t = 0;

    if (scrollPos <= transitionTargets[0]) {
      index = 0;
      t = 0;
    } else if (scrollPos >= transitionTargets[maxIndex - 1]) {
      index = maxIndex - 2;
      t = 1;
    } else {
      for (let i = 0; i < maxIndex - 1; i++) {
        if (
          scrollPos >= transitionTargets[i] &&
          scrollPos < transitionTargets[i + 1]
        ) {
          index = i;
          t =
            (scrollPos - transitionTargets[i]) /
            (transitionTargets[i + 1] - transitionTargets[i]);
          break;
        }
      }
    }

    const compressed = Math.max(0, Math.min(1, (t - 0.65) / 0.25));
    const smooth = compressed * compressed * (3 - 2 * compressed);

    const bg = interpolateColor(
      COLOR_STOPS[index].bg,
      COLOR_STOPS[index + 1].bg,
      smooth,
    );
    const text = interpolateColor(
      COLOR_STOPS[index].text,
      COLOR_STOPS[index + 1].text,
      smooth,
    );

    // For all non-hero zones the chrome colour equals the section background.
    setColors(rgbToString(...bg), rgbToString(...text), rgbToString(...bg));
  }, [setColors]);

  useEffect(() => {
    let rafId: number;

    function handleScroll() {
      rafId = requestAnimationFrame(onScroll);
    }

    recalculate();

    const observer = new ResizeObserver(() => {
      recalculate();
    });

    const el = ref.current;
    if (el) {
      observer.observe(el);
      const sectionEls = el.querySelectorAll<HTMLElement>(
        ":scope > section, :scope > * > section",
      );
      sectionEls.forEach((section) => observer.observe(section));
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", recalculate);
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", recalculate);
      observer.disconnect();
      cancelAnimationFrame(rafId);
    };
  }, [onScroll, recalculate]);

  return (
    <div
      ref={ref}
      data-testid="scroll-bg"
      className="relative"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {children}
    </div>
  );
}
