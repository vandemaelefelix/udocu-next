"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import UdocuLogo from "@/components/UdocuLogo";
import ArrowLink from "@/components/ArrowLink";

interface DetailNavProps {
  backHref: string;
  /** Key of the nav item to mark as active (underlined) */
  activeItem?: string;
  /** When true, the back link is shown only on mobile (useful when desktop back link is placed elsewhere) */
  mobileBackOnly?: boolean;
  /** When true, the back link is completely hidden */
  hideBackLink?: boolean;
  /** Explicit background color for the mobile overlay (CSS value or variable). Defaults to red-dark. */
  overlayBgColor?: string;
  /** Explicit text color for the mobile overlay (CSS value or variable). Defaults to red-light. */
  overlayTextColor?: string;
}

const NAV_ITEMS = ["about", "work", "contact", "blog"] as const;

export default function DetailNav({
  backHref,
  activeItem,
  mobileBackOnly,
  hideBackLink,
  overlayBgColor = "var(--color-red-dark)",
  overlayTextColor = "var(--color-red-light)",
}: DetailNavProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);

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
          href={`/${locale}`}
          aria-label={t("home")}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 rounded"
        >
          <UdocuLogo
            aria-hidden="true"
            className="h-6 w-auto max-w-24 md:h-10 md:max-w-48"
          />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden gap-8 font-helvetica text-xs font-medium uppercase tracking-widest md:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item}>
              <Link
                href={
                  item === "blog" ? `/${locale}/blog` : `/${locale}/#${item}`
                }
                className={`transition-opacity hover:opacity-70 focus-visible:opacity-70 focus-visible:outline-none ${
                  item === activeItem ? "underline underline-offset-4" : ""
                }`}
              >
                {t(item)}
              </Link>
            </li>
          ))}
        </ul>

        {/* Mobile hamburger button */}
        <button
          type="button"
          className="relative z-[60] flex h-8 w-8 flex-col items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 rounded md:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
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
        <ul className="mobile-nav-links flex flex-col items-center gap-10 font-helvetica text-2xl font-medium uppercase tracking-widest">
          {NAV_ITEMS.map((item, index) => {
            const animationStyle = menuOpen
              ? {
                  animation: `menu-link-in 280ms ease-out ${index * 60}ms both`,
                }
              : { animation: "none" };
            return (
              <li key={item} style={animationStyle}>
                <Link
                  href={
                    item === "blog" ? `/${locale}/blog` : `/${locale}/#${item}`
                  }
                  tabIndex={menuOpen ? 0 : -1}
                  className={`focus-visible:opacity-70 focus-visible:outline-none ${
                    item === activeItem ? "underline underline-offset-4" : ""
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {t(item)}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Back link below nav */}
      {!hideBackLink && (
        <div
          className={`px-8 ${mobileBackOnly ? "md:hidden" : "hidden md:block"}`}
        >
          <ArrowLink
            href={backHref}
            direction="back"
            className="font-helvetica text-[16px] font-medium uppercase leading-5 tracking-widest transition-opacity hover:opacity-70 focus-visible:opacity-70 focus-visible:outline-none"
          >
            {t("back")}
          </ArrowLink>
        </div>
      )}
    </header>
  );
}
