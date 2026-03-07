"use client";

import { useCallback, useEffect, useRef } from "react";
import { useScrollColor } from "@/context/ScrollColorContext";

interface ColorStop {
  bg: [number, number, number];
  text: [number, number, number];
}

// Color used when the viewport is over the hero section (before ScrollBackground)
const HERO_STOP: ColorStop = {
  bg: [62, 2, 2], // same bg as first section (used for mobile overlay)
  text: [174, 212, 115], // green-light
};

const COLOR_STOPS: ColorStop[] = [
  { bg: [62, 2, 2], text: [196, 181, 253] }, // About: red-dark / red-light
  { bg: [104, 97, 33], text: [174, 212, 115] }, // WhoAmI: green-dark / green-light
  { bg: [45, 95, 99], text: [197, 232, 230] }, // Work: blue-dark / blue-light
  { bg: [92, 40, 0], text: [218, 85, 28] }, // Contact: contact-bg / orange-light
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

export default function ScrollBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { bgColor, textColor, setColors } = useScrollColor();

  const onScroll = useCallback(() => {
    const el = ref.current;
    if (!el) return;

    const sections = el.querySelectorAll<HTMLElement>(
      ":scope > section, :scope > * > section",
    );
    const sectionCount = sections.length;

    // If only one section (or none), stay on the first color stop
    if (sectionCount <= 1) {
      setColors(
        rgbToString(...COLOR_STOPS[0].bg),
        rgbToString(...COLOR_STOPS[0].text),
      );
      return;
    }

    const wrapperTop = el.getBoundingClientRect().top;
    const viewportMiddle = window.innerHeight / 2;

    // While the viewport is still over the hero (before ScrollBackground),
    // interpolate from hero colors to the first section using the same smooth-step.
    if (wrapperTop > 0) {
      const heroProgress = Math.min(1, window.scrollY / window.innerHeight);
      const compressed = Math.max(0, Math.min(1, (heroProgress - 0.65) / 0.25));
      const smooth = compressed * compressed * (3 - 2 * compressed);
      const bg = interpolateColor(HERO_STOP.bg, COLOR_STOPS[0].bg, smooth);
      const text = interpolateColor(
        HERO_STOP.text,
        COLOR_STOPS[0].text,
        smooth,
      );
      setColors(rgbToString(...bg), rgbToString(...text));
      return;
    }

    // Build transition boundaries for each section.
    // For each section we compute the anchor point used for color interpolation.
    // By default this is the section's midpoint. For WhoAmI (index 1) we place
    // the anchor so the color is fully resolved BEFORE its top reaches the
    // viewport top. The section sits inside a -75vh margin wrapper, so its DOM
    // top is already pulled up. We set the anchor well before that top edge
    // so the compressed smooth-step finishes in time.
    const transitionTargets: number[] = [];
    sections.forEach((section, i) => {
      const rect = section.getBoundingClientRect();
      if (i === 1) {
        // The section top in wrapper-space (already accounts for -75vh margin).
        // We add half a viewport so the compressed smooth-step (which fires in
        // the last 35% of the zone) finishes right as the section top reaches
        // the viewport top.
        const sectionTopInWrapper = rect.top - wrapperTop;
        transitionTargets.push(sectionTopInWrapper + viewportMiddle);
      } else {
        const midY = rect.top - wrapperTop + rect.height / 2;
        transitionTargets.push(midY);
      }
    });

    // Current scroll position within the wrapper (where viewport middle sits)
    const scrollPos = viewportMiddle - wrapperTop;

    // Clamp to available color stops
    const maxIndex = Math.min(sectionCount, COLOR_STOPS.length);

    // Find which two sections we're between
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

    // Compress the transition into a narrow band around the boundary
    // so the color change happens faster instead of spanning the full distance
    const compressed = Math.max(0, Math.min(1, (t - 0.65) / 0.25));
    // Smooth-step for a natural ease
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

    setColors(rgbToString(...bg), rgbToString(...text));
  }, [setColors]);

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
    <div
      ref={ref}
      className="relative"
      style={{ backgroundColor: bgColor, color: textColor }}
    >
      {children}
    </div>
  );
}
