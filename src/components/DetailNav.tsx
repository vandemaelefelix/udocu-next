"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import UdocuLogo from "@/components/UdocuLogo";

interface DetailNavProps {
  backHref: string;
  /** Key of the nav item to mark as active (underlined) */
  activeItem?: string;
  /** When true, the back link is shown only on mobile (useful when desktop back link is placed elsewhere) */
  mobileBackOnly?: boolean;
  /** When true, the back link is completely hidden */
  hideBackLink?: boolean;
}

const NAV_ITEMS = ["about", "work", "contact", "blog"] as const;

export default function DetailNav({
  backHref,
  activeItem,
  mobileBackOnly,
  hideBackLink,
}: DetailNavProps) {
  const t = useTranslations("nav");
  const locale = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50">
      {/* Top bar: logo left, nav links right */}
      <nav className="flex items-center justify-between px-8 py-6">
        <Link href="/" aria-label="Home">
          <UdocuLogo className="h-6 w-auto max-w-24 md:h-10 md:max-w-48" />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden gap-8 font-helvetica text-xs font-medium uppercase tracking-widest md:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item}>
              <Link
                href={item === "blog" ? `/blog` : `/#${item}`}
                className={`transition-opacity hover:opacity-70 ${
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
          className="relative z-[60] flex h-8 w-8 flex-col items-center justify-center gap-1.5 md:hidden"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
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
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-current/0 transition-opacity duration-300 md:hidden ${
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        style={{ backgroundColor: "inherit", color: "inherit" }}
      >
        <ul className="flex flex-col items-center gap-10 font-helvetica text-2xl font-medium uppercase tracking-widest">
          {NAV_ITEMS.map((item) => (
            <li key={item}>
              <Link
                href={
                  item === "blog" ? `/${locale}/blog` : `/${locale}/#${item}`
                }
                className="transition-opacity hover:opacity-70"
                onClick={() => setMenuOpen(false)}
              >
                {t(item)}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* Back link below nav */}
      {!hideBackLink && (
        <div
          className={`px-8 ${mobileBackOnly ? "md:hidden" : "hidden md:block"}`}
        >
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
      )}
    </header>
  );
}
