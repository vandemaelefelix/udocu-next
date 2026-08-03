/**
 * Page background continuity.
 *
 * globals.css paints body a warm near-black, and ThemeColorSync overrides
 * html/body inline but renders only on the one-pager. So a standalone page
 * inherits either that near-black or, after a client-side navigation off the
 * homepage, whichever section colour was last scrolled to. Nothing reveals it
 * until a user overscrolls and the rubber band bleeds the wrong colour, which
 * is why this went unnoticed on the dark pages and only showed up on the
 * blue-teal one.
 *
 * Requires a running dev/preview server (BASE_URL env or http://localhost:3000).
 */

import { test, expect } from "@playwright/test";

const PAGES = ["/werkwijze", "/about", "/who-am-i", "/blog"];

async function backgrounds(page: import("@playwright/test").Page) {
  return page.evaluate(() => {
    const main = document.getElementById("main-content");
    return {
      main: main ? getComputedStyle(main).backgroundColor : null,
      html: getComputedStyle(document.documentElement).backgroundColor,
      body: getComputedStyle(document.body).backgroundColor,
    };
  });
}

for (const path of PAGES) {
  test(`background: ${path} paints html and body its own colour`, async ({
    page,
  }) => {
    await page.goto(path, { waitUntil: "load" });
    await page.waitForSelector("#main-content", { timeout: 15000 });

    await expect
      .poll(async () => {
        const { main, html, body } = await backgrounds(page);
        return main !== null && html === main && body === main;
      })
      .toBe(true);
  });
}

test("background: arriving from a scrolled homepage does not leave a stale colour", async ({
  page,
}) => {
  await page.goto("/", { waitUntil: "load" });
  await page.waitForSelector("#main-content", { timeout: 15000 });

  // Scroll well into the one-pager so ThemeColorSync has written a section
  // colour onto html/body, then leave for a page with a different one.
  await page.evaluate(() =>
    window.scrollTo(0, document.body.scrollHeight * 0.5),
  );
  await page.waitForTimeout(800);

  await page.goto("/werkwijze", { waitUntil: "load" });
  await page.waitForSelector("#main-content", { timeout: 15000 });

  await expect
    .poll(async () => {
      const { main, body } = await backgrounds(page);
      return main !== null && body === main;
    })
    .toBe(true);
});
