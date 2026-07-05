"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import UdocuLogo from "@/components/UdocuLogo";
import GlitchText from "@/components/GlitchText";
import { useScrollColor } from "@/context/ScrollColorContext";
import { useActiveSection } from "@/hooks/useActiveSection";

const NAV_ITEMS = ["about", "who-am-i", "work", "contact", "blog"] as const;

// Module-scoped so the reference is stable across renders. StickyNav re-renders
// ~60×/sec during scroll (it consumes bgColor/textColor from ScrollColorContext,
// which updates per requestAnimationFrame); a new inline array each render would
// force useActiveSection's IntersectionObserver to disconnect + rebuild every frame.
const SECTION_IDS = ["about", "who-am-i", "work", "contact"] as const;

export default function StickyNav() {
  const t = useTranslations("nav");
  const [menuOpen, setMenuOpen] = useState(false);
  const locale = useLocale();
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
      router.push(`/${locale}#${item}`, { scroll: false });
    },
    [locale, router],
  );

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const item = e.currentTarget.getAttribute("href")?.replace("#", "");
      if (!item) return;
      if (menuOpen) setMenuOpen(false);
      scrollToSection(item);
    },
    [menuOpen, scrollToSection],
  );

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50 h-0">
        <nav
          className="flex items-center justify-between px-8 py-6"
          style={{ color: textColor }}
        >
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
          <ul className="hidden gap-8 font-helvetica text-sm font-medium uppercase tracking-widest md:flex">
            {NAV_ITEMS.map((item) => {
              const label = t(item);
              return item === "blog" ? (
                <li key={item}>
                  <Link
                    href={`/${locale}/blog`}
                    className="focus-visible:opacity-70 focus-visible:outline-none"
                  >
                    <GlitchText>{label}</GlitchText>
                  </Link>
                </li>
              ) : (
                <li key={item}>
                  <a
                    href={`#${item}`}
                    aria-current={item === activeSection ? "true" : undefined}
                    className="focus-visible:opacity-70 focus-visible:outline-none"
                    onClick={(e) => {
                      e.preventDefault();
                      scrollToSection(item);
                    }}
                  >
                    <GlitchText>{label}</GlitchText>
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Mobile hamburger button */}
          <button
            type="button"
            className="relative z-[60] flex h-8 w-8 flex-col items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 rounded md:hidden"
            style={menuOpen ? { color: overlayTextColor } : undefined}
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
            backgroundColor: bgColor,
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
              return item === "blog" ? (
                <li key={item} style={animationStyle}>
                  <Link
                    href={`/${locale}/blog`}
                    tabIndex={menuOpen ? 0 : -1}
                    className="focus-visible:opacity-70 focus-visible:outline-none"
                    onClick={() => setMenuOpen(false)}
                  >
                    <GlitchText>{t(item)}</GlitchText>
                  </Link>
                </li>
              ) : (
                <li key={item} style={animationStyle}>
                  <a
                    href={`#${item}`}
                    tabIndex={menuOpen ? 0 : -1}
                    className="focus-visible:opacity-70 focus-visible:outline-none"
                    onClick={handleNavClick}
                  >
                    <GlitchText>{t(item)}</GlitchText>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </>
  );
}
