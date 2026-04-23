"use client";

import { useState, useCallback } from "react";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import UdocuLogo from "@/components/UdocuLogo";
import { useScrollColor } from "@/context/ScrollColorContext";

const NAV_ITEMS = ["about", "who-am-i", "work", "contact", "blog"] as const;

export default function StickyNav() {
  const t = useTranslations("nav");
  const [menuOpen, setMenuOpen] = useState(false);
  const locale = useLocale();
  const { bgColor, textColor } = useScrollColor();

  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (!menuOpen) return;
      e.preventDefault();
      setMenuOpen(false);
      const href = e.currentTarget.getAttribute("href");
      if (href) {
        const target = document.querySelector(href);
        window.dispatchEvent(new Event("programmatic-scroll"));
        target?.scrollIntoView({ behavior: "smooth" });
      }
    },
    [menuOpen],
  );

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-0">
      <nav
        className="flex items-center justify-between px-8 py-6"
        style={{ color: textColor }}
      >
        <Link href={`/${locale}`} aria-label={t("home")}>
          <UdocuLogo className="h-6 w-auto max-w-24 md:h-10 md:max-w-48" />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden gap-8 font-helvetica text-xs font-medium uppercase tracking-widest md:flex">
          {NAV_ITEMS.map((item) =>
            item === "blog" ? (
              <li key={item}>
                <Link
                  href={`/${locale}/blog`}
                  className="transition-opacity hover:opacity-70"
                >
                  {t(item)}
                </Link>
              </li>
            ) : (
              <li key={item}>
                <a
                  href={`#${item}`}
                  className="transition-opacity hover:opacity-70"
                  onClick={() =>
                    window.dispatchEvent(new Event("programmatic-scroll"))
                  }
                >
                  {t(item)}
                </a>
              </li>
            ),
          )}
        </ul>

        {/* Mobile hamburger button */}
        <button
          type="button"
          className="relative z-[60] flex h-8 w-8 flex-col items-center justify-center gap-1.5 md:hidden"
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
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-300 md:hidden ${
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        style={{ backgroundColor: bgColor, color: textColor }}
      >
        <ul className="flex flex-col items-center gap-10 font-helvetica text-2xl font-medium uppercase tracking-widest">
          {NAV_ITEMS.map((item) =>
            item === "blog" ? (
              <li key={item}>
                <Link
                  href={`/${locale}/blog`}
                  className="transition-opacity hover:opacity-70"
                  onClick={() => setMenuOpen(false)}
                >
                  {t(item)}
                </Link>
              </li>
            ) : (
              <li key={item}>
                <a
                  href={`#${item}`}
                  className="transition-opacity hover:opacity-70"
                  onClick={handleNavClick}
                >
                  {t(item)}
                </a>
              </li>
            ),
          )}
        </ul>
      </div>
    </div>
  );
}
