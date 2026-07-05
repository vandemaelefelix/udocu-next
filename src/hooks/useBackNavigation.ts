"use client";

import { useEffect, useRef, type MouseEvent } from "react";

/**
 * Shared "back" link behavior for detail pages. Returns a click handler that
 * prefers `history.back()` — restoring the visitor's exact origin scroll via
 * `ScrollRestoration`'s popstate handler — when the visitor arrived on this
 * page via an in-app link click, and otherwise lets the `<a href>` perform
 * its fixed fallback navigation (a section hash / overview page) for deep
 * links, reloads, and keyboard/Enter activation.
 *
 * The "arrived in-app" flag lives in `sessionStorage['udocu_internal_nav']`,
 * set by `ScrollRestoration`'s capture-phase click listener on any same-origin
 * anchor click and cleared once per full document load (also in
 * `ScrollRestoration`). We capture it once on mount into a ref rather than
 * reading it fresh inside the handler: clicking the back link is itself a
 * same-origin anchor click, so the capture-phase listener would set the flag
 * for *this very click* before the handler runs, making every back click look
 * "in-app" even on a deep link.
 *
 * The `null` sentinel guards against React Strict Mode's dev-mode double
 * effect invocation re-running the read unnecessarily.
 */
export function useBackNavigation(): (
  e: MouseEvent<HTMLAnchorElement>,
) => void {
  const arrivedViaInAppNav = useRef<boolean | null>(null);

  useEffect(() => {
    if (arrivedViaInAppNav.current !== null) return;
    arrivedViaInAppNav.current =
      sessionStorage.getItem("udocu_internal_nav") === "1";
  }, []);

  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (typeof window === "undefined") return;
    const cameFromInApp =
      window.history.length > 1 && arrivedViaInAppNav.current;
    if (cameFromInApp) {
      e.preventDefault();
      window.history.back();
    }
    // else: allow the <a href> to navigate (deep-link fallback)
  };
}
