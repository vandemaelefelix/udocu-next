# Navigation — Acceptance Criteria & Design

**Date:** 2026-07-04
**Branch / worktree:** `feat/nav-readability-scroll-colors` (`.claude/worktrees/feat+nav-readability`)
**Scope of testing:** locale `nl` only; asserted on WebKit desktop + Mobile Safari (iPhone 12) Playwright projects.
**Approach:** Test-driven. These acceptance criteria are the source of truth. Tests are written/refined to encode them, then the navigation is changed until every test passes — deliberately without deriving the criteria from the current implementation.

## Context

- `/nl` is a one-pager with four sections: `about`, `who-am-i`, `work`, `contact`.
- Detail pages: `/nl/about`, `/nl/who-am-i`, `/nl/work/<uid>`.
- Blog: overview `/nl/blog`, posts `/nl/blog/<uid>`.
- The one-pager renders `StickyNav`; detail pages and the blog render `DetailNav`. Both must expose the same destinations.
- `ScrollRestoration` (sessionStorage, per-URL scroll positions + `popstate` handling) already exists and is reused by D2.

Legend: _(exists)_ = current behavior already satisfies it (verify + keep); **CHANGED** = behavior differs from current and must be reworked; **NEW** = behavior does not exist yet and must be built.

## Acceptance Criteria

### A — Structure & entry into detail pages _(exists)_

- **A1** The one-pager renders all four sections with correct ids (`#about`, `#who-am-i`, `#work`, `#contact`).
- **A2** A link/item inside a section navigates to its detail page:
  - about "read more" → `/nl/about`
  - who-am-i "read more" → `/nl/who-am-i`
  - work item → `/nl/work/<uid>`

### B — Menu parity & destinations _(exists)_

- **B1** Every screen (one-pager, a detail page, the blog overview) exposes the same destinations — home (logo), about, who-am-i, work, contact, blog — each visible and clickable on desktop **and** mobile.
- **B2** Each menu item lands on the correct URL:
  - one-pager section links → bare `#section`, resulting URL `/nl#section`
  - detail-page section links → `/nl#section`
  - blog → `/nl/blog`
  - home (logo) → `/nl`
- **B3** The blog is reachable **only** through the menu/nav — no section body on the one-pager links to the blog.

### C — Mobile menu open/close UX

- **C1** _(exists)_ Tapping the hamburger opens the full-screen overlay; `aria-expanded` reflects the open/closed state.
- **C2** _(exists)_ Pressing Escape closes the overlay.
- **C3** _(exists)_ Tapping a link inside the overlay closes it and navigates.
- **C4** _(exists)_ Body scroll is locked while the overlay is open and restored when it closes.

### D — Scroll behavior

- **D1** _(exists)_ Clicking a section link (menu or in-page) scrolls that section into view — not merely a hash change. After the scroll settles, the target section straddles the viewport centre.
- **D2** **CHANGED** — The back button on a detail page **returns to the origin**:
  - If the user arrived from the one-pager (a specific section), Back returns to that section with it in view **and the prior scroll position restored**.
  - Deep-link / no-history fallback: Back lands on the section the page belongs to (`#about` for `/nl/about`, `#who-am-i` for `/nl/who-am-i`, `#work` for `/nl/work/<uid>`).
  - **Implementation:** use `history.back()` when same-origin history exists (reusing the existing `ScrollRestoration` `popstate` handler for exact scroll restoration); render/behave as a link to the fixed section hash otherwise.
- **D3** _(exists)_ A blog post's back button returns to the blog overview (`/nl/blog`).

### E — Active-section indication

- **E1** _(exists)_ On detail pages and the blog, the nav underlines the matching item (blog underlined on the blog overview).
- **E2** **NEW** — On the one-pager, the nav indicates the currently-viewed section as the user scrolls (scroll-spy): the nav item for the section straddling the viewport centre is marked active.

### F — Keyboard & accessibility

- **F1** _(exists)_ The hamburger button exposes correct `aria-expanded` and an open/close `aria-label`.
- **F2** _(exists)_ Overlay links are not tab-reachable when the overlay is closed (`tabIndex -1`) and are tab-reachable when open (`tabIndex 0`).
- **F3** **NEW** — Focus is trapped within the open overlay; pressing Escape closes it and returns focus to the hamburger trigger.
- **F4** _(exists)_ The back button is keyboard-operable (focusable, Enter-activates) — inherent to it being a link.

## Test Plan

Playwright, under existing projects `navigation-webkit` (Mobile Safari / iPhone 12) and a desktop WebKit project. Requires a running dev/preview server (`BASE_URL`, default `http://localhost:3000`).

- `tests/navigation/navigation.spec.ts` — refine to cover A1–A2, B3, D1–D3.
- `tests/navigation/menu.spec.ts` — keep/refine B1–B2 across screens & breakpoints.
- `tests/navigation/menu-ux.spec.ts` (new or folded in) — C1–C4, F1–F3.
- `tests/navigation/active-section.spec.ts` (new) — E1–E2.

Desktop assertions run WebKit desktop; mobile-specific assertions (overlay, mobile back button) run Mobile Safari.

## Out of Scope

- `en` locale (structure assumed identical; revisit if routing bugs surface).
- Native browser-chrome bar colour on real iOS (requires a device / Xcode Simulator) — covered separately by the scroll-colour work.
- Chromium/Firefox coverage for navigation (WebKit is the target where the mobile bugs lived).

## Implementation Notes

- `StickyNav` already routes section clicks via `router.push('/nl#section', { scroll: false })` + smooth `scrollIntoView`; D1 largely holds there.
- D2 requires changing `DetailNav`'s back link from a fixed `ArrowLink href` to a control that prefers `history.back()` with the fixed hash as fallback, while remaining a real focusable/keyboard-operable element (F4) and — for the deep-link case — exposing the fallback href.
- E2 (scroll-spy) and F3 (focus-trap) are net-new and will need their own units, kept small and independently testable.
