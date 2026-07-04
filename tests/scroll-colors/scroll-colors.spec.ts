/**
 * Scroll Colour System — TC1–TC17
 *
 * Requires a running dev/preview server (BASE_URL env or http://localhost:3000).
 * TC18–TC20 are manual iOS Safari checks; they are not covered here.
 */

import { test, expect, type Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Colour constants (rgb strings as the browser normalises them)
// ---------------------------------------------------------------------------

const GREEN = "rgb(174, 212, 115)"; // #aed473  — text only, never a background

// Section backgrounds
const BG_BORDEAUX = "rgb(62, 2, 2)"; // #3e0202  — About + hero ScrollBackground
const BG_OLIVE = "rgb(104, 97, 33)"; // #686121  — Who Am I
const BG_TEAL = "rgb(45, 95, 99)"; // #2d5f63  — Work
const BG_BROWN = "rgb(92, 40, 0)"; // #5c2800  — Contact

// Section text colours
const TEXT_PURPLE = "rgb(180, 150, 214)"; // #b496d6  — About + hero overlay
const TEXT_GREEN = "rgb(174, 212, 115)"; // #aed473  — Who Am I
const TEXT_LIGHT_TEAL = "rgb(197, 232, 230)"; // #c5e8e6  — Work
const TEXT_ORANGE = "rgb(218, 85, 28)"; // #da551c  — Contact

// Chrome colours (body/html bg + theme-color meta)
const CHROME_HERO = "rgb(104, 97, 33)"; // #686121  — olive
const CHROME_ABOUT = BG_BORDEAUX;
const CHROME_WHOAMI = BG_OLIVE;
const CHROME_WORK = BG_TEAL;
const CHROME_CONTACT = BG_BROWN;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Wait for the scroll event → RAF callback → React setState → DOM paint cycle
 * to complete.
 *
 * WebKit dispatches scroll events asynchronously and its RAF rate can be
 * slower than Chromium.  A flat 600 ms delay (measured in the test-runner's
 * timer, not the page's) gives the page's event loop enough time to process
 * the scroll, fire onScroll → setColors → React render → ThemeColorSync
 * useEffect, without blocking any of those steps.
 */
async function waitForColorUpdate(page: Page) {
  await page.waitForTimeout(600);
}

/** Navigate to the home page and wait for React hydration + ThemeColorSync. */
async function goHome(page: Page) {
  await page.goto("/nl", { waitUntil: "load" });
  // Wait for the scroll-bg div — confirms React hydration is done.
  await page.waitForSelector('[data-testid="scroll-bg"]', { timeout: 15000 });
  // Give ThemeColorSync's useEffect time to fire and set body.style.backgroundColor.
  // Using a flat wait instead of waitForFunction because WebKit's CDP polling
  // mechanism (used internally by waitForFunction) stalls indefinitely in
  // headless mode, causing every test to hit the 60 s test-level timeout.
  await page.waitForTimeout(2500);
}

/** Scroll to a section center and wait for the colour update. */
async function scrollToSection(page: Page, id: string) {
  await page.evaluate((sectionId) => {
    const el = document.getElementById(sectionId);
    el?.scrollIntoView({ block: "center", behavior: "instant" });
  }, id);
  await waitForColorUpdate(page);
}

/**
 * Scroll to a position that guarantees pure section colour for the given colour
 * index (0=About, 1=WhoAmI, 2=Work, 3=Contact).
 *
 * Uses a two-pass approach:
 *   Pass 1 — scroll near the section so lazy images load and the section
 *             reaches its final rendered height.
 *   Pass 2 — recompute transitionTargets with the now-accurate heights,
 *             then scroll to targets[idx]+ε which is the start of the pure
 *             colour zone (t=0, smooth=0 → pure COLOR_STOPS[idx]).
 */
async function scrollToPureSectionColor(page: Page, colorIndex: number) {
  const sectionId = ["about", "who-am-i", "work", "contact"][colorIndex];

  // Pass 1 — bring the section into view so all content/images render.
  await page.evaluate((id) => {
    document.getElementById(id)?.scrollIntoView({
      block: "start",
      behavior: "instant",
    });
  }, sectionId);
  await waitForColorUpdate(page);
  // Extra settle time for lazy images to load and resize the section.
  await page.waitForTimeout(800);

  // Pass 2 — recompute with accurate heights, then navigate to pure-colour zone.
  function computeScrollY(idx: number): number {
    const bgEl = document.querySelector<HTMLElement>(
      '[data-testid="scroll-bg"]',
    );
    if (!bgEl) return 0;
    const wrapperOffsetTop = bgEl.getBoundingClientRect().top + window.scrollY;
    const viewportMiddle = window.innerHeight / 2;
    const sectionEls = Array.from(
      bgEl.querySelectorAll<HTMLElement>(
        ":scope > section, :scope > * > section",
      ),
    );
    const layouts = sectionEls.map((el) => ({
      top: el.getBoundingClientRect().top + window.scrollY - wrapperOffsetTop,
      height: el.offsetHeight,
    }));
    const targets = layouts.map((s, i) =>
      i === 1 ? s.top + viewportMiddle : s.top + s.height / 2,
    );

    let scrollPos: number;
    if (idx === 0) {
      scrollPos = targets[0] - 10;
    } else if (idx >= targets.length) {
      scrollPos = (targets[targets.length - 1] ?? 0) + 50;
    } else {
      scrollPos = targets[idx] + 10;
    }
    return Math.max(
      0,
      Math.floor(scrollPos + wrapperOffsetTop - viewportMiddle),
    );
  }

  const scrollY = await page.evaluate(computeScrollY, colorIndex);
  await page.evaluate((y) => window.scrollTo(0, y), scrollY);
  await waitForColorUpdate(page);
}

/** Computed background colour of the ScrollBackground div. */
async function scrollBgColor(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.querySelector<HTMLElement>('[data-testid="scroll-bg"]');
    return el ? window.getComputedStyle(el).backgroundColor : "";
  });
}

