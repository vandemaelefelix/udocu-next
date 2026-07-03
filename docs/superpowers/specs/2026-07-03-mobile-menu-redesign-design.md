# Mobile Menu Redesign

**Date:** 2026-07-03  
**Status:** Approved

## Overview

Redesign the mobile navigation menu in `StickyNav.tsx` and `DetailNav.tsx` to feel more refined and editorial — matching the site's existing aesthetic of dynamic color themes, grain overlay, and Garamond/Helvetica typographic contrast. The hamburger trigger and accessibility behavior remain unchanged.

## Current State

- Full-screen overlay fades in with a single `opacity` transition (300ms)
- All nav links appear simultaneously — no stagger
- Link hover is a simple `hover:opacity-70`
- Background and text color dynamically follow `ScrollColorContext` (section color pairs)

## Design Decisions

### What changes

**1. Overlay opening animation**  
Replace the opacity fade with a **slide-down from top**: the overlay enters via `transform: translateY(-100%) → translateY(0)` at 300ms with `cubic-bezier(0.4, 0, 0.1, 1)`. This reads as intentional — the menu arrives rather than materialising.

The closed state switches from `opacity-0 pointer-events-none` to `translate-y-[-100%] pointer-events-none`. No opacity transition on the container — the transform handles the reveal.

**2. Staggered link entrance**  
Each nav link animates in independently:

- Start: `translateY(16px) + opacity 0`
- End: `translateY(0) + opacity 1`
- Duration: 280ms, ease-out
- Delay: `index × 60ms` (applied via inline `style={{ animationDelay: '...' }}`)
- Links only animate when the menu opens (animation-fill-mode: backwards)

Total stagger for 5 links: 240ms of offset, so the last link finishes at ~520ms after open — snappy, not sluggish.

**3. Link hover effects**  
When hovering any link, all _other_ links dim to ~25% opacity. The hovered link stays at full opacity and its letter-spacing expands slightly. Both transitions at 150ms ease.

Implementation via plain CSS on the `<ul>` container:

```css
ul:hover li {
  opacity: 0.25;
}
ul:hover li:hover {
  opacity: 1;
  letter-spacing: 0.22em;
}
li {
  transition:
    opacity 150ms ease,
    letter-spacing 150ms ease;
}
```

Since Tailwind v4's group-hover ordering may conflict, these three rules are safest as a small `<style>` block or a CSS module on the menu `<ul>`.

**4. Close animation**  
Quick fade-out of the overlay at 150ms — no reverse stagger. Feels decisive. Achieved by transitioning `opacity` to 0 on close while the transform is reset, or simply re-applying `translate-y-[-100%]` at 150ms.

### What stays the same

- Hamburger → X animation (three spans with `translate-y-2 rotate-45` / `opacity-0` / `-translate-y-2 -rotate-45` at 300ms)
- Dynamic bg/text color from `ScrollColorContext` on the overlay
- All ARIA: `role="dialog"`, `aria-modal`, `aria-expanded`, `aria-label`
- Keyboard: Escape closes menu
- `tabIndex` management on hidden links
- `DetailNav.tsx` gets identical treatment for consistency

## Scope

| File                           | Change                                     |
| ------------------------------ | ------------------------------------------ |
| `src/components/StickyNav.tsx` | Overlay animation, link stagger, hover CSS |
| `src/components/DetailNav.tsx` | Same — identical treatment                 |

No new dependencies. Pure CSS transitions + React inline `style` for per-link animation delays.

## Animation Reference

```
t=0ms    overlay slides down (300ms)
t=0ms    link 1: translateY(16px)→0, opacity 0→1 (280ms)
t=60ms   link 2: same
t=120ms  link 3: same
t=180ms  link 4: same
t=240ms  link 5: same (finishes at ~520ms)

hover:
  other links → opacity 0.25, 150ms
  hovered link → opacity 1, letter-spacing +wider, 150ms

close:
  overlay → opacity 0, 150ms (or translate-y back up)
```

## Accessibility

No changes to existing accessibility behavior. The `prefers-reduced-motion` rule in `globals.css` already collapses all transitions/animations to 0.01ms for users who need it.
