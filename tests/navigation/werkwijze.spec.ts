/**
 * Werkwijze page — the "Procedure en prijs" page renders Kurt's supplied copy,
 * opens on the price, and lists the 12 numbered points.
 *
 * Requires a running dev/preview server (BASE_URL env or http://localhost:3000).
 */

import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/werkwijze", { waitUntil: "load" });
  await page.waitForSelector("#main-content", { timeout: 15000 });
});

test("werkwijze: page renders with its title", async ({ page }) => {
  await expect(
    page.getByRole("heading", { level: 1, name: "Procedure en prijs" }),
  ).toBeVisible();
});

test("werkwijze: the price is stated above the numbered points", async ({
  page,
}) => {
  const price = page.getByText("De standaardprijs is 900 euro");
  await expect(price).toBeVisible();

  // The price block must precede the list, which is the whole point of the
  // page: someone scanning for a number should not have to read to the end.
  // Scoped to <article>: the nav renders its own <ul> higher up the DOM, so
  // an unscoped list locator would match the menu instead of the points.
  const priceBox = await price.boundingBox();
  const listBox = await page.locator("article ol").boundingBox();
  expect(priceBox!.y).toBeLessThan(listBox!.y);
});

test("werkwijze: all 12 numbered points are present", async ({ page }) => {
  await expect(page.locator("article ol > li")).toHaveCount(12);
});

test("werkwijze: the back link returns to the homepage", async ({ page }) => {
  await page.locator('a[href="/"]').first().click();
  await expect(page).toHaveURL(/\/$/);
});
