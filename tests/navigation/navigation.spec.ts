/**
 * Navigation — acceptance criteria
 *
 * The site is a one-pager (`/nl`) with sections: about, who-am-i, work, contact.
 *   AC1  The one-pager renders all four sections (correct ids).
 *   AC2  A link/item inside a section navigates to its detail page:
 *          about read-more   → /nl/about
 *          who-am-i read-more→ /nl/who-am-i
 *          work item         → /nl/work/<uid>
 *   AC3  Each detail page has a VISIBLE back button that returns to the
 *        specific originating section (href targets the hash AND clicking it
 *        lands on the one-pager with that section in view).
 *   AC4  The blog page is only reachable through the site menu/nav — it is not
 *        linked from any section body of the one-pager.
 *   AC5  Each blog post has a VISIBLE back button that returns to the blog
 *        overview (/nl/blog).
 *
 * Runs on both navigation-desktop and navigation-mobile projects, because the
 * back button and menu render differently per breakpoint.
 *
 * Requires a running dev/preview server (BASE_URL env or http://localhost:3000).
 */

import { test, expect, type Page, type Locator } from "@playwright/test";

const LOCALE = "nl";
const HOME = `/${LOCALE}`;
const BACK_LABEL = "Terug"; // nav.back (nl)
const SECTIONS = ["about", "who-am-i", "work", "contact"] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Navigate to the one-pager and wait for hydration. */
async function goHome(page: Page) {
  await page.goto(HOME, { waitUntil: "load" });
  await page.waitForSelector('[data-testid="scroll-bg"]', { timeout: 15000 });
  await page.waitForTimeout(1500);
}

/** Navigate to a detail/overview page and wait for hydration. */
async function gotoPage(page: Page, path: string) {
  await page.goto(path, { waitUntil: "load" });
  await page.waitForSelector("#main-content", { timeout: 15000 });
  await page.waitForTimeout(800);
}

/** The single visible back link on a detail page (label "Terug"). */
function visibleBackLink(page: Page): Locator {
  return page.locator(`a:visible`, { hasText: BACK_LABEL });
}

/** Whether the section with `id` vertically straddles the viewport centre. */
async function sectionCoversViewportCentre(
  page: Page,
  id: string,
): Promise<{ ok: boolean; detail: string }> {
  return page.evaluate((sectionId) => {
    const el = document.getElementById(sectionId);
    if (!el) return { ok: false, detail: `#${sectionId} not found` };
    const rect = el.getBoundingClientRect();
    const mid = window.innerHeight / 2;
    const ok = rect.top <= mid && rect.bottom >= mid;
    return {
      ok,
      detail: `#${sectionId} top=${Math.round(rect.top)} bottom=${Math.round(
        rect.bottom,
      )} viewportMid=${Math.round(mid)} scrollY=${Math.round(window.scrollY)}`,
    };
  }, id);
}

/** First on-page href matching a prefix (e.g. "/nl/work/"). */
async function firstHref(page: Page, prefix: string): Promise<string | null> {
  return page.evaluate((p) => {
    const a = Array.from(
      document.querySelectorAll<HTMLAnchorElement>("a"),
    ).find((el) => new URL(el.href, location.origin).pathname.startsWith(p));
    return a ? new URL(a.href, location.origin).pathname : null;
  }, prefix);
}

/** Scroll a section to the viewport centre (as a user reading it would). */
async function revealSection(page: Page, id: string) {
  await page.evaluate((sectionId) => {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ block: "center", behavior: "instant" });
  }, id);
  await page.waitForTimeout(900);
}

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
    await page
      .locator("button[aria-expanded]:not([data-nextjs-dev-tools-button])")
      .click();
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
