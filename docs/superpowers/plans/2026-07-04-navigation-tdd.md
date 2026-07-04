# Navigation TDD Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the site navigation satisfy the clean acceptance criteria in `docs/superpowers/specs/2026-07-04-navigation-acceptance-criteria-design.md`, encoded as Playwright tests, using TDD.

**Architecture:** Playwright specs under `tests/navigation/` encode ACs A–F. They run on WebKit desktop (Desktop Safari) + Mobile Safari (iPhone 12). Existing behaviors (A, B, C, D1, D3, E1, F1, F2, F4) are verified; three behaviors are added/changed: **D2** back-button return-to-origin (`history.back()` + fixed-hash fallback), **E2** one-pager scroll-spy active indication, **F3** overlay focus-trap with focus return.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript (strict), next-intl (nl default), Playwright (WebKit), Tailwind v4.

## Global Constraints

- Locale under test: `nl` only. Base URL: `process.env.BASE_URL ?? http://localhost:3000`.
- Target Playwright projects for AC: `navigation-webkit-desktop` (Desktop Safari) and `navigation-webkit` (iPhone 12 / Mobile Safari).
- Nav item order everywhere: `about, who-am-i, work, contact, blog`; plus `home` (logo). Keep `NAV_ITEMS` identical in `StickyNav` and `DetailNav`.
- Use Tailwind theme tokens from `globals.css` (`@theme inline`), never hardcoded colors.
- Any user-facing copy lives in `src/i18n/messages/en.json` + `nl.json` (nav labels already exist under `nav.*`).
- ESLint ignores `src/slices/**`, `src/slice-machine/**` — do not touch generated code.
- Use the `@/*` path alias.
- Tests require a running server; `playwright.config.ts` auto-starts `npm run dev` unless `BASE_URL` is set (Task 1).

---

### Task 1: Test harness — Desktop WebKit project, auto dev server, `test:nav` script, baseline

**Files:**

- Modify: `playwright.config.ts`
- Modify: `package.json` (scripts)

**Interfaces:**

- Produces: Playwright projects `navigation-webkit-desktop` and `navigation-webkit`; npm script `test:nav`; auto `webServer`.

- [ ] **Step 1: Add the Desktop Safari project and a conditional dev server to `playwright.config.ts`**

Add a new project after `navigation-webkit` (inside the `projects` array):

```ts
    {
      // Desktop WebKit (Safari engine) — the desktop AC target.
      name: "navigation-webkit-desktop",
      testMatch: "tests/navigation/**/*.spec.ts",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1280, height: 800 },
        bypassCSP: false,
      },
    },
```

Add a `webServer` key to the top-level `defineConfig({...})` object (sibling of `projects`), so a dev server boots automatically when no external `BASE_URL` is supplied:

```ts
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
```

- [ ] **Step 2: Add the `test:nav` script to `package.json`**

In the `"scripts"` block add:

```json
    "test:nav": "playwright test --project=navigation-webkit-desktop --project=navigation-webkit",
```

- [ ] **Step 3: Verify the projects resolve and list tests**

Run: `npx playwright test --project=navigation-webkit-desktop --list`
Expected: prints the AC test titles from `navigation.spec.ts` and `menu.spec.ts` with no config error.

- [ ] **Step 4: Baseline run (informational)**

Run: `npm run test:nav`
Expected: existing specs run on both WebKit projects. Record which pass/fail — later tasks turn the reds green. Do not fix anything here.

- [ ] **Step 5: Commit**

```bash
git add playwright.config.ts package.json
git commit -m "test: add Desktop WebKit nav project, auto dev server, test:nav script"
```

---

### Task 2: Encode structural + menu ACs (A1–A2, B1–B3, D1, D3) and confirm green

**Files:**

- Modify: `tests/navigation/navigation.spec.ts`
- Modify: `tests/navigation/menu.spec.ts`

**Interfaces:**

- Consumes: helpers already in `navigation.spec.ts` (`goHome`, `gotoPage`, `revealSection`, `sectionCoversViewportCentre`, `firstHref`, `visibleBackLink`).

The existing `navigation.spec.ts` already covers A1 (its "AC1"), A2 ("AC2a/b/c"), B3 ("AC4a"), D3 ("AC5"), and `menu.spec.ts` covers B1–B2. This task aligns the test file comments/labels to the final AC ids and confirms they pass on WebKit. **Note:** the old "AC3" (fixed-destination back) is replaced by Task 4's D2 — leave it for now; Task 4 rewrites it.