/** Inline body background colour (set by ThemeColorSync). */
async function bodyBg(page: Page): Promise<string> {
  return page.evaluate(() => document.body.style.backgroundColor);
}

/** Content attribute of the first meta[name="theme-color"] in <head>. */
async function themeColorContent(page: Page): Promise<string> {
  return page.evaluate(() => {
    const m = document.head.querySelector<HTMLMetaElement>(
      'meta[name="theme-color"]',
    );
    return m ? m.content : "";
  });
}

/** Normalise a hex or rgb colour to rgb(...) for comparison. */
function toRgb(color: string): string {
  if (color.startsWith("#")) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
  }
  return color;
}

// ---------------------------------------------------------------------------
// Tests that run on BOTH desktop and mobile projects
// ---------------------------------------------------------------------------

test("TC1 — body.style.backgroundColor is olive (#686121) at page load", async ({
  page,
}) => {
  await goHome(page);
  const bg = await bodyBg(page);
  expect(toRgb(bg)).toBe(CHROME_HERO);
});

test("TC2 — meta[name=theme-color] content is #686121 at page load", async ({
  page,
}) => {
  await goHome(page);
  const content = await themeColorContent(page);
  expect(toRgb(content)).toBe(CHROME_HERO);
});

test("TC3 — ScrollBackground never shows green at any scroll position", async ({
  page,
}) => {
  await goHome(page);
  const pageHeight = await page.evaluate(() => document.body.scrollHeight);
  const steps = 20;
  for (let i = 0; i <= steps; i++) {
    const y = Math.floor((pageHeight * i) / steps);
    await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
    await waitForColorUpdate(page);
    const bg = await scrollBgColor(page);
    expect(bg, `Green found at scroll position ${y}`).not.toBe(GREEN);
  }
});

test("TC4 — ScrollBackground is Bordeaux when About top enters viewport", async ({
  page,
}) => {
  await goHome(page);
  const { aboutTop, viewportHeight } = await page.evaluate(() => ({
    aboutTop:
      (document.getElementById("about")?.getBoundingClientRect().top ?? 0) +
      window.scrollY,
    viewportHeight: window.innerHeight,
  }));
  // Scroll so About's top edge is just entering the viewport bottom
  const targetY = Math.max(0, aboutTop - viewportHeight + 1);
  await page.evaluate((y) => window.scrollTo(0, y), targetY);
  await waitForColorUpdate(page);
  const bg = await scrollBgColor(page);
  expect(bg).toBe(BG_BORDEAUX);
});

