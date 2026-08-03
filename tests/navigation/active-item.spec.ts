/**
 * Active state on standalone pages.
 *
 * The one-pager's scroll-spy is covered by active-section.spec.ts. This file
 * covers the other half: when a visitor is on a page rather than a homepage
 * section, that page's menu item must be marked as current, in both the
 * desktop row and the mobile overlay.
 *
 * Requires a running dev/preview server (BASE_URL env or http://localhost:3000).
 */

import { test, expect } from "@playwright/test";
import { DESKTOP_NAV_MIN_WIDTH, HAMBURGER } from "./helpers";

/** Every page that renders DetailNav, and the nav key it should mark current. */
const PAGES: Array<{ path: string; activeKey: string }> = [
  { path: "/about", activeKey: "about" },
  { path: "/who-am-i", activeKey: "who-am-i" },
  { path: "/werkwijze", activeKey: "werkwijze" },
  { path: "/blog", activeKey: "blog" },
];

for (const { path, activeKey } of PAGES) {
  test(`active item: ${path} marks "${activeKey}" as current`, async ({
    page,
    viewport,
  }) => {
    const isMobile = (viewport?.width ?? 1280) < DESKTOP_NAV_MIN_WIDTH;

    await page.goto(path, { waitUntil: "load" });
    await page.waitForSelector("#main-content", { timeout: 15000 });

    if (isMobile) await page.locator(HAMBURGER).click();

    // Exactly one link is current, and it is the one for this page.
    const current = page.locator('a[aria-current="page"]:visible');
    await expect(current).toHaveCount(1);

    // It must also be visually distinguished, not just semantically. The
    // underline is the only visual cue, so assert it directly.
    await expect(current).toHaveClass(/underline/);
  });
}

test("active item: the homepage marks no menu item as the current page", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "load" });
  await page.waitForSelector("#main-content", { timeout: 15000 });

  // The one-pager uses aria-current="true" for the scrolled-to section, never
  // "page", because no menu destination is a separate page you are on.
  await expect(page.locator('a[aria-current="page"]')).toHaveCount(0);
});