- [ ] **Step 1: Relabel the top comment block of `navigation.spec.ts`**

Replace the AC list in the file header comment (lines ~4–16) with the final ids so the file documents A1/A2/B3/D1/D3 (keep the prose accurate). This is comment-only; no assertion changes.

- [ ] **Step 2: Add an explicit D1 test (section link scrolls into view) to `navigation.spec.ts`**

Append:

```ts
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
    await page
      .locator("button[aria-expanded]:not([data-nextjs-dev-tools-button])")
      .click();
    await page.waitForTimeout(400);
  }
  const link = page.locator(`a[href="#work"]:visible`).first();
  await expect(link).toBeVisible();
  await link.click();
  await page.waitForTimeout(1500); // smooth scroll settle
  const res = await sectionCoversViewportCentre(page, "work");
  expect(res.ok, `after click, ${res.detail}`).toBe(true);
});
```

- [ ] **Step 3: Run the structural/menu tests on WebKit**

Run: `npm run test:nav -- navigation.spec.ts menu.spec.ts -g "AC1|AC2|AC4|AC5|D1|menu:"`
Expected: PASS. If a red appears, it is a genuine nav bug in an "exists" AC — fix the smallest thing in the relevant component (`StickyNav`/`DetailNav`/section) to make it pass, then re-run.

- [ ] **Step 4: Commit**

```bash
git add tests/navigation/navigation.spec.ts tests/navigation/menu.spec.ts
git commit -m "test: encode nav AC A1-A2/B1-B3/D1/D3 on WebKit"
```

---

### Task 3: Mobile menu UX + a11y basics (C1–C4, F1, F2, F4)

**Files:**

- Create: `tests/navigation/menu-ux.spec.ts`

**Interfaces:**

- Consumes: the hamburger selector `button[aria-expanded]:not([data-nextjs-dev-tools-button])`, overlay `[role="dialog"]`.

These behaviors already exist in `StickyNav`/`DetailNav` (Escape close, scroll lock, tabIndex, aria). This task pins them with tests; fix any red minimally.

- [ ] **Step 1: Write `tests/navigation/menu-ux.spec.ts`**

```ts
/**
 * Menu UX & a11y basics — C1–C4, F1, F2, F4.
 * Overlay behaviors are mobile-only; run assertions accordingly.
 * Requires a running server (webServer in playwright.config.ts).
 */
import { test, expect, type Page } from "@playwright/test";

const HOME = "/nl";
const HAMBURGER = "button[aria-expanded]:not([data-nextjs-dev-tools-button])";

async function goHome(page: Page) {
  await page.goto(HOME, { waitUntil: "load" });
  await page.waitForSelector('[data-testid="scroll-bg"]', { timeout: 15000 });
  await page.waitForTimeout(1200);
}

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
```

- [ ] **Step 2: Run on WebKit**

Run: `npm run test:nav -- menu-ux.spec.ts`
Expected: PASS. Fix any red minimally in `StickyNav`/`DetailNav`.

- [ ] **Step 3: Commit**

```bash
git add tests/navigation/menu-ux.spec.ts
git commit -m "test: pin mobile menu UX + a11y basics (C1-C4, F1, F2, F4)"
```

---

### Task 4: D2 — back button returns to origin (`history.back()` + fixed-hash fallback)

**Files:**

- Modify: `tests/navigation/navigation.spec.ts` (replace old "AC3" back tests with D2)
- Modify: `src/components/ArrowLink.tsx` (accept `onClick`)
- Modify: `src/components/DetailNav.tsx` (back handler)
- Modify: `src/components/ScrollRestoration.tsx` (set internal-nav flag)

**Interfaces:**

- Produces: `ArrowLink` gains optional `onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void`. `ScrollRestoration` writes `sessionStorage['udocu_internal_nav'] = '1'` on any in-app link click. `DetailNav` back link prefers `history.back()` when `history.length > 1 && sessionStorage['udocu_internal_nav'] === '1'`, else follows its `href` (the fixed section hash / blog overview).

- [ ] **Step 1: Write the failing D2 tests** — replace the existing `AC3` block in `navigation.spec.ts` (the two loop tests + the Work back test, lines ~146–204) with:

