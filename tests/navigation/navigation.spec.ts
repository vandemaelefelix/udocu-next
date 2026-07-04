/**
 * Navigation — acceptance criteria
 *
 * See docs/superpowers/specs/2026-07-04-navigation-acceptance-criteria-design.md
 * for the full AC list. This file encodes:
 *   A1  The one-pager renders all four sections (correct ids): about,
 *       who-am-i, work, contact.
 *   A2  A link/item inside a section navigates to its detail page:
 *         about read-more   → /nl/about
 *         who-am-i read-more→ /nl/who-am-i
 *         work item         → /nl/work/<uid>
 *   B3  The blog page is only reachable through the site menu/nav — it is not
 *       linked from any section body of the one-pager.
 *   D1  Clicking a section link (menu or in-page) scrolls that section into
 *       view — after the scroll settles, the target section straddles the
 *       viewport centre.
 *   D3  Each blog post has a VISIBLE back button that returns to the blog
 *       overview (/nl/blog).
 *
 * The legacy "AC3" tests below (fixed-destination back button on
 * about/who-am-i/work detail pages) are superseded by D2, which Task 4
 * rewrites — left as-is for now. The "AC4b" test (blog reachable via the
 * menu) is exercised more thoroughly per-screen/per-breakpoint by B1/B2 in
 * menu.spec.ts and is kept here only as a quick smoke check.
 *
 * Runs on both navigation-webkit-desktop and navigation-webkit projects,
 * because the back button and menu render differently per breakpoint.
 *
 * Requires a running dev/preview server (BASE_URL env or http://localhost:3000).
 */

import { test, expect } from "@playwright/test";
import {
  LOCALE,
  HOME,
  SECTIONS,
  HAMBURGER,
  goHome,
  gotoPage,
  visibleBackLink,
  sectionCoversViewportCentre,
  firstHref,
  revealSection,
} from "./helpers";

// ---------------------------------------------------------------------------
// AC1 — one-pager sections
// ---------------------------------------------------------------------------

test("AC1 — one-pager renders about/who-am-i/work/contact sections", async ({
  page,
}) => {
  await goHome(page);
  for (const id of SECTIONS) {
    await expect(page.locator(`#${id}`), `#${id} should exist`).toHaveCount(1);
  }
});

// ---------------------------------------------------------------------------
// AC2 — section link → detail page
// ---------------------------------------------------------------------------

test("AC2a — About read-more navigates to /nl/about", async ({ page }) => {
  await goHome(page);
  await revealSection(page, "about");
  const link = page.locator(`#about a[href="${HOME}/about"]:visible`).first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(new RegExp(`/${LOCALE}/about/?$`));
});

test("AC2b — Who Am I read-more navigates to /nl/who-am-i", async ({
  page,
}) => {
  await goHome(page);
  await revealSection(page, "who-am-i");
  const link = page
    .locator(`#who-am-i a[href="${HOME}/who-am-i"]:visible`)
    .first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(new RegExp(`/${LOCALE}/who-am-i/?$`));
});

test("AC2c — Work item navigates to /nl/work/<uid>", async ({ page }) => {
  await goHome(page);
  await revealSection(page, "work");
  // The carousel repeats items; the duplicates are aria-hidden. Click a real
  // (canonical), on-screen item.
  const link = page
    .locator(`#work a[href^="${HOME}/work/"]:visible:not([aria-hidden="true"])`)
    .first();
  await expect(link).toBeVisible();
  await link.click();
  await expect(page).toHaveURL(new RegExp(`/${LOCALE}/work/[^/]+/?$`));
});

// ---------------------------------------------------------------------------
// AC3 — detail back button returns to the specific section
// ---------------------------------------------------------------------------

