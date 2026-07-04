/**
 * Shared test helpers for the navigation Playwright specs.
 *
 * Single source of truth for constants and utilities reused across
 * navigation.spec.ts, menu.spec.ts, and later navigation-related specs.
 */

import { type Page, type Locator } from "@playwright/test";

export const LOCALE = "nl";
export const HOME = `/${LOCALE}`;
export const BACK_LABEL = "Terug"; // nav.back (nl)
export const SECTIONS = ["about", "who-am-i", "work", "contact"] as const;

/** Selector for the mobile hamburger trigger (excludes the Next.js dev tools button). */
export const HAMBURGER =
  "button[aria-expanded]:not([data-nextjs-dev-tools-button])";

/** Navigate to the one-pager and wait for hydration. */
export async function goHome(page: Page): Promise<void> {
  await page.goto(HOME, { waitUntil: "load" });
  await page.waitForSelector('[data-testid="scroll-bg"]', { timeout: 15000 });
  await page.waitForTimeout(1500);
}

/** Navigate to a detail/overview page and wait for hydration. */
export async function gotoPage(page: Page, path: string): Promise<void> {
  await page.goto(path, { waitUntil: "load" });
  await page.waitForSelector("#main-content", { timeout: 15000 });
  await page.waitForTimeout(800);
}

/** The single visible back link on a detail page (label "Terug"). */
export function visibleBackLink(page: Page): Locator {
  return page.locator(`a:visible`, { hasText: BACK_LABEL });
}

/** Whether the section with `id` vertically straddles the viewport centre. */
export async function sectionCoversViewportCentre(
  page: Page,
  id: string,
): Promise<{ ok: boolean; detail: string }> {
  return page.evaluate((sectionId) => {
    const el = document.getElementById(sectionId);
    if (!el) return { ok: false, detail: `#${sectionId} not found` };
    const rect = el.getBoundingClientRect();
    const mid = window.innerHeight / 2;
    const ok = rect.top <= mid && rect.bottom >= mid;
    return {
      ok,
      detail: `#${sectionId} top=${Math.round(rect.top)} bottom=${Math.round(
        rect.bottom,
      )} viewportMid=${Math.round(mid)} scrollY=${Math.round(window.scrollY)}`,
    };
  }, id);
}

/** First on-page href matching a prefix (e.g. "/nl/work/"). */
export async function firstHref(
  page: Page,
  prefix: string,
): Promise<string | null> {
  return page.evaluate((p) => {
    const a = Array.from(
      document.querySelectorAll<HTMLAnchorElement>("a"),
    ).find((el) => new URL(el.href, location.origin).pathname.startsWith(p));
    return a ? new URL(a.href, location.origin).pathname : null;
  }, prefix);
}

/** Scroll a section to the viewport centre (as a user reading it would). */
export async function revealSection(page: Page, id: string): Promise<void> {
  await page.evaluate((sectionId) => {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ block: "center", behavior: "instant" });
  }, id);
  await page.waitForTimeout(900);
}