```ts
// ---------------------------------------------------------------------------
// D2 — back button returns to origin (arrived in-app), with scroll restored;
//      deep-link fallback returns to the section the page belongs to.
// ---------------------------------------------------------------------------

test("D2 — Work item → back returns to #work at the original scroll position", async ({
  page,
}) => {
  await goHome(page);
  await revealSection(page, "work");
  const originScrollY = await page.evaluate(() => window.scrollY);
  expect(
    originScrollY,
    "should have scrolled down to reach #work",
  ).toBeGreaterThan(0);

  const link = page
    .locator(`#work a[href^="${HOME}/work/"]:visible:not([aria-hidden="true"])`)
    .first();
  await link.click();
  await expect(page).toHaveURL(new RegExp(`/nl/work/[^/]+/?$`));

  const back = visibleBackLink(page);
  await expect(back).toHaveCount(1);
  await back.click();

  await expect(page).toHaveURL(new RegExp(`/nl(#work)?$`));
  await page.waitForTimeout(1800);
  const res = await sectionCoversViewportCentre(page, "work");
  expect(res.ok, `after back, ${res.detail}`).toBe(true);
  const restoredScrollY = await page.evaluate(() => window.scrollY);
  expect(
    Math.abs(restoredScrollY - originScrollY),
    `scroll should be restored to origin (was ${originScrollY}, now ${restoredScrollY})`,
  ).toBeLessThan(80);
});