for (const { path, section, label } of [
  { path: `${HOME}/about`, section: "about", label: "About" },
  { path: `${HOME}/who-am-i`, section: "who-am-i", label: "Who Am I" },
] as const) {
  test(`AC3 — ${label} detail has a visible back button to #${section}`, async ({
    page,
  }) => {
    await gotoPage(page, path);

    const back = visibleBackLink(page);
    await expect(
      back,
      `${label} detail must show a visible back button`,
    ).toHaveCount(1);

    const href = await back.getAttribute("href");
    expect(href, `back href should target #${section}`).toMatch(
      new RegExp(`/${LOCALE}#${section}$`),
    );

    await back.click();
    await expect(page).toHaveURL(new RegExp(`/${LOCALE}(#${section})?$`));
    await page.waitForTimeout(1800); // allow smooth/magnetic scroll to settle
    const res = await sectionCoversViewportCentre(page, section);
    expect(res.ok, `after back, ${res.detail}`).toBe(true);
  });
}

test("AC3 — Work detail has a visible back button to #work", async ({
  page,
}) => {
  await goHome(page);
  const workPath = await firstHref(page, `${HOME}/work/`);
  expect(workPath, "expected at least one work item on the one-pager").not.toBe(
    null,
  );

  await gotoPage(page, workPath!);

  const back = visibleBackLink(page);
  await expect(back, "Work detail must show a visible back button").toHaveCount(
    1,
  );

  const href = await back.getAttribute("href");
  expect(href, "back href should target #work").toMatch(
    new RegExp(`/${LOCALE}#work$`),
  );

  await back.click();
  await expect(page).toHaveURL(new RegExp(`/${LOCALE}(#work)?$`));
  await page.waitForTimeout(1800);
  const res = await sectionCoversViewportCentre(page, "work");
  expect(res.ok, `after back, ${res.detail}`).toBe(true);
});

// ---------------------------------------------------------------------------
// AC4 — blog only via the menu, never from section bodies
// ---------------------------------------------------------------------------

test("AC4a — no section body on the one-pager links to the blog", async ({
  page,
}) => {
  await goHome(page);
  for (const id of SECTIONS) {
    const blogLinksInSection = await page
      .locator(`#${id} a[href$="/blog"]`)
      .count();
    expect(
      blogLinksInSection,
      `#${id} section body should not link to the blog`,
    ).toBe(0);
  }
});

test("AC4b — blog is reachable via the site menu/nav", async ({
  page,
  viewport,
}) => {
  await goHome(page);
  const isMobile = (viewport?.width ?? 1280) < 768;

  if (isMobile) {
    // Open the hamburger overlay first.
    await page.locator(HAMBURGER).click();
    await page.waitForTimeout(400);
  }

  const blogLink = page.locator(`a[href="${HOME}/blog"]:visible`).first();
  await expect(blogLink).toBeVisible();
  await blogLink.click();
  await expect(page).toHaveURL(new RegExp(`/${LOCALE}/blog/?$`));
});

// ---------------------------------------------------------------------------
// AC5 — blog post back button → blog overview
// ---------------------------------------------------------------------------

test("AC5 — blog post has a visible back button to the blog overview", async ({
  page,
}) => {
  await gotoPage(page, `${HOME}/blog`);

  const postPath = await firstHref(page, `${HOME}/blog/`);
  test.skip(postPath === null, "no blog posts published to test against");

  await gotoPage(page, postPath!);

  const back = visibleBackLink(page);
  await expect(back, "Blog post must show a visible back button").toHaveCount(
    1,
  );

  const href = await back.getAttribute("href");
  expect(href, "back href should target the blog overview").toMatch(
    new RegExp(`/${LOCALE}/blog/?$`),
  );

  await back.click();
  await expect(page).toHaveURL(new RegExp(`/${LOCALE}/blog/?$`));
});

// ---------------------------------------------------------------------------
// D1 — clicking a section menu link scrolls it into view
// ---------------------------------------------------------------------------

test("D1 — clicking the 'work' menu link scrolls #work to the viewport centre", async ({
  page,
  viewport,
}) => {
  await goHome(page);
  const isMobile = (viewport?.width ?? 1280) < 768;
  if (isMobile) {
    await page.locator(HAMBURGER).click();
    await page.waitForTimeout(400);
  }
  const link = page.locator(`a[href="#work"]:visible`).first();
  await expect(link).toBeVisible();
  await link.click();
  await page.waitForTimeout(1500); // smooth scroll settle
  const res = await sectionCoversViewportCentre(page, "work");
  expect(res.ok, `after click, ${res.detail}`).toBe(true);
});