test("TC5 — ScrollBackground matches section colour when section is centred", async ({
  page,
}) => {
  await goHome(page);

  const cases: Array<{ colorIndex: number; label: string; expected: string }> =
    [
      { colorIndex: 0, label: "about", expected: BG_BORDEAUX },
      { colorIndex: 1, label: "who-am-i", expected: BG_OLIVE },
      { colorIndex: 2, label: "work", expected: BG_TEAL },
      { colorIndex: 3, label: "contact", expected: BG_BROWN },
    ];

  for (const { colorIndex, label, expected } of cases) {
    await scrollToPureSectionColor(page, colorIndex);
    const bg = await scrollBgColor(page);
    expect(bg, `Section ${label} background`).toBe(expected);
  }
});

test("TC6 — ScrollBackground colour is a blend inside the transition zone", async ({
  page,
}) => {
  await goHome(page);

  // Replicate the internal transitionTarget logic to find a scroll position
  // that lands at t≈0.775 (midpoint of the smoothstep blend zone t=0.65–0.90).
  const blendScrollY = await page.evaluate(() => {
    const scrollBgEl = document.querySelector<HTMLElement>(
      '[data-testid="scroll-bg"]',
    );
    if (!scrollBgEl) return null;

    const wrapperRect = scrollBgEl.getBoundingClientRect();
    const wrapperOffsetTop = wrapperRect.top + window.scrollY;
    const viewportMiddle = window.innerHeight / 2;

    const sectionEls = Array.from(
      scrollBgEl.querySelectorAll<HTMLElement>(
        ":scope > section, :scope > * > section",
      ),
    );
    if (sectionEls.length < 2) return null;

    const getLayout = (el: HTMLElement) => ({
      top: el.getBoundingClientRect().top + window.scrollY - wrapperOffsetTop,
      height: el.offsetHeight,
    });

    const s0 = getLayout(sectionEls[0]); // About
    const s1 = getLayout(sectionEls[1]); // Who Am I

    // Mirror ScrollBackground.tsx's transitionTargets logic exactly
    const t0 = s0.top + s0.height / 2;
    // i=1 → uses section.top + viewportMiddle (not section center)
    const t1 = s1.top + viewportMiddle;

    if (t1 <= t0) return null; // degenerate layout, skip

    // t=0.775 is in the middle of the blend zone [0.65, 0.90]
    const blendScrollPos = t0 + 0.775 * (t1 - t0);
    // scrollPos = viewportMiddle - (wrapperOffsetTop - scrollY)
    // ⟹ scrollY = scrollPos + wrapperOffsetTop - viewportMiddle
    return Math.max(
      0,
      Math.floor(blendScrollPos + wrapperOffsetTop - viewportMiddle),
    );
  });

  if (blendScrollY === null) {
    test.skip();
    return;
  }

  await page.evaluate((y) => window.scrollTo(0, y), blendScrollY);
  await waitForColorUpdate(page);

  const bg = await scrollBgColor(page);
  // Inside the blend zone the colour must differ from both pure endpoints
  expect(bg).not.toBe(BG_BORDEAUX);
  expect(bg).not.toBe(BG_OLIVE);
});

test("TC7 — body.style.backgroundColor matches chrome colour at each section", async ({
  page,
}) => {
  await goHome(page);

  const cases: Array<{ colorIndex: number; label: string; expected: string }> =
    [
      { colorIndex: 0, label: "about", expected: CHROME_ABOUT },
      { colorIndex: 1, label: "who-am-i", expected: CHROME_WHOAMI },
      { colorIndex: 2, label: "work", expected: CHROME_WORK },
      { colorIndex: 3, label: "contact", expected: CHROME_CONTACT },
    ];

  for (const { colorIndex, label, expected } of cases) {
    await scrollToPureSectionColor(page, colorIndex);
    const bg = await bodyBg(page);
    expect(toRgb(bg), `body bg at section ${label}`).toBe(expected);
  }
});

test("TC8 — meta[name=theme-color] matches chrome colour at each section", async ({
  page,
}) => {
  await goHome(page);

  const cases: Array<{ colorIndex: number; label: string; expected: string }> =
    [
      { colorIndex: 0, label: "about", expected: CHROME_ABOUT },
      { colorIndex: 1, label: "who-am-i", expected: CHROME_WHOAMI },
      { colorIndex: 2, label: "work", expected: CHROME_WORK },
      { colorIndex: 3, label: "contact", expected: CHROME_CONTACT },
    ];

  for (const { colorIndex, label, expected } of cases) {
    await scrollToPureSectionColor(page, colorIndex);
    const content = await themeColorContent(page);
    expect(toRgb(content), `theme-color at section ${label}`).toBe(expected);
  }
});

