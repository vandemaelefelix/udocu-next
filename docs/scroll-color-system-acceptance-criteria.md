# Scroll Colour System — Acceptance Criteria

This document defines the exact expected behaviour of the scroll-driven colour system.
An agent should implement and verify every criterion below before considering the feature done.

---

## Colour Map

| Context                                     | Background           | Text & Icons           |
| ------------------------------------------- | -------------------- | ---------------------- |
| **Hero section** (full-screen video, no bg) | — (not set)          | `#aed473` (green)      |
| **About section**                           | `#3e0202` (Bordeaux) | `#b496d6` (purple)     |
| **Who Am I section**                        | `#686121` (olive)    | `#aed473` (green)      |
| **Work section**                            | `#2d5f63` (teal)     | `#c5e8e6` (light teal) |
| **Contact section**                         | `#5c2800` (brown)    | `#da551c` (orange)     |

The menu overlay always uses the **same background and text colour as the current section**.
The one exception is the hero, which has no section colour — the menu opened from the hero uses Bordeaux `#3e0202` background and purple `#b496d6` text.

---

## Acceptance Criteria

### AC1 — Section backgrounds are correct

Each section's background `div` (driven by `ScrollBackground`) shows the colour defined in the colour map above. Verified by scrolling to each section and inspecting the background.

- About: `#3e0202` from the first pixel of the section being visible.
- Who Am I: `#686121`
- Work: `#2d5f63`
- Contact: `#5c2800`

### AC2 — About section is Bordeaux from the first pixel

The About section must never show green. The moment any part of the About section enters the viewport (even at the bottom), its background is already `#3e0202`. There is no green-to-Bordeaux fade or flash.

> **Implementation note:** `bgColor` in `ScrollColorContext` must never be set to green (`#aed473`). Green is only ever used as a text/nav colour, not a background colour. The context defaults and `HERO_STOP.bg` must remain Bordeaux.

### AC3 — Section transitions are smooth

Colour transitions between consecutive sections (About→Who Am I, Who Am I→Work, Work→Contact) are smooth and driven by scroll position. The existing lerp/smoothstep logic handles this.

### AC4 — Hero → About is an immediate snap

When scrolling from the hero into About there is no colour fade or transition on the `ScrollBackground` div. The div is Bordeaux as soon as it enters the viewport. (The hero is covered by the video so the div background is hidden; this is about ensuring no green bleeds in.)

### AC5 — Overscroll background matches Safari chrome colour

The `html` and `body` element `backgroundColor` (visible when bouncing at top/bottom of page on mobile) must always match the Safari chrome colour — i.e. the same value as `meta[name="theme-color"]`. `ThemeColorSync` sets this via `document.documentElement.style.backgroundColor` and `document.body.style.backgroundColor`.

| Section  | Overscroll colour    |
| -------- | -------------------- |
| Hero     | `#686121` (olive)    |
| About    | `#3e0202` (Bordeaux) |
| Who Am I | `#686121` (olive)    |
| Work     | `#2d5f63` (teal)     |
| Contact  | `#5c2800` (brown)    |

### AC6 — Safari browser chrome follows section colour

The `theme-color` meta tag is updated on every scroll colour change via `ThemeColorSync`. This controls the Safari top bar and bottom navigation bar colour on iOS.

- On initial load (before JS hydrates), the Safari chrome must already show olive `#686121`. This is controlled by the `viewport.themeColor` static value in `layout.tsx`.
- After hydration, the Safari chrome must visually update as the user scrolls between sections:

| Section  | Chrome colour        |
| -------- | -------------------- |
| Hero     | `#686121` (olive)    |
| About    | `#3e0202` (Bordeaux) |
| Who Am I | `#686121` (olive)    |
| Work     | `#2d5f63` (teal)     |
| Contact  | `#5c2800` (brown)    |

- Simply mutating the `content` attribute of an existing `meta[name="theme-color"]` tag is not sufficient to trigger a Safari chrome repaint. The implementation must remove and re-insert the meta tag on each colour change to force Safari to re-read it.
- Verify on a real iOS Safari device (or Simulator): chrome colour is olive on load, then transitions to the correct section colour as you scroll through About, Who Am I, Work, and Contact.

### AC7 — Menu overlay uses current section colours

Opening the hamburger menu at any scroll position shows an overlay whose background and text match the current section from the colour map.

- Opened from hero: Bordeaux `#3e0202` background, purple `#b496d6` text.
- Opened from About: Bordeaux `#3e0202` background, purple `#b496d6` text.
- Opened from Who Am I: olive `#686121` background, green `#aed473` text.
- Opened from Work: teal `#2d5f63` background, light teal `#c5e8e6` text.
- Opened from Contact: brown `#5c2800` background, orange `#da551c` text.

### AC8 — Hamburger X button matches overlay text colour

When the menu is open, the X icon (three lines that rotate into a cross) must be the same colour as the overlay nav links. It must not be green when opening the menu from the hero section.

- From hero or About: X is purple `#b496d6`.
- From Who Am I: X is green `#aed473`.
- From Work: X is light teal `#c5e8e6`.
- From Contact: X is orange `#da551c`.

### AC9 — Contact section right panel text is orange

The name, email, phone number, address, and social icons in the right half of the Contact section use orange `#da551c`. The class `text-white` must not appear on that container.

### AC10 — Sticky nav logo and links follow text colour

The `UdocuLogo` and desktop nav links use `textColor` from `ScrollColorContext` at all times:

- On hero: green `#aed473`.
- On About: purple `#b496d6`.
- On Who Am I: green `#aed473`.
- On Work: light teal `#c5e8e6`.
- On Contact: orange `#da551c`.

---

## Verification Checklist

Before marking done, manually (or via Playwright) verify each of the following:

- [ ] AC1: Scroll to each section, confirm background colour matches the map.
- [ ] AC2: Scroll slowly from hero into About — no green visible in About at any point.
- [ ] AC3: Scroll through all sections — transitions are smooth between sections.
- [ ] AC4: Hero → About boundary — no colour fade on the div, immediate Bordeaux.
- [ ] AC5: Overscroll (bounce) at top and bottom — body/html bg matches the chrome colour table (olive on hero, Bordeaux on About, etc.).
- [ ] AC6: Inspect `meta[name="theme-color"]` content in DevTools at each section — value matches bg colour. On a real iOS Safari device (or Simulator), confirm chrome colour updates visually as you scroll between sections.
- [ ] AC7: Open menu from each section — overlay bg and text match the colour map.
- [ ] AC8: Open menu from hero — X button is purple, not green.
- [ ] AC9: Scroll to Contact — right panel text and icons are orange.
- [ ] AC10: Scroll through all sections — nav logo and links change colour correctly.

---

## Key Implementation Constraints

1. `bgColor` in `ScrollColorContext` must **never** be green. Green is a text/accent colour only.
2. `HERO_STOP.bg` in `ScrollBackground` must be `[62, 2, 2]` (Bordeaux).
3. Context defaults (`DEFAULT_BG`, `DEFAULT_TEXT`) must be Bordeaux and purple respectively.
4. The `viewport.themeColor` static seed in `layout.tsx` must be `#686121` (olive) — matching the hero chrome colour.
5. `ThemeColorSync` handles body/html background and theme-color meta — it reads `bgColor` from context and applies it, no separate hero logic needed.
6. The menu overlay already reads `bgColor` from context — no separate colour needed if `bgColor` is always a section colour.
