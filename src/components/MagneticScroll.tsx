"use client";

import { useMagneticScroll } from "@/hooks/useMagneticScroll";

export default function MagneticScroll() {
  useMagneticScroll({
    threshold: 150, // px from section edge to trigger
    duration: 800, // animation duration in ms
    debounce: 150, // idle time before snapping
  });

  return null;
}
