"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const STORAGE_KEY = "udocu_scroll";

function readPositions(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function writePosition(url: string, y: number) {
  try {
    const positions = readPositions();
    positions[url] = y;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {}
}

function restoreScroll() {
  const { hash } = window.location;
  const url = window.location.href;
  const saved = readPositions()[url];

  if (saved === undefined && !hash) return;

  // If the page hasn't rendered yet (docH ≈ viewport), retry every 50ms
  // until content loads or we give up after 1 second.
  function attempt(retriesLeft: number) {
    const ready =
      document.documentElement.scrollHeight > window.innerHeight + 100;

    if (!ready && retriesLeft > 0) {
      setTimeout(() => attempt(retriesLeft - 1), 50);
      return;
    }

    if (saved !== undefined) {
      window.scrollTo({ top: saved, behavior: "instant" });
    } else if (hash) {
      document.querySelector(hash)?.scrollIntoView({ behavior: "instant" });
    }
  }

  attempt(20); // up to 20 × 50ms = 1 000ms
}

export default function ScrollRestoration() {
  const pathname = usePathname();

  // Clear the in-app-nav flag once per FULL document load. This component is
  // mounted in the root layout, which the App Router does NOT remount across
  // client-side navigations, so this []-effect runs exactly once per real
  // document load (deep link / reload) — never on client transitions. That
  // makes `udocu_internal_nav` mean "an in-app navigation happened since the
  // last full document load": on a deep link or reload it starts unset, so a
  // detail page's back button uses its fixed-hash fallback; once the visitor
  // clicks an in-app link the flag is set and survives the client navigation
  // into the detail page, where the back button then uses history.back().
  useEffect(() => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem("udocu_internal_nav");
  }, []);

  // Save scroll position before any link-driven navigation (capture phase
  // so it runs before the router intercepts the click)
  useEffect(() => {
    function save(e: MouseEvent) {
      const link = (e.target as Element).closest("a");
      if (!link?.href) return;
      writePosition(window.location.href, window.scrollY);

      try {
        const url = new URL(link.href, window.location.origin);
        if (url.origin === window.location.origin) {
          sessionStorage.setItem("udocu_internal_nav", "1");
        }
      } catch {}
    }
    document.addEventListener("click", save, true);
    return () => document.removeEventListener("click", save, true);
  }, []);

  // Restore on Back/Forward: Next.js App Router doesn't reliably re-render
  // the layout on popstate, so we listen directly instead of relying on
  // usePathname() to catch those navigations.
  useEffect(() => {
    function onPopstate() {
      restoreScroll();
    }
    window.addEventListener("popstate", onPopstate);
    return () => window.removeEventListener("popstate", onPopstate);
  }, []);

  // Restore on forward (pushState) navigation: usePathname() updates when
  // Next.js navigates forward, which doesn't fire popstate.
  useEffect(() => {
    restoreScroll();
  }, [pathname]);

  return null;
}
