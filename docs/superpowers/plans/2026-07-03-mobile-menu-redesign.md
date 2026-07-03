# Mobile Menu Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat opacity-fade mobile menu with a slide-down overlay, staggered link entrance animations, and opacity-scatter + letter-spacing hover effects.

**Architecture:** Two component files (`StickyNav.tsx`, `DetailNav.tsx`) share the same treatment. A single new CSS block in `globals.css` handles the `@keyframes` and hover rules. No new dependencies — pure CSS transitions and React inline styles for per-link delays.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, TypeScript strict mode.

## Global Constraints

- No new npm dependencies
- Tailwind v4 — use `@theme inline` in `globals.css` for tokens; arbitrary values allowed in className
- `prefers-reduced-motion` support is already in `globals.css` and collapses all transitions/animations automatically — no extra work needed
- All existing ARIA attributes, Escape-key handler, and `tabIndex` management must remain unchanged
- Copy (translation keys) must not change

---

### Task 1: Add animation keyframe and hover CSS to globals.css

**Files:**

- Modify: `src/app/globals.css`

**Interfaces:**

- Produces: `menu-link-in` keyframe (used in Tasks 2 & 3), `.mobile-nav-links` CSS class (used in Tasks 2 & 3)

- [ ] **Step 1: Add the CSS block**

Open `src/app/globals.css` and append the following block **after** the closing `}` of the `@media (prefers-reduced-motion: reduce)` block (i.e., at the very end of the file):

```css
@keyframes menu-link-in {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mobile-nav-links li {
  transition:
    opacity 150ms ease,
    letter-spacing 150ms ease;
}

.mobile-nav-links:hover li {
  opacity: 0.25;
}

.mobile-nav-links:hover li:hover {
  opacity: 1;
  letter-spacing: 0.2em;
}
```

The `.mobile-nav-links:hover li:hover` selector has higher specificity than `.mobile-nav-links:hover li`, so the hovered item correctly stays at full opacity while siblings dim.

- [ ] **Step 2: Verify the dev server picks up the change**

Run: `npm run dev`

