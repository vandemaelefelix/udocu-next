/**
 * Menu UX & a11y basics — C1–C4, F1, F2, F4.
 * Overlay behaviors are mobile-only; run assertions accordingly.
 * Requires a running server (webServer in playwright.config.ts).
 */
import { test, expect } from "@playwright/test";
import { goHome, HAMBURGER } from "./helpers";

test("C1/F1 — hamburger toggles overlay and reflects aria-expanded", async ({
  page,
  viewport,
}) => {
  test.skip((viewport?.width ?? 1280) >= 768, "mobile-only");
  await goHome(page);
  const trigger = page.locator(HAMBURGER);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await expect(page.locator('[role="dialog"]')).toBeVisible();
});

test("C2 — Escape closes the overlay", async ({ page, viewport }) => {
  test.skip((viewport?.width ?? 1280) >= 768, "mobile-only");
  await goHome(page);
  const trigger = page.locator(HAMBURGER);
  await trigger.click();
  await expect(trigger).toHaveAttribute("aria-expanded", "true");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  await expect(trigger).toHaveAttribute("aria-expanded", "false");
});

test("C3 — tapping an overlay link closes it and navigates", async ({
  page,
  viewport,
}) => {
  test.skip((viewport?.width ?? 1280) >= 768, "mobile-only");
  await goHome(page);
  await page.locator(HAMBURGER).click();
  await page.waitForTimeout(400);
  await page.locator(`[role="dialog"] a[href="/nl/blog"]`).click();
  await expect(page).toHaveURL(/\/nl\/blog\/?$/);
});

test("C4 — body scroll locks while the overlay is open", async ({
  page,
  viewport,
}) => {
  test.skip((viewport?.width ?? 1280) >= 768, "mobile-only");
  await goHome(page);
  const trigger = page.locator(HAMBURGER);
  await trigger.click();
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe(
    "hidden",
  );
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => document.body.style.overflow)).toBe("");
});

test("F2 — overlay links are not tab-reachable when closed", async ({
  page,
  viewport,
}) => {
  test.skip((viewport?.width ?? 1280) >= 768, "mobile-only");
  await goHome(page);
  const closedTabindex = await page
    .locator(`[role="dialog"] a`)
    .first()
    .getAttribute("tabindex");
  expect(closedTabindex).toBe("-1");
  await page.locator(HAMBURGER).click();
  await page.waitForTimeout(400);
  const openTabindex = await page
    .locator(`[role="dialog"] a`)
    .first()
    .getAttribute("tabindex");
  expect(openTabindex).toBe("0");
});

test("F4 — detail back link is keyboard-operable", async ({ page }) => {
  await page.goto("/nl/about", { waitUntil: "load" });
  await page.waitForSelector("#main-content", { timeout: 15000 });
  const back = page.locator(`a:visible`, { hasText: "Terug" });
  await expect(back).toHaveCount(1);
  await back.focus();
  await expect(back).toBeFocused();
});