test("TC9 — meta[name=theme-color] is removed and re-inserted on colour change", async ({
  page,
}) => {
  await goHome(page);

  const result = await page.evaluate(() => {
    return new Promise<{ removed: boolean; inserted: boolean }>(
      (resolve, reject) => {
        let removed = false;
        let inserted = false;

        const observer = new MutationObserver((mutations) => {
          for (const m of mutations) {
            for (const n of Array.from(m.removedNodes)) {
              if (
                n.nodeName === "META" &&
                (n as Element).getAttribute("name") === "theme-color"
              ) {
                removed = true;
              }
            }
            for (const n of Array.from(m.addedNodes)) {
              if (
                n.nodeName === "META" &&
                (n as Element).getAttribute("name") === "theme-color"
              ) {
                inserted = true;
              }
            }
            if (removed && inserted) {
              observer.disconnect();
              resolve({ removed, inserted });
            }
          }
        });

        observer.observe(document.head, { childList: true });

        // Trigger a colour change by scrolling to About
        document.getElementById("about")?.scrollIntoView({
          block: "center",
          behavior: "instant",
        });

        setTimeout(
          () => reject(new Error("No meta tag remove+insert detected")),
          5000,
        );
      },
    );
  });

  expect(result.removed).toBe(true);
  expect(result.inserted).toBe(true);
});

// ---------------------------------------------------------------------------
// Desktop-only: TC10 — sticky nav links follow textColor
// ---------------------------------------------------------------------------

test("TC10 — sticky nav links match textColor from colour map", async ({
  page,
  viewport,
}) => {
  if ((viewport?.width ?? 0) < 768) {
    test.skip();
    return;
  }

  await goHome(page);

  // Helper: computed colour of the first desktop nav link
  const navLinkColor = () =>
    page.evaluate(() => {
      const link = document.querySelector<HTMLElement>(
        "nav ul.\\!flex a, nav ul[class*='md:flex'] a",
      );
      // Fall back to any nav link on desktop
      const anyLink =
        link ??
        document.querySelector<HTMLElement>("nav ul li a:not([href^='/'])");
      return anyLink ? window.getComputedStyle(anyLink).color : "";
    });

  const cases: Array<{ id: string; expected: string }> = [
    { id: "about", expected: TEXT_PURPLE },
    { id: "who-am-i", expected: TEXT_GREEN },
    { id: "work", expected: TEXT_LIGHT_TEAL },
    { id: "contact", expected: TEXT_ORANGE },
  ];

  for (const { id, expected } of cases) {
    await scrollToSection(page, id);
    const color = await navLinkColor();
    expect(color, `nav link color at section ${id}`).toBe(expected);
  }
});

// ---------------------------------------------------------------------------
// Mobile-only: TC11–TC16 — hamburger menu overlay colours
// ---------------------------------------------------------------------------

async function openMenu(page: Page) {
  // Target the hamburger specifically — exclude Next.js dev-tools button
  const btn = page.locator(
    "button[aria-expanded]:not([data-nextjs-dev-tools-button])",
  );
  await btn.click();
  await page.waitForTimeout(400);
}

test("TC11 — hero overlay: bg Bordeaux, text purple", async ({
  page,
  viewport,
}) => {
  if ((viewport?.width ?? 1280) >= 768) {
    test.skip();
    return;
  }

  await goHome(page);
  // At page load we are at the hero position
  await openMenu(page);

  const { bg, color } = await page.evaluate(() => {
    const overlay = document.querySelector<HTMLElement>(
      '[role="dialog"][aria-modal="true"]',
    );
    return overlay
      ? {
          bg: window.getComputedStyle(overlay).backgroundColor,
          color: window.getComputedStyle(overlay).color,
        }
      : { bg: "", color: "" };
  });

  expect(bg).toBe(BG_BORDEAUX);
  expect(color).toBe(TEXT_PURPLE);
});

