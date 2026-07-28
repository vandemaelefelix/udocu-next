"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import UdocuLogo from "@/components/UdocuLogo";
import GlitchText from "@/components/GlitchText";
import { useFocusTrap } from "@/hooks/useFocusTrap";

interface DetailNavProps {
  /** Key of the nav item to mark as active (underlined) */
  activeItem?: string;
  /** Explicit background color for the mobile overlay (CSS value or variable). Defaults to red-dark. */
  overlayBgColor?: string;
  /** Explicit text color for the mobile overlay (CSS value or variable). Defaults to red-light. */
  overlayTextColor?: string;
}

// Keep in sync with StickyNav so every screen exposes the same destinations.
const NAV_ITEMS = ["about", "who-am-i", "work", "contact", "blog"] as const;

export default function DetailNav({
  activeItem,
  overlayBgColor = "var(--color-red-dark)",
  overlayTextColor = "var(--color-red-light)",
}: DetailNavProps) {
  const t = useTranslations("nav");
  const [menuOpen, setMenuOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  useFocusTrap(overlayRef, menuOpen);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar: logo left, nav links right */}
      <nav className="flex items-center justify-between px-8 py-6">
        <Link
          href="/"
          aria-label={t("home")}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 rounded"
        >
          <UdocuLogo
            aria-hidden="true"
            className="h-6 w-auto max-w-24 md:h-8 md:max-w-36 lg:h-10 lg:max-w-48"
          />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden gap-6 font-helvetica text-xs font-medium uppercase tracking-widest md:flex lg:gap-8">
          {NAV_ITEMS.map((item) => (
            <li key={item}>
              <Link
                href={item === "blog" ? "/blog" : `/#${item}`}
                className={`transition-opacity hover:opacity-70 focus-visible:opacity-70 focus-visible:outline-none ${
                  item === activeItem ? "underline underline-offset-4" : ""
                }`}
              >
                <GlitchText>{t(item)}</GlitchText>
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile hamburger button */}
        <button
          type="button"
          className="relative z-[60] flex h-8 w-8 flex-col items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 rounded md:hidden"
          onClick={(e) => {
            // WebKit does not focus buttons on click by default, which would
            // make the focus trap capture the wrong element as its trigger.
            e.currentTarget.focus();
            setMenuOpen((prev) => !prev);
          }}
          aria-label={menuOpen ? t("closeMenu") : t("openMenu")}
          aria-expanded={menuOpen}
        >
          <span
            className={`block h-0.5 w-6 bg-current transition-[transform,opacity] duration-300 ${menuOpen ? "translate-y-2 rotate-45" : ""}`}
          />
          <span
            className={`block h-0.5 w-6 bg-current transition-[transform,opacity] duration-300 ${menuOpen ? "opacity-0" : ""}`}
          />
          <span
            className={`block h-0.5 w-6 bg-current transition-[transform,opacity] duration-300 ${menuOpen ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </nav>

      {/* Mobile full-screen overlay */}
      <div
        ref={overlayRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("openMenu")}
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center md:hidden ${
          menuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        style={{
          backgroundColor: overlayBgColor,
          color: overlayTextColor,
          transform: menuOpen ? "translateY(0)" : "translateY(-100%)",
          transition: menuOpen
            ? "transform 300ms cubic-bezier(0.4,0,0.1,1)"
            : "transform 150ms ease-in",
          willChange: menuOpen ? "transform" : "auto",
        }}
      >
        <ul className="flex flex-col items-center gap-10 font-helvetica text-2xl font-medium uppercase tracking-widest">
          {NAV_ITEMS.map((item, index) => {
            const animationStyle = menuOpen
              ? {
                  animation: `menu-link-in 280ms ease-out ${index * 60}ms both`,
                }
              : { animation: "none" };
            return (
              <li key={item} style={animationStyle}>
                <Link
                  href={item === "blog" ? "/blog" : `/#${item}`}
                  tabIndex={menuOpen ? 0 : -1}
                  className={`focus-visible:opacity-70 focus-visible:outline-none ${
                    item === activeItem ? "underline underline-offset-4" : ""
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  <GlitchText>{t(item)}</GlitchText>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </header>
  );
}
