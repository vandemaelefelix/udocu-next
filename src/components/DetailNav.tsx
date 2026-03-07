"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  motion,
  useMotionValue,
  useMotionValueEvent,
  useScroll,
} from "motion/react";
import { useRef } from "react";
import UdocuLogo from "@/components/UdocuLogo";

interface DetailNavProps {
  backHref: string;
}

const NAV_ITEMS = ["about", "work", "contact", "blog"] as const;

export default function DetailNav({ backHref }: DetailNavProps) {
  const t = useTranslations("nav");
  const { scrollY } = useScroll();
  const headerRef = useRef<HTMLElement>(null);
  const offsetY = useMotionValue(0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    const delta = latest - previous;
    const headerHeight = headerRef.current?.offsetHeight ?? 120;

    if (latest <= 0) {
      // At the top — always fully visible
      offsetY.set(0);
      return;
    }

    // Accumulate offset clamped between -headerHeight and 0
    const next = Math.min(0, Math.max(-headerHeight, offsetY.get() - delta));
    offsetY.set(next);
  });

  return (
    <motion.header
      ref={headerRef}
      className="sticky top-0 z-50 bg-inherit"
      style={{ y: offsetY }}
    >
      {/* Top bar: logo left, nav links right */}
      <nav className="flex items-center justify-between px-8 py-6">
        <Link href="/" aria-label="Home">
          <UdocuLogo className="h-6 w-auto max-w-24 md:h-10 md:max-w-48" />
        </Link>

        <ul className="hidden gap-8 font-helvetica text-xs font-medium uppercase tracking-widest md:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item}>
              <Link
                href={item === "blog" ? `/blog` : `/#${item}`}
                className="transition-opacity hover:opacity-70"
              >
                {t(item)}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Back link below nav */}
      <div className="px-8">
        <Link
          href={backHref}
          className="group inline-flex items-center gap-2 font-helvetica text-[16px] font-medium uppercase leading-5 tracking-widest transition-opacity hover:opacity-70"
        >
          <span
            aria-hidden="true"
            className="inline-block transition-transform duration-200 group-hover:-translate-x-1"
          >
            &larr;
          </span>
          {t("back")}
        </Link>
      </div>
    </motion.header>
  );
}