test("D2 — deep-linked /nl/about → back falls back to #about in view", async ({
  page,
}) => {
  // Fresh context: no in-app history, so the fixed-hash fallback must be used.
  await gotoPage(page, `${HOME}/about`);
  const back = visibleBackLink(page);
  await expect(back).toHaveCount(1);
  const href = await back.getAttribute("href");
  expect(href, "fallback href should target #about").toMatch(/\/nl#about$/);
  await back.click();
  await expect(page).toHaveURL(new RegExp(`/nl(#about)?$`));
  await page.waitForTimeout(1500);
  const res = await sectionCoversViewportCentre(page, "about");
  expect(res.ok, `after fallback back, ${res.detail}`).toBe(true);
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:nav -- navigation.spec.ts -g "D2"`
Expected: FAIL — the "restored scroll position" assertion fails (current back is a plain fixed-hash link that top-aligns the section rather than restoring origin scroll).

- [ ] **Step 3: Add `onClick` to `ArrowLink`** — in `src/components/ArrowLink.tsx`:

Add to `ArrowLinkProps`:

```ts
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
```

Destructure `onClick` in the component signature, and forward it in `linkProps`:

```ts
const linkProps = external ? { href, onClick } : { href, onClick };
```

Add `import { type ReactNode, type ElementType, type MouseEvent } from "react";` is not required — the inline `React.MouseEvent` type needs `import type React from "react";` at top; add `import type { MouseEvent } from "react";` and use `MouseEvent<HTMLAnchorElement>` in the prop type instead of `React.MouseEvent`.

- [ ] **Step 4: Set the internal-nav flag in `ScrollRestoration`** — in `src/components/ScrollRestoration.tsx`, inside the existing `save` click handler (the capture-phase listener), after `writePosition(...)` add:

```ts
try {
  const url = new URL(link.href, window.location.origin);
  if (url.origin === window.location.origin) {
    sessionStorage.setItem("udocu_internal_nav", "1");
  }
} catch {}
```

- [ ] **Step 5: Add the back handler in `DetailNav`** — in `src/components/DetailNav.tsx`, add before the `return`:

```ts
const handleBack = (e: React.MouseEvent<HTMLAnchorElement>) => {
  if (typeof window === "undefined") return;
  const cameFromInApp =
    window.history.length > 1 &&
    sessionStorage.getItem("udocu_internal_nav") === "1";
  if (cameFromInApp) {
    e.preventDefault();
    window.history.back();
  }
  // else: allow the <a href={resolvedBackHref}> to navigate (deep-link fallback)
};
```

Then pass it to the back `ArrowLink`:

```tsx
<ArrowLink
  href={resolvedBackHref}
  direction="back"
  onClick={handleBack}
  className="font-helvetica text-[16px] font-medium uppercase leading-5 tracking-widest transition-opacity hover:opacity-70 focus-visible:opacity-70 focus-visible:outline-none"
>
  {t("back")}
</ArrowLink>
```

- [ ] **Step 6: Run to verify pass**

Run: `npm run test:nav -- navigation.spec.ts -g "D2"`
Expected: PASS on both WebKit projects.

- [ ] **Step 7: Full nav regression + typecheck**

Run: `npm run test:nav && npm run tsc`
Expected: all nav specs green; no type errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/ArrowLink.tsx src/components/DetailNav.tsx src/components/ScrollRestoration.tsx tests/navigation/navigation.spec.ts
git commit -m "feat: back button returns to origin via history.back() with fixed-hash fallback (D2)"
```

---

### Task 5: E2 — one-pager scroll-spy active-section indication (+ verify E1)

**Files:**

- Create: `src/hooks/useActiveSection.ts`
- Modify: `src/components/StickyNav.tsx`
- Create: `tests/navigation/active-section.spec.ts`

**Interfaces:**

- Produces: `useActiveSection(ids: readonly string[]): string | null` — returns the id of the section straddling the viewport centre. `StickyNav` desktop nav `<a href="#item">` gets `aria-current="true"` when active.

- [ ] **Step 1: Write the failing E2 test** — `tests/navigation/active-section.spec.ts`:

```ts
/**
 * E1 — detail/blog nav underlines the matching item.
 * E2 — one-pager nav marks the section at the viewport centre as active.
 * Scroll-spy is a desktop nav affordance (no persistent nav bar on mobile).
 */
import { test, expect, type Page } from "@playwright/test";

const HOME = "/nl";

async function goHome(page: Page) {
  await page.goto(HOME, { waitUntil: "load" });
  await page.waitForSelector('[data-testid="scroll-bg"]', { timeout: 15000 });
  await page.waitForTimeout(1200);
}
async function revealSection(page: Page, id: string) {
  await page.evaluate((sectionId) => {
    document
      .getElementById(sectionId)
      ?.scrollIntoView({ block: "center", behavior: "instant" });
  }, id);
  await page.waitForTimeout(900);
}

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
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:nav -- active-section.spec.ts -g "E2"`
Expected: FAIL — no `aria-current` on the one-pager nav (E1 may already pass via `activeItem` underline).

- [ ] **Step 3: Write `src/hooks/useActiveSection.ts`**

```ts
"use client";

import { useEffect, useState } from "react";

/** Returns the id of the section whose box straddles the viewport centre. */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length > 0) setActive(visible[0].target.id);
      },
      // Active band = centre 10% of the viewport, matching the AC's
      // "straddles the viewport centre" definition.
      { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] },
    );

    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);

  return active;
}
```

- [ ] **Step 4: Wire it into `StickyNav`** — in `src/components/StickyNav.tsx`:

Add import:

```ts
import { useActiveSection } from "@/hooks/useActiveSection";
```

Inside the component, after the existing hooks:

```ts
const activeSection = useActiveSection([
  "about",
  "who-am-i",
  "work",
  "contact",
]);
```

In the **desktop** nav `<a href={`#${item}`}>` (the non-blog branch, ~line 101), add:

```tsx
                    aria-current={item === activeSection ? "true" : undefined}
```

- [ ] **Step 5: Run to verify pass**

Run: `npm run test:nav -- active-section.spec.ts`
Expected: PASS (E1 and E2) on the desktop project; skipped on mobile.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useActiveSection.ts src/components/StickyNav.tsx tests/navigation/active-section.spec.ts
git commit -m "feat: one-pager nav scroll-spy active-section indication (E2)"
```

---

### Task 6: F3 — overlay focus-trap + focus return on close

**Files:**

- Create: `src/hooks/useFocusTrap.ts`
- Modify: `src/components/StickyNav.tsx`
- Modify: `src/components/DetailNav.tsx`
- Modify: `tests/navigation/menu-ux.spec.ts` (add F3)

**Interfaces:**

- Produces: `useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean): void` — on `active`, focuses the first focusable in the container, wraps Tab/Shift+Tab within it, and on deactivation restores focus to the element focused when the trap engaged.

- [ ] **Step 1: Write the failing F3 test** — append to `tests/navigation/menu-ux.spec.ts`:

```ts
test("F3 — open overlay traps focus and Escape returns focus to the trigger", async ({
  page,
  viewport,
}) => {
  test.skip((viewport?.width ?? 1280) >= 768, "overlay is mobile-only");
  await goHome(page);
  const trigger = page.locator(HAMBURGER);
  await trigger.click();
  await page.waitForTimeout(400);
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press("Tab");
    const inside = await page.evaluate(
      () => !!document.activeElement?.closest('[role="dialog"]'),
    );
    expect(inside, `focus should stay inside the dialog (iter ${i})`).toBe(
      true,
    );
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(300);
  await expect(trigger).toBeFocused();
});
```

- [ ] **Step 2: Run to verify failure**

Run: `npm run test:nav -- menu-ux.spec.ts -g "F3"`
Expected: FAIL — focus is not trapped / not returned to trigger.

- [ ] **Step 3: Write `src/hooks/useFocusTrap.ts`**

```ts
"use client";

import { useEffect, type RefObject } from "react";

/**
 * Traps keyboard focus within `containerRef` while `active`. On activation the
 * first focusable child is focused; Tab/Shift+Tab wrap within the container.
 * On deactivation focus returns to whatever was focused when the trap engaged.
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
): void {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const trigger = document.activeElement as HTMLElement | null;
    const focusables = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          "a[href], button:not([disabled])",
        ),
      );

    focusables()[0]?.focus();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    container.addEventListener("keydown", onKeyDown);
    return () => {
      container.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [active, containerRef]);
}
```

- [ ] **Step 4: Apply the trap in `StickyNav`** — in `src/components/StickyNav.tsx`:

Add imports:

```ts
import { useRef } from "react";
import { useFocusTrap } from "@/hooks/useFocusTrap";
```

(merge `useRef` into the existing `react` import). Add a ref + trap:

```ts
const overlayRef = useRef<HTMLDivElement>(null);
useFocusTrap(overlayRef, menuOpen);
```

Attach the ref to the overlay `<div role="dialog" ...>`:

```tsx
        <div
          ref={overlayRef}
          role="dialog"
          aria-modal="true"
```

- [ ] **Step 5: Apply the trap in `DetailNav`** — same three edits in `src/components/DetailNav.tsx`: import `useRef` (merge into existing `react` import) + `useFocusTrap`, declare `const overlayRef = useRef<HTMLDivElement>(null); useFocusTrap(overlayRef, menuOpen);`, and add `ref={overlayRef}` to its `<div role="dialog" ...>`.

- [ ] **Step 6: Run to verify pass**

Run: `npm run test:nav -- menu-ux.spec.ts -g "F3"`
Expected: PASS on Mobile Safari; skipped on desktop.

- [ ] **Step 7: Full nav suite + typecheck + lint**

Run: `npm run test:nav && npm run tsc && npm run lint`
Expected: all nav specs green; no type or lint errors.

- [ ] **Step 8: Commit**

```bash
git add src/hooks/useFocusTrap.ts src/components/StickyNav.tsx src/components/DetailNav.tsx tests/navigation/menu-ux.spec.ts
git commit -m "feat: focus-trap the mobile menu overlay with focus return (F3)"
```

---

### Task 7: Full green pass + spec reconciliation

**Files:**

- Modify: `docs/superpowers/specs/2026-07-04-navigation-acceptance-criteria-design.md` (only if an AC had to change during implementation)

- [ ] **Step 1: Run the complete navigation suite on both WebKit projects**

Run: `npm run test:nav`
Expected: every AC test passes on `navigation-webkit-desktop` and `navigation-webkit`.

- [ ] **Step 2: Map each AC (A1–F4) to a passing test**

Confirm coverage: A1/A2/B3/D1/D3 (`navigation.spec.ts`), B1/B2 (`menu.spec.ts`), C1–C4/F1/F2/F4/F3 (`menu-ux.spec.ts`), D2 (`navigation.spec.ts`), E1/E2 (`active-section.spec.ts`). Note any AC with no green test.

- [ ] **Step 3: If any AC changed during build, update the spec doc to match and commit**

```bash
git add docs/superpowers/specs/2026-07-04-navigation-acceptance-criteria-design.md
git commit -m "docs: reconcile nav AC spec with implemented behavior"
```

- [ ] **Step 4: Push branch and update PR #11**

```bash
git push
```

Expected: branch `feat/nav-readability-scroll-colors` updated; PR #11 reflects the new nav TDD work.

## Self-Review

- **Spec coverage:** A1–A2 (Task 2), B1–B3 (Tasks 2), C1–C4 (Task 3), D1 (Task 2), D2 (Task 4), D3 (Task 2), E1–E2 (Task 5), F1/F2/F4 (Task 3), F3 (Task 6). All AC groups map to a task. ✔
- **Placeholders:** none — every code/test step shows concrete content. ✔
- **Type consistency:** `useActiveSection(ids): string | null`, `useFocusTrap(ref, active): void`, `ArrowLink onClick?: (e: MouseEvent<HTMLAnchorElement>) => void`, sessionStorage key `udocu_internal_nav` — used consistently across Tasks 4–6. ✔
