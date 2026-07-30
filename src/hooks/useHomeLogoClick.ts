"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { forgetScrollPosition } from "@/lib/scrollMemory";

const HOME_PATH = "/";

/**
 * Click handler for the nav logo, which must always land the visitor on the
 * hero at the top of the home page.
 *
 * Two cases need help beyond a plain `<Link href="/">`:
 *   - Already on the home page: the router treats `/` → `/` as a no-op, so
 *     nothing scrolls. Scroll to the top ourselves and drop any section hash.
 *   - Coming from another page: `ScrollRestoration` would otherwise restore
 *     the home scroll position saved when the visitor left the page, dropping
 *     them back into a section. Forget that position first.
 */
export function useHomeLogoClick() {
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      // Leave open-in-new-tab/window clicks to the browser.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
        return;
      }

      if (pathname !== HOME_PATH) {
        forgetScrollPosition(new URL(HOME_PATH, window.location.origin).href);
        return; // let the Link navigate; Next.js opens a new route at the top
      }

      e.preventDefault();
      // Same signal the section links send, so scroll-driven components treat
      // this as a programmatic scroll rather than user interaction.
      window.dispatchEvent(new Event("programmatic-scroll"));
      window.scrollTo({ top: 0, behavior: "smooth" });

      // Clear a `/#section` hash so a reload (or Back into this entry) starts
      // at the hero too. router.push keeps Next.js's history state intact,
      // which a bare history API call would not.
      if (window.location.hash) {
        router.push(HOME_PATH, { scroll: false });
      }
    },
    [pathname, router],
  );
}
