/**
 * Werkwijze page. The "Procedure en prijs" page renders Kurt's supplied copy,
 * opens on the price, and lists the 12 numbered points.
 *
 * Requires a running dev/preview server (BASE_URL env or http://localhost:3000).
 */

import { test, expect } from "@playwright/test";
import { visibleBackLink } from "./helpers";

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
  // Scoped to <article>: that is where NumberedPoints renders its <ol>, so
  // the locator stays specific to the page content rather than any
  // incidental list markup elsewhere on the page.
  const list = page.locator("article ol");
  await expect(list).toBeVisible();
  const priceBox = await price.boundingBox();
  const listBox = await list.boundingBox();
  expect(priceBox!.y).toBeLessThan(listBox!.y);
});

test("werkwijze: all 12 numbered points are present", async ({ page }) => {
  await expect(page.locator("article ol > li")).toHaveCount(12);
});

test("werkwijze: the back link returns to the homepage", async ({ page }) => {
  const back = visibleBackLink(page);
  await expect(back).toHaveCount(1);
  await back.click();
  await expect(page).toHaveURL(/\/$/);
});
