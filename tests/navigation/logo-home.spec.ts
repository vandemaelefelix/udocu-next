/**
 * Navigation — the nav logo always returns to the top of the home page.
 *
 *   L1  On the home page, scrolled down into a section, clicking the logo
 *       scrolls back to the hero (scrollY ≈ 0) and drops any section hash.
 *   L2  From another page (reached from a scrolled home page), clicking the
 *       logo lands on the home page at the hero, not at the previously saved
 *       scroll position.
 */

import { test, expect, type Page } from "@playwright/test";
import { HOME, HAMBURGER, goHome, revealSection } from "./helpers";

/** The nav logo link (aria-label "Home"). */
function logoLink(page: Page) {
  return page.locator('nav a[aria-label="Home"]').first();
}

test("L1 — logo click on the home page scrolls back to the hero", async ({
  page,
}) => {
  await goHome(page);
  await revealSection(page, "work");
  const scrolled = await page.evaluate(() => window.scrollY);
  expect(scrolled, "should be scrolled away from the hero").toBeGreaterThan(
    200,
  );

  await logoLink(page).click();
  await page.waitForTimeout(1800); // smooth scroll settle

  const scrollY = await page.evaluate(() => window.scrollY);
  expect(
    scrollY,
    `expected to be back at the hero, scrollY=${scrollY}`,
  ).toBeLessThan(5);
  expect(new URL(page.url()).hash, "hash should be cleared").toBe("");
});

test("L1b — logo click clears an existing section hash", async ({ page }) => {
  await goHome(page);
  const sectionLink = page.locator('a[href="#about"]').first();
  // Desktop shows the nav list inline; on mobile it lives behind the hamburger,
  // so drive the scroll directly there instead of opening the menu.
  if (await sectionLink.isVisible()) {
    await sectionLink.click();
  } else {
    await revealSection(page, "about");
    await page.evaluate(() => history.pushState(null, "", "/#about"));
  }
  await page.waitForTimeout(1500);
  expect(new URL(page.url()).hash).toBe("#about");

  await logoLink(page).click();
  await page.waitForTimeout(1800);

  expect(new URL(page.url()).hash).toBe("");
  const scrollY = await page.evaluate(() => window.scrollY);
  expect(scrollY, `expected the hero, scrollY=${scrollY}`).toBeLessThan(5);
});

test("L2 — logo click from the blog lands on the home hero, not the saved scroll", async ({
  page,
  viewport,
}) => {
  await goHome(page);
  await revealSection(page, "work");
  const originScrollY = await page.evaluate(() => window.scrollY);
  expect(originScrollY).toBeGreaterThan(200);

  // The desktop nav list appears at lg; below that the blog link lives behind
  // the hamburger overlay.
  if ((viewport?.width ?? 1280) < 1024) {
    await page.locator(HAMBURGER).click();
    await page.waitForTimeout(400);
  }
  await page.locator(`a[href="${HOME}/blog"]:visible`).first().click();
  await expect(page).toHaveURL(/\/blog\/?$/);
  await page.waitForTimeout(800);

  await logoLink(page).click();
  await expect(page).toHaveURL(/\/$/);
  await page.waitForTimeout(1800);

  const scrollY = await page.evaluate(() => window.scrollY);
  expect(
    scrollY,
    `expected the hero (was ${originScrollY} on home before leaving), scrollY=${scrollY}`,
  ).toBeLessThan(5);
});