test("TC12 — About overlay: bg Bordeaux, text purple", async ({
  page,
  viewport,
}) => {
  if ((viewport?.width ?? 1280) >= 768) {
    test.skip();
    return;
  }

  await goHome(page);
  await scrollToSection(page, "about");
  await openMenu(page);

  const { bg, color } = await page.evaluate(() => {
    const overlay = document.querySelector<HTMLElement>(
      '[role="dialog"][aria-modal="true"]',
    );
    return overlay
      ? {
          bg: window.getComputedStyle(overlay).backgroundColor,
          color: window.getComputedStyle(overlay).color,
        }
      : { bg: "", color: "" };
  });

  expect(bg).toBe(BG_BORDEAUX);
  expect(color).toBe(TEXT_PURPLE);
});

test("TC13 — Who Am I overlay: bg olive, text green", async ({
  page,
  viewport,
}) => {
  if ((viewport?.width ?? 1280) >= 768) {
    test.skip();
    return;
  }

  await goHome(page);
  await scrollToSection(page, "who-am-i");
  await openMenu(page);

  const { bg, color } = await page.evaluate(() => {
    const overlay = document.querySelector<HTMLElement>(
      '[role="dialog"][aria-modal="true"]',
    );
    return overlay
      ? {
          bg: window.getComputedStyle(overlay).backgroundColor,
          color: window.getComputedStyle(overlay).color,
        }
      : { bg: "", color: "" };
  });

  expect(bg).toBe(BG_OLIVE);
  expect(color).toBe(TEXT_GREEN);
});

test("TC14 — Work overlay: bg teal, text light teal", async ({
  page,
  viewport,
}) => {
  if ((viewport?.width ?? 1280) >= 768) {
    test.skip();
    return;
  }

  await goHome(page);
  await scrollToSection(page, "work");
  await openMenu(page);

  const { bg, color } = await page.evaluate(() => {
    const overlay = document.querySelector<HTMLElement>(
      '[role="dialog"][aria-modal="true"]',
    );
    return overlay
      ? {
          bg: window.getComputedStyle(overlay).backgroundColor,
          color: window.getComputedStyle(overlay).color,
        }
      : { bg: "", color: "" };
  });

  expect(bg).toBe(BG_TEAL);
  expect(color).toBe(TEXT_LIGHT_TEAL);
});

test("TC15 — Contact overlay: bg brown, text orange", async ({
  page,
  viewport,
}) => {
  if ((viewport?.width ?? 1280) >= 768) {
    test.skip();
    return;
  }

  await goHome(page);
  await scrollToSection(page, "contact");
  await openMenu(page);

  const { bg, color } = await page.evaluate(() => {
    const overlay = document.querySelector<HTMLElement>(
      '[role="dialog"][aria-modal="true"]',
    );
    return overlay
      ? {
          bg: window.getComputedStyle(overlay).backgroundColor,
          color: window.getComputedStyle(overlay).color,
        }
      : { bg: "", color: "" };
  });

  expect(bg).toBe(BG_BROWN);
  expect(color).toBe(TEXT_ORANGE);
});

test("TC16 — hero hamburger/X button is purple when menu open (not green)", async ({
  page,
  viewport,
}) => {
  if ((viewport?.width ?? 1280) >= 768) {
    test.skip();
    return;
  }

  await goHome(page);
  await openMenu(page);

  const btnColor = await page.evaluate(() => {
    const btn = document.querySelector<HTMLElement>(
      'button[aria-expanded="true"]',
    );
    return btn ? window.getComputedStyle(btn).color : "";
  });

  expect(btnColor).toBe(TEXT_PURPLE);
  expect(btnColor).not.toBe(GREEN);
});

// ---------------------------------------------------------------------------
// TC17 — Contact section right panel text is orange
// ---------------------------------------------------------------------------

test("TC17 — Contact right panel has orange text", async ({ page }) => {
  await goHome(page);
  await scrollToSection(page, "contact");

  const color = await page.evaluate(() => {
    // The right panel is the second direct child div of the contact section
    const section = document.getElementById("contact");
    if (!section) return "";
    const panels = section.querySelectorAll<HTMLElement>(":scope > div");
    const rightPanel = panels[panels.length - 1];
    return rightPanel ? window.getComputedStyle(rightPanel).color : "";
  });

  expect(color).toBe(TEXT_ORANGE);
});
