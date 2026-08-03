"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import SiteNav from "@/components/SiteNav";
import { useScrollColor } from "@/context/ScrollColorContext";
import { useActiveSection } from "@/hooks/useActiveSection";
import { SECTION_IDS } from "@/config/navigation";

/**
 * The one-pager's nav: floats over the hero, takes its colours from the scroll
 * position, and scrolls to sections instead of navigating. The menu itself is
 * `SiteNav`, shared with the detail pages.
 */
export default function StickyNav() {
  const router = useRouter();
  const { bgColor, textColor } = useScrollColor();
  const activeSection = useActiveSection(SECTION_IDS);

  // On the hero the nav text is green over a Bordeaux background; the menu
  // overlay uses purple text there (matching About) instead of green.
  const overlayTextColor =
    textColor === "rgb(174, 212, 115)" && bgColor === "rgb(62, 2, 2)"
      ? "rgb(180, 150, 214)"
      : textColor;

  const scrollToSection = useCallback(
    (item: string) => {
      window.dispatchEvent(new Event("programmatic-scroll"));
      document
        .querySelector(`#${item}`)
        ?.scrollIntoView({ behavior: "smooth" });
      // Use router.push so Next.js stores its state in the history entry —
      // plain <a href="#section"> creates a null-state entry that Next.js
      // can't restore on Back, leaving the page un-rendered.
      router.push(`/#${item}`, { scroll: false });
    },
    [router],
  );

  return (
    <SiteNav
      layout="floating"
      sectionBehavior="scroll"
      onSectionSelect={scrollToSection}
      activeItem={activeSection}
      barColor={textColor}
      overlayBgColor={bgColor}
      overlayTextColor={overlayTextColor}
    />
  );
}
