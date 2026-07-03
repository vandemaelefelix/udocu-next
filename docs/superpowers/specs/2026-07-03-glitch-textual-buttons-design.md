# Glitch hover effect on textual buttons — Design

**Date:** 2026-07-03
**Branch:** `worktree-glitch-textual-buttons`

## Goal

Extend the existing `GlitchText` hover effect (CRT displacement + chromatic
aberration) — currently used only on the desktop nav links — to all textual
buttons and text links across the site, so hover interactions feel consistent.

## Background

The effect is composed of two parts:

- **SVG displacement wobble** — a per-instance `feTurbulence` + `feDisplacementMap`
  filter in `GlitchText.tsx`, re-triggered on `mouseenter` via `beginElement()`.
- **Chromatic aberration** — the CSS `glitch-chroma` keyframe in `globals.css`,
  triggered by `.glitch-text:hover` (pure CSS, no JS).

## Text-link inventory

| Location                                     | Component                                 | In scope                 |
| -------------------------------------------- | ----------------------------------------- | ------------------------ |
| Desktop nav                                  | `StickyNav` (already uses `GlitchText`)   | already done             |
| Read more / Contact / Back / work-detail nav | `ArrowLink`                               | yes                      |
| Email + phone                                | `ContactSection`                          | yes                      |
| Mobile menu labels                           | `StickyNav` (letter-spacing effect today) | yes                      |
| Social links                                 | `SocialLinks`                             | **no — icons, not text** |

The effect is text-based (`text-shadow` + text glyph displacement), so it has no
meaningful application to the social icons.

## Chosen approach — A (bake into `ArrowLink`, wrap the stragglers)

`ArrowLink` is the shared choke point for most textual buttons, so wrapping its
inner content in `GlitchText` once covers the largest group in a single edit.
The remaining raw links (contact email/phone, mobile nav) are wrapped directly.

Rejected: (B) wrapping at every call site — repetitive with no upside; (C) a new
polymorphic `GlitchLink` component — bigger refactor than warranted (YAGNI).

## Changes

### 1. `src/components/GlitchText.tsx`

- Trigger the displacement on **`focusin`** as well as `mouseenter`, so keyboard
  focus gets the same effect.
- Guard the trigger with a `prefers-reduced-motion: reduce` check — when the user
  opts out, skip `beginElement()` so no wobble fires.

### 2. `src/app/globals.css`

- Run the chromatic-aberration animation on `.glitch-text:focus-visible` in
  addition to `:hover` (keyboard parity).
- Add `@media (prefers-reduced-motion: reduce)` that disables the `glitch-chroma`
  animation. The plain opacity hover remains, so the affordance is preserved.

### 3. `src/components/ArrowLink.tsx`

- Wrap the entire inner content — label **and** arrow — in a single `GlitchText`,
  so the whole button glitches as one unit. The existing arrow-slide translate
  stays and simply glitches along with the rest.

### 4. `src/components/ContactSection.tsx`

- Wrap the email and phone label text in `GlitchText`.

### 5. `src/components/StickyNav.tsx`

- Wrap the mobile menu labels in `GlitchText`, replacing the letter-spacing-only
  hover so mobile matches desktop.

## Accessibility

- **Keyboard parity:** effect fires on focus, not only hover.
- **Reduced motion:** `prefers-reduced-motion` (the OS-level "reduce motion"
  setting, honored by Chrome/macOS/Windows/Android — relevant for photosensitive
  users) disables both the displacement and the chromatic animation, degrading
  gracefully to the existing opacity hover.

## Out of scope

- `SocialLinks` (icons).
- Any new shared link component (approach C).

## Verification

- `npm run tsc` — type-check passes.
- `npm run lint` — lint passes.
- Manual: glitch fires on hover **and** keyboard focus for Read more, Contact,
  Back, work-detail nav, contact email/phone, and mobile nav labels.
- Manual: with OS "reduce motion" enabled, the wobble/color-split does not fire
  and the opacity hover still works.
