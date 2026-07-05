/**
 * E1 — detail/blog nav underlines the matching item.
 * E2 — one-pager nav marks the section at the viewport centre as active:
 *      desktop → the persistent nav bar; mobile → the open hamburger overlay
 *      (mobile has no persistent bar, so the current section is highlighted
 *      when the menu is opened).
 */
import { test, expect } from "@playwright/test";
import { goHome, revealSection, HOME, HAMBURGER } from "./helpers";

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

test("E2 (mobile) — open hamburger overlay highlights the current section", async ({
  page,
  viewport,
}) => {
  test.skip(
    (viewport?.width ?? 1280) >= 768,
    "mobile overlay affordance (desktop uses the persistent nav bar)",
  );
  await goHome(page);
  await revealSection(page, "work");
  // Open the hamburger; body scroll is locked so the pre-open active section
  // (the one that was at the viewport centre) is what should be highlighted.
  await page.locator(HAMBURGER).click();
  await page.waitForTimeout(500);

  const activeLink = page.locator(`[role="dialog"] a[href="#work"]`);
  await expect(activeLink).toHaveAttribute("aria-current", "true");
  await expect(activeLink).toHaveClass(/underline/);
  await expect(
    page.locator(`[role="dialog"] a[href="#about"][aria-current="true"]`),
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
