"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import ArrowLink from "@/components/ArrowLink";

interface DetailBackLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/**
 * Standalone "back" link for use directly inside a Server Component (e.g.
 * the work detail page's desktop-only back link, which lives outside
 * `DetailNav`). A Server Component can't pass a click handler as a prop, so
 * this tiny client wrapper owns the same history-back-with-fallback logic
 * that `DetailNav` implements inline for its own back link.
 *
 * Prefers `history.back()` (restoring the visitor's exact scroll position)
 * when they arrived via an in-app link click; falls back to the fixed
 * `href` (a section hash) on a deep link, where there's no in-app history
 * to go back to. See `DetailNav`'s `handleBack` for the reference
 * implementation and rationale (in particular why the "arrived in-app" flag
 * must be captured once on mount rather than re-read inside the handler).
 */
export default function DetailBackLink({
  href,
  children,
  className,
}: DetailBackLinkProps) {
  // Deliberately never cleared: this page can mount more than one back
  // link at once (this component alongside `DetailNav`'s own mobile-only
  // link, one always CSS-hidden but both still mounted) — a "read once,
  // then clear" flag would race between them, with whichever mounts first
  // winning and the other reading it back empty. See `DetailNav` for the
  // full rationale.
  //
  // `null` sentinel guards against React Strict Mode's dev-mode double
  // effect invocation re-running this unnecessarily (harmless since the
  // read itself has no side effect, but avoids doing it twice).
  const arrivedViaInAppNav = useRef<boolean | null>(null);
  useEffect(() => {
    if (arrivedViaInAppNav.current !== null) return;
    arrivedViaInAppNav.current =
      sessionStorage.getItem("udocu_internal_nav") === "1";
  }, []);

  const handleBack = (e: MouseEvent<HTMLAnchorElement>) => {
    if (typeof window === "undefined") return;
    const cameFromInApp =
      window.history.length > 1 && arrivedViaInAppNav.current;
    if (cameFromInApp) {
      e.preventDefault();
      window.history.back();
    }
    // else: allow the <a href={href}> to navigate (deep-link fallback)
  };

  return (
    <ArrowLink
      href={href}
      direction="back"
      onClick={handleBack}
      className={className}
    >
      {children}
    </ArrowLink>
  );
}
