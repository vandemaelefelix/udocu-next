"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";

const SECTIONS = ["about", "who-am-i", "work", "contact"] as const;
type Section = (typeof SECTIONS)[number];

export function HomepageSectionTracker() {
  const posthog = usePostHog();

  useEffect(() => {
    const seen = new Set<Section>();

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const section = entry.target.id as Section;
          if (entry.isIntersecting && !seen.has(section)) {
            seen.add(section);
            posthog.capture("section_reached", { section });
          }
        }
      },
      { threshold: 0.2 },
    );

    for (const id of SECTIONS) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [posthog]);

  return null;
}