Open the site on mobile viewport (or DevTools mobile emulation). Open the mobile menu — links should still appear as before (CSS not yet wired up in JSX). No console errors. The new keyframe and hover rules are now available globally.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style: add mobile menu keyframe and hover CSS"
```

---

### Task 2: Update StickyNav.tsx overlay animation and link stagger

**Files:**

- Modify: `src/components/StickyNav.tsx`

**Interfaces:**

- Consumes: `menu-link-in` keyframe and `.mobile-nav-links` class from Task 1

- [ ] **Step 1: Replace the overlay `className` and `style`**

Find this block (lines 107–116 in current file):

```tsx
      {/* Mobile full-screen overlay */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("openMenu")}
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-300 md:hidden ${
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        style={{ backgroundColor: bgColor, color: textColor }}
      >
```

Replace it with:

```tsx
      {/* Mobile full-screen overlay */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("openMenu")}
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center md:hidden ${
          menuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        style={{
          backgroundColor: bgColor,
          color: textColor,
          transform: menuOpen ? "translateY(0)" : "translateY(-100%)",
          transition: menuOpen
            ? "transform 300ms cubic-bezier(0.4,0,0.1,1)"
            : "transform 150ms ease-in",
        }}
      >
```

Key changes:

- Removed `transition-opacity duration-300` from className (no longer using opacity for the container)
- Removed `opacity-0`/`opacity-100` conditional classes
- Added `transform` and `transition` via inline `style` so open/close can use different durations (300ms in, 150ms out)

- [ ] **Step 2: Add `index` to the map and wire up the `mobile-nav-links` class + stagger**

Find this line (currently line 118):

```tsx
        <ul className="flex flex-col items-center gap-10 font-helvetica text-2xl font-medium uppercase tracking-widest">
          {NAV_ITEMS.map((item) =>
```

Replace with:

```tsx
        <ul className="mobile-nav-links flex flex-col items-center gap-10 font-helvetica text-2xl font-medium uppercase tracking-widest">
          {NAV_ITEMS.map((item, index) =>
```

Then update both branches of the map to pass an `animationStyle` on the `<li>`:

Full updated map block (replace lines 119–143):

```tsx
{
  NAV_ITEMS.map((item, index) => {
    const animationStyle = menuOpen
      ? { animation: `menu-link-in 280ms ease-out ${index * 60}ms both` }
      : undefined;
    return item === "blog" ? (
      <li key={item} style={animationStyle}>
        <Link
          href={`/${locale}/blog`}
          tabIndex={menuOpen ? 0 : -1}
          className="focus-visible:opacity-70 focus-visible:outline-none"
          onClick={() => setMenuOpen(false)}
        >
          {t(item)}
        </Link>
      </li>
    ) : (
      <li key={item} style={animationStyle}>
        <a
          href={`#${item}`}
          tabIndex={menuOpen ? 0 : -1}
          className="focus-visible:opacity-70 focus-visible:outline-none"
          onClick={handleNavClick}
        >
          {t(item)}
        </a>
      </li>
    );
  });
}
```

Note: `transition-opacity hover:opacity-70` removed from link `className` — hover is now handled by `.mobile-nav-links` CSS rules from Task 1.

- [ ] **Step 3: Verify in browser**

With `npm run dev` running, open the site on mobile viewport. Check:

1. Tapping the hamburger slides the menu down smoothly (~300ms)
2. Tapping the hamburger again slides it back up quickly (~150ms)
3. Links stagger in one by one (first link immediate, last link ~240ms later)
4. Hovering any link dims the others and expands letter-spacing on the hovered one
5. Escape key still closes the menu
6. Tapping a link navigates and closes the menu

- [ ] **Step 4: Commit**

```bash
git add src/components/StickyNav.tsx
git commit -m "feat: animate mobile menu with slide-down, staggered links, and hover effects"
```

---

### Task 3: Update DetailNav.tsx overlay animation and link stagger

**Files:**

- Modify: `src/components/DetailNav.tsx`

**Interfaces:**

- Consumes: `menu-link-in` keyframe and `.mobile-nav-links` class from Task 1

- [ ] **Step 1: Replace the overlay `className` and `style`**

Find this block (lines 93–103 in current file):

```tsx
      {/* Mobile full-screen overlay */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("openMenu")}
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-current/0 transition-opacity duration-300 md:hidden ${
          menuOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        style={{ backgroundColor: "inherit", color: "inherit" }}
      >
```

Replace with:

```tsx
      {/* Mobile full-screen overlay */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("openMenu")}
        className={`fixed inset-0 z-50 flex flex-col items-center justify-center md:hidden ${
          menuOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        style={{
          backgroundColor: "inherit",
          color: "inherit",
          transform: menuOpen ? "translateY(0)" : "translateY(-100%)",
          transition: menuOpen
            ? "transform 300ms cubic-bezier(0.4,0,0.1,1)"
            : "transform 150ms ease-in",
        }}
      >
```

Key changes (same as Task 2):

- Removed `bg-current/0 transition-opacity duration-300` and `opacity-0`/`opacity-100`
- Added transform-based slide via inline style

- [ ] **Step 2: Add `index` to the map and wire up stagger**

Find (line 105):

```tsx
        <ul className="flex flex-col items-center gap-10 font-helvetica text-2xl font-medium uppercase tracking-widest">
          {NAV_ITEMS.map((item) => (
```

Replace with:

```tsx
        <ul className="mobile-nav-links flex flex-col items-center gap-10 font-helvetica text-2xl font-medium uppercase tracking-widest">
          {NAV_ITEMS.map((item, index) => {
            const animationStyle = menuOpen
              ? { animation: `menu-link-in 280ms ease-out ${index * 60}ms both` }
              : undefined;
            return (
```

Then update the single `<li>` block and close the map properly. Full updated map block (replace lines 106–120):

```tsx
{
  NAV_ITEMS.map((item, index) => {
    const animationStyle = menuOpen
      ? { animation: `menu-link-in 280ms ease-out ${index * 60}ms both` }
      : undefined;
    return (
      <li key={item} style={animationStyle}>
        <Link
          href={item === "blog" ? `/${locale}/blog` : `/${locale}/#${item}`}
          tabIndex={menuOpen ? 0 : -1}
          className={`focus-visible:opacity-70 focus-visible:outline-none ${
            item === activeItem ? "underline underline-offset-4" : ""
          }`}
          onClick={() => setMenuOpen(false)}
        >
          {t(item)}
        </Link>
      </li>
    );
  });
}
```

Note: `transition-opacity hover:opacity-70` removed from link `className` — hover handled by `.mobile-nav-links` CSS.

- [ ] **Step 3: Verify in browser**

Navigate to a detail page (e.g. a blog or work post) on mobile viewport. Check:

1. Hamburger slides menu down (~300ms) and back up quickly (~150ms)
2. Links stagger in with the same timing as StickyNav
3. Hover dims others, expands letter-spacing on hovered link
4. Escape key closes menu
5. Tapping a link navigates correctly

- [ ] **Step 4: Run lint and type-check**

```bash
npm run lint && npm run tsc
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/DetailNav.tsx
git commit -m "feat: apply mobile menu animation to DetailNav"
```
