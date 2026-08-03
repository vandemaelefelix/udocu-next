/**
 * Nav consistency — the site menu must render identically on every screen.
 *
 * Regression guard: the one-pager and the detail pages used to have separate
 * nav components, and the detail one rendered its links a step smaller
 * (text-xs vs the homepage's text-sm). Both now render <SiteNav>, so the
 * computed link typography has to match everywhere.
 *
 * Desktop-only: the link bar is hidden below md (768px); the mobile overlay is
 * covered by menu.spec.ts.
 *
 * Requires a running dev/preview server (BASE_URL env or http://localhost:3000).
 */

import { test, expect } from "@playwright/test";

const SCREENS = ["/", "/blog", "/about", "/who-am-i"] as const;

test("nav links share the same typography on every screen", async ({
  page,
  viewport,
}) => {
  test.skip((viewport?.width ?? 1280) < 768, "desktop link bar only");

  const measured: Array<{ path: string; style: Record<string, string> }> = [];

  for (const path of SCREENS) {
    await page.goto(path, { waitUntil: "load" });
    // Scoped to <nav>, the site menu's only use of that element: the mobile
    // overlay's list is a sibling of it, not a child.
    const link = page.locator("nav ul li a").first();
    await expect(link, `${path} should render the desktop nav`).toBeVisible();
    const style = await link.evaluate((el) => {
      const cs = getComputedStyle(el);
      return {
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        letterSpacing: cs.letterSpacing,
        textTransform: cs.textTransform,
        fontFamily: cs.fontFamily,
      };
    });
    measured.push({ path, style });
  }

  const [baseline, ...rest] = measured;

  // The bug was the detail nav sitting at 12px; the intended size is 14px.
  expect(
    parseFloat(baseline.style.fontSize),
    "nav links should use the larger (text-sm) size",
  ).toBeGreaterThanOrEqual(14);

  for (const entry of rest) {
    expect(
      entry.style,
      `${entry.path} nav typography should match ${baseline.path}`,
    ).toEqual(baseline.style);
  }
});
