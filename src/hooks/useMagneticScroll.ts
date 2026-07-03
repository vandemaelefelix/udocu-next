"use client";

import { useEffect } from "react";

interface MagneticScrollOptions {
  /** Max distance (px) from a section edge to trigger snap. Default: 150 */
  threshold?: number;
  /** Scroll animation duration in ms. Default: 800 */
  duration?: number;
  /** Idle time (ms) after scroll stops before snapping. Default: 150 */
  debounce?: number;
}

export function useMagneticScroll({
  threshold = 150,
  duration = 800,
  debounce = 150,
}: MagneticScrollOptions = {}) {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let rafId: number | null = null;
    let isSnapping = false;
    // Wait before activating so the browser can restore scroll position on
    // Back navigation without being immediately overridden by the snap logic.
    let ready = false;
    const activationTimer = setTimeout(() => {
      ready = true;
    }, 600);

    function easeInOutCubic(t: number): number {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function cancelSnap() {
      isSnapping = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }

    function smoothScrollTo(targetY: number) {
      const startY = window.scrollY;
      const diff = targetY - startY;
      if (Math.abs(diff) < 1) return;

      isSnapping = true;
      const start = performance.now();

      function step(now: number) {
        // Bail out if snap was cancelled mid-animation
        if (!isSnapping) {
          rafId = null;
          return;
        }

        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeInOutCubic(progress);

        window.scrollTo(0, startY + diff * eased);

        if (progress < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          isSnapping = false;
          rafId = null;
        }
      }

      rafId = requestAnimationFrame(step);
    }

    function onScroll() {
      if (!ready || isSnapping) return;
      if (timer) clearTimeout(timer);

      timer = setTimeout(() => {
        // Don't snap if a cancel happened between the timeout being set
        // and it firing
        if (isSnapping) return;

        const sections = document.querySelectorAll("section");
        const scrollY = window.scrollY;
        const vh = window.innerHeight;
        let closestDistance = Infinity;
        let snapTarget: number | null = null;

        sections.forEach((section) => {
          if (section.id === "work") return;
          const rect = section.getBoundingClientRect();
          const sectionTop = scrollY + rect.top;
          const sectionHeight = rect.height;

          // Target scroll position: center the section in the viewport,
          // but clamp so we never scroll above the section top
          const idealScroll =
            sectionHeight <= vh
              ? sectionTop - (vh - sectionHeight) / 2
              : sectionTop;

          const distance = Math.abs(scrollY - idealScroll);

          if (
            distance < threshold &&
            distance > 1 &&
            distance < closestDistance
          ) {
            closestDistance = distance;
            snapTarget = idealScroll;
          }
        });

        if (snapTarget !== null) {
          smoothScrollTo(snapTarget);
        }
      }, debounce);
    }

    // Cancel snap on user-initiated scroll (wheel/touch)
    function onUserScroll() {
      if (isSnapping) {
        cancelSnap();
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onUserScroll, { passive: true });
    window.addEventListener("touchstart", onUserScroll, { passive: true });

    return () => {
      clearTimeout(activationTimer);
      cancelSnap();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onUserScroll);
      window.removeEventListener("touchstart", onUserScroll);
    };
  }, [threshold, duration, debounce]);
}
