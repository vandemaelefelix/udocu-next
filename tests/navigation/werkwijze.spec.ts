/**
 * Werkwijze page. The "Hoe & Wat" page renders Kurt's supplied copy: a lead
 * paragraph, a note on asking questions, and the 14 numbered points.
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
    page.getByRole("heading", { level: 1, name: "Hoe & Wat" }),
  ).toBeVisible();
});

test("werkwijze: the lead states the price above the numbered points", async ({
  page,
}) => {
  // First paragraph of the article body: the lead, which names the price.
  // Someone scanning for a number should not have to read to the end.
  const lead = page.locator("article p").first();
  await expect(lead).toBeVisible();
  await expect(lead).toContainText("De standaardprijs is 900 euro");

  // Scoped to <article>: that is where NumberedPoints renders its <ol>, so
  // the locator stays specific to the page content rather than any
  // incidental list markup elsewhere on the page.
  const list = page.locator("article ol");
  await expect(list).toBeVisible();
  const leadBox = await lead.boundingBox();
  const listBox = await list.boundingBox();
  expect(leadBox!.y).toBeLessThan(listBox!.y);
});

test("werkwijze: all 14 numbered points are present", async ({ page }) => {
  await expect(page.locator("article ol > li")).toHaveCount(14);
});

test("werkwijze: the key phrases in the points are set in bold", async ({
  page,
}) => {
  // Kurt marks the essential phrase of each point in bold; the copy carries
  // <b> tags that must survive next-intl's rich-text rendering as <strong>.
  const bold = page.locator("article ol > li strong");
  expect(await bold.count()).toBeGreaterThan(10);
  await expect(bold.first()).toBeVisible();
});

test("werkwijze: the back link returns to the homepage", async ({ page }) => {
  const back = visibleBackLink(page);
  await expect(back).toHaveCount(1);
  await back.click();
  await expect(page).toHaveURL(/\/$/);
});
