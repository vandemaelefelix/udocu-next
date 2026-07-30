"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import UdocuLogo from "@/components/UdocuLogo";
import GlitchText from "@/components/GlitchText";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import { useHomeLogoClick } from "@/hooks/useHomeLogoClick";
import { NAV_ITEMS, PAGE_HREFS } from "@/config/navigation";

/**
 * The site menu: top bar (logo + desktop links + hamburger) and the mobile
 * full-screen overlay.
 *
 * One component for every screen. The one-pager and the detail pages used to
 * have their own copies, which silently drifted apart (the detail nav rendered
 * its links a step smaller than the homepage's), so the link typography, the
 * overlay behaviour and the destination list all live here now. Callers only
 * supply what genuinely differs: positioning, colours, and what a section link
 * does.
 */

/**
 * Link typography. Kept in constants next to each other so the desktop bar
 * cannot end up a different size on one screen than another.
 */
const DESKTOP_LIST_CLASS =
  "hidden gap-6 font-helvetica text-sm font-medium uppercase tracking-widest md:flex lg:gap-8";
const OVERLAY_LIST_CLASS =
  "flex flex-col items-center gap-10 font-helvetica text-2xl font-medium uppercase tracking-widest";

interface SiteNavProps {
  /**
   * Positioning of the top bar. "floating" overlays it on the hero without
   * taking layout space (the one-pager); "sticky" keeps it in flow and pinned
   * to the top (detail pages).
   */
  layout: "floating" | "sticky";
  /**
   * What a homepage-section entry does. "scroll" stays on the page and hands
   * the item to `onSectionSelect`; "navigate" links to `/#<section>`.
   */
  sectionBehavior: "scroll" | "navigate";
  /** Called with the section id when `sectionBehavior` is "scroll". */
  onSectionSelect?: (item: string) => void;
  /** Nav item to mark as the current location (underlined). */
  activeItem?: string | null;
  /** Colour of the bar contents. Omit to inherit from the page. */
  barColor?: string;
  /** Background of the mobile overlay (CSS value or variable). */
  overlayBgColor: string;
  /** Text colour of the mobile overlay (CSS value or variable). */
  overlayTextColor: string;
}

export default function SiteNav({
  layout,
  sectionBehavior,
  onSectionSelect,
  activeItem,
  barColor,
  overlayBgColor,
  overlayTextColor,
}: SiteNavProps) {
  const t = useTranslations("nav");
  const [menuOpen, setMenuOpen] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  useFocusTrap(overlayRef, menuOpen);
  const handleLogoClick = useHomeLogoClick();

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

  const handleSectionClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      const item = e.currentTarget.getAttribute("href")?.replace("#", "");
      if (!item) return;
      setMenuOpen(false);
      onSectionSelect?.(item);
    },
    [onSectionSelect],
  );

  /** One menu entry, shared by the desktop bar and the mobile overlay. */
  const renderItem = (item: (typeof NAV_ITEMS)[number], inOverlay: boolean) => {
    const pageHref = PAGE_HREFS[item];
    const activeClass =
      item === activeItem ? "underline underline-offset-4" : "";
    const className = `transition-opacity hover:opacity-70 focus-visible:opacity-70 focus-visible:outline-none ${activeClass}`;
    // Overlay links stay out of the tab order while the overlay is hidden.
    const tabIndex = inOverlay ? (menuOpen ? 0 : -1) : undefined;
    const label = <GlitchText>{t(item)}</GlitchText>;

    if (pageHref) {
      return (
        <Link
          href={pageHref}
          tabIndex={tabIndex}
          className={className}
          onClick={() => setMenuOpen(false)}
        >
          {label}
        </Link>
      );
    }

    // Section entries: on the one-pager they scroll in place (bare "#id" so the
    // browser never navigates); elsewhere they link back to the homepage.
    return sectionBehavior === "scroll" ? (
      <a
        href={`#${item}`}
        tabIndex={tabIndex}
        aria-current={item === activeItem ? "true" : undefined}
        className={className}
        onClick={handleSectionClick}
      >
        {label}
      </a>
    ) : (
      <Link
        href={`/#${item}`}
        tabIndex={tabIndex}
        className={className}
        onClick={() => setMenuOpen(false)}
      >
        {label}
      </Link>
    );
  };

  return (
    <header
      className={
        layout === "floating"
          ? "fixed top-0 left-0 right-0 z-50 h-0"
          : "sticky top-0 z-50"
      }
    >
      {/* Top bar: logo left, nav right */}
      <nav
        className="flex items-center justify-between px-8 py-6"
        style={barColor ? { color: barColor } : undefined}
      >
        <Link
          href="/"
          aria-label={t("home")}
          onClick={handleLogoClick}
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 rounded"
        >
          <UdocuLogo
            aria-hidden="true"
            className="h-6 w-auto max-w-24 md:h-8 md:max-w-36 lg:h-10 lg:max-w-48"
          />
        </Link>

        {/* Desktop nav */}
        <ul className={DESKTOP_LIST_CLASS}>
          {NAV_ITEMS.map((item) => (
            <li key={item}>{renderItem(item, false)}</li>
          ))}
        </ul>

        {/* Mobile hamburger button */}
        <button
          type="button"
          className="relative z-[60] flex h-8 w-8 flex-col items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 rounded md:hidden"
          // While open, the button sits on top of the overlay, so it has to take
          // the overlay's colour rather than the bar's.
          style={menuOpen ? { color: overlayTextColor } : undefined}
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
        <ul className={OVERLAY_LIST_CLASS}>
          {NAV_ITEMS.map((item, index) => (
            <li
              key={item}
              style={
                menuOpen
                  ? {
                      animation: `menu-link-in 280ms ease-out ${index * 60}ms both`,
                    }
                  : { animation: "none" }
              }
            >
              {renderItem(item, true)}
            </li>
          ))}
        </ul>
      </div>
    </header>
  );
}
