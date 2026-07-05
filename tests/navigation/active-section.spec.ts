/**
 * E1 — detail/blog nav underlines the matching item.
 * E2 — one-pager nav marks the section at the viewport centre as active.
 * Scroll-spy is a desktop nav affordance (no persistent nav bar on mobile).
 */
import { test, expect } from "@playwright/test";
import { goHome, revealSection, HOME } from "./helpers";

test("E2 — one-pager nav marks the centred section active (desktop)", async ({
  page,
  viewport,
}) => {
  test.skip((viewport?.width ?? 0) < 768, "scroll-spy is a desktop affordance");
  await goHome(page);
  await revealSection(page, "work");
  await expect(
    page.locator(`nav a[href="#work"][aria-current="true"]`),
  ).toBeVisible();
  await expect(
    page.locator(`nav a[href="#work"][aria-current="true"]`),
  ).toHaveClass(/underline/);
  await expect(
    page.locator(`nav a[href="#about"][aria-current="true"]`),
  ).toHaveCount(0);
});

test("E1 — blog overview underlines the blog nav item (desktop)", async ({
  page,
  viewport,
}) => {
  test.skip((viewport?.width ?? 0) < 768, "desktop nav check");
  await page.goto(`${HOME}/blog`, { waitUntil: "load" });
  await page.waitForSelector("#main-content", { timeout: 15000 });
  const blog = page.locator(`nav a[href="${HOME}/blog"]`).first();
  await expect(blog).toHaveClass(/underline/);
});
