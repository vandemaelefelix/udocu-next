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

  if (saved !== undefined) {
    window.scrollTo({ top: saved, behavior: "instant" });
  } else if (hash) {
    document.querySelector(hash)?.scrollIntoView({ behavior: "instant" });
  }
}

export default function ScrollRestoration() {
  const pathname = usePathname();

  // Save scroll position before any link-driven navigation (capture phase
  // so it runs before the router intercepts the click)
  useEffect(() => {
    function save(e: MouseEvent) {
      const link = (e.target as Element).closest("a");
      if (!link?.href) return;
      writePosition(window.location.href, window.scrollY);
    }
    document.addEventListener("click", save, true);
    return () => document.removeEventListener("click", save, true);
  }, []);

  // Restore on Back/Forward: Next.js App Router doesn't reliably re-render
  // the layout on popstate, so we listen directly instead of relying on
  // usePathname() to catch those navigations.
  useEffect(() => {
    function onPopstate() {
      // Small delay to let React settle after the navigation commit
      setTimeout(restoreScroll, 80);
    }
    window.addEventListener("popstate", onPopstate);
    return () => window.removeEventListener("popstate", onPopstate);
  }, []);

  // Restore on forward (pushState) navigation: usePathname() updates when
  // Next.js navigates forward, which doesn't fire popstate.
  useEffect(() => {
    const timer = setTimeout(restoreScroll, 80);
    return () => clearTimeout(timer);
  }, [pathname]);

  return null;
}
