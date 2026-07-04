/**
 * Menu — every menu item is present, visible and clickable on every screen
 * (one-pager, a detail page, the blog overview) on both mobile and desktop.
 *
 * The one-pager uses <StickyNav>; detail pages and the blog use <DetailNav>.
 * Both must expose the same destinations: Home (logo), about, who-am-i, work,
 * contact, blog.
 *
 * Requires a running dev/preview server (BASE_URL env or http://localhost:3000).
 */

import { test, expect, type Page, type Locator } from "@playwright/test";
import { LOCALE, HAMBURGER } from "./helpers";

type NavKind = "sticky" | "detail";

const SCREENS: Array<{ name: string; path: string; nav: NavKind }> = [
  { name: "home (StickyNav)", path: `/${LOCALE}`, nav: "sticky" },
  { name: "about detail (DetailNav)", path: `/${LOCALE}/about`, nav: "detail" },
  { name: "blog overview (DetailNav)", path: `/${LOCALE}/blog`, nav: "detail" },
];

// Every destination the menu must offer, in nav order.
const ITEMS = ["home", "about", "who-am-i", "work", "contact", "blog"] as const;
type Item = (typeof ITEMS)[number];

/** The href a given item renders with, per nav component. */
function itemHref(nav: NavKind, key: Item): string {
  if (key === "home") return `/${LOCALE}`;
  if (key === "blog") return `/${LOCALE}/blog`;
  // Section links: StickyNav uses bare "#about"; DetailNav uses "/nl#about".
  return nav === "sticky" ? `#${key}` : `/${LOCALE}#${key}`;
}

/** URL expected after clicking the item. */
function expectedUrl(key: Item): RegExp {
  if (key === "home") return new RegExp(`/${LOCALE}$`);
  if (key === "blog") return new RegExp(`/${LOCALE}/blog/?$`);
  return new RegExp(`/${LOCALE}#${key}$`);
}

async function loadScreen(page: Page, path: string) {
  await page.goto(path, { waitUntil: "load" });
  await page.waitForSelector("#main-content, [data-testid='scroll-bg']", {
    timeout: 15000,
  });
  await page.waitForTimeout(1000);
}

/** Open the hamburger overlay (mobile only). */
async function openMobileMenu(page: Page) {
  await page.locator(HAMBURGER).click();
  await page.waitForTimeout(400);
}

/** First visible element matching a locator. */
async function firstVisible(loc: Locator): Promise<Locator | null> {
  const n = await loc.count();
  for (let i = 0; i < n; i++) {
    if (await loc.nth(i).isVisible()) return loc.nth(i);
  }
  return null;
}

for (const screen of SCREENS) {
  for (const key of ITEMS) {
    test(`menu: "${key}" is clickable on ${screen.name}`, async ({
      page,
      viewport,
    }) => {
      const isMobile = (viewport?.width ?? 1280) < 768;
      await loadScreen(page, screen.path);

      // The logo (home) lives in the top bar; every other item lives in the
      // menu, which on mobile must be opened first.
      if (isMobile && key !== "home") {
        await openMobileMenu(page);
      }

      const href = itemHref(screen.nav, key);
      const link = await firstVisible(page.locator(`a[href="${href}"]`));
      expect(
        link,
        `"${key}" menu item (href="${href}") should be visible on ${screen.name} (${
          isMobile ? "mobile" : "desktop"
        })`,
      ).not.toBe(null);

      await link!.click();
      await expect(page).toHaveURL(expectedUrl(key));
    });
  }
}
