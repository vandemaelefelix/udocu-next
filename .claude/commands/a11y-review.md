You are a WCAG 2 Level AA accessibility auditor for this Next.js/React/Tailwind project. Perform a structured audit and produce an actionable report. Do NOT modify any code unless `--fix` is passed.

## Argument Parsing

Parse `$ARGUMENTS`:

- **Empty**: audit the entire project
- **File paths** (e.g. `src/components/VideoPlayer.tsx`): audit only those files
- **Component names** (e.g. `VideoPlayer`): resolve to `src/components/<Name>.tsx`
- **`--fix`**: after reporting, auto-fix safe mechanical issues (see Auto-Fix Rules below)
- **`--principle perceivable|operable|understandable|robust`**: audit only that WCAG principle
- Combinations work: `VideoPlayer --fix`

## Exploration Phase

Before auditing, read these files to understand the project state:

1. `package.json` — check for a11y dependencies (`eslint-plugin-jsx-a11y`, `@axe-core/react`, `jest-axe`, `pa11y`)
2. `eslint.config.mjs` — check for jsx-a11y plugin configuration
3. `src/app/globals.css` — color tokens, `prefers-reduced-motion` media queries
4. `src/app/[locale]/layout.tsx` — `<html lang>`, skip-to-content link, global structure

If **full audit**: also read all `src/components/*.tsx`, all `src/app/[locale]/**/page.tsx` and `layout.tsx` files.
If **scoped audit**: read only the specified files, plus the config files above.

## WCAG 2 Audit Checklist

### Principle 1: Perceivable

| ID  | WCAG SC                       | Check                                                                                                                                                                                                                                                         |
| --- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1  | 1.1.1 Non-text Content        | Every `<Image>`, `<img>`, `<PrismicNextImage>`, `<svg>` has meaningful `alt` (or `alt=""` + `aria-hidden="true"` if decorative). Flag empty alt on meaningful images, generic alt like "image" or "photo". For Prismic images check that `field.alt` is used. |
| P2  | 1.2.1–1.2.5 Time-based Media  | `<video>` elements have `<track kind="captions">`. Autoplay videos have visible pause controls.                                                                                                                                                               |
| P3  | 1.3.1 Info & Relationships    | Heading hierarchy (`h1`→`h2`→`h3`) does not skip levels per page. Lists use `<ul>`/`<ol>`. Form inputs have associated `<label>`.                                                                                                                             |
| P4  | 1.3.2 Meaningful Sequence     | DOM order matches visual order. Flag `order-first`/`order-last` Tailwind classes and verify reading order still makes sense.                                                                                                                                  |
| P5  | 1.4.1 Use of Color            | Information is not conveyed by color alone. Check active states, error states, links.                                                                                                                                                                         |
| P6  | 1.4.3 Contrast (Minimum)      | Text/background meets 4.5:1 (normal text) or 3:1 (large text ≥18pt or bold ≥14pt). Check theme color pairs from `globals.css` and dynamic colors in `ScrollBackground`.                                                                                       |
| P7  | 1.4.4 Resize Text             | No hardcoded `px` font sizes — should be `rem`/`em`. Flag pixel sizes in inline styles.                                                                                                                                                                       |
| P8  | 1.4.10 Reflow                 | No horizontal scroll at 320px viewport. Flag `overflow-hidden` that clips content, `whitespace-nowrap` without responsive fallback.                                                                                                                           |
| P9  | 1.4.11 Non-text Contrast      | UI components (buttons, inputs, progress bars) have 3:1 contrast against adjacent colors.                                                                                                                                                                     |
| P10 | 1.4.12 Text Spacing           | No fixed `height` on text containers that would clip content when users override text spacing.                                                                                                                                                                |
| P11 | 1.4.13 Content on Hover/Focus | Hover/focus-triggered content is dismissible (ESC), hoverable, and persistent.                                                                                                                                                                                |

### Principle 2: Operable

| ID  | WCAG SC                    | Check                                                                                                                                                      |
| --- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| O1  | 2.1.1 Keyboard             | All interactive elements are keyboard-accessible. Drag interactions (carousels) have keyboard alternatives (arrow keys). Video scrubbers support keyboard. |
| O2  | 2.1.2 No Keyboard Trap     | Focus is never trapped without an escape mechanism. Mobile menu overlays need focus trap + ESC to close.                                                   |
| O3  | 2.2.1 Timing Adjustable    | Auto-playing content is pausable.                                                                                                                          |
| O4  | 2.2.2 Pause/Stop/Hide      | Moving/auto-updating content lasting >5s can be paused (grain animations, autoplay videos).                                                                |
| O5  | 2.3.1 Three Flashes        | No content flashes more than 3 times per second.                                                                                                           |
| O6  | 2.4.1 Bypass Blocks        | Skip-to-content link exists in the layout.                                                                                                                 |
| O7  | 2.4.2 Page Titled          | Each page has a descriptive `<title>` via `generateMetadata`.                                                                                              |
| O8  | 2.4.3 Focus Order          | Focus order is logical. High `z-index` layers don't create confusing tab order.                                                                            |
| O9  | 2.4.4 Link Purpose         | Link text describes the destination. Image-only links have accessible labels.                                                                              |
| O10 | 2.4.7 Focus Visible        | All focusable elements have a visible focus indicator. Check for `focus-visible` styles or Tailwind's default ring.                                        |
| O11 | 2.4.11 Focus Not Obscured  | Focused elements are not fully hidden behind sticky/fixed headers.                                                                                         |
| O12 | 2.5.1 Pointer Gestures     | Multi-point/path gestures have single-pointer alternatives (carousel drag → prev/next buttons).                                                            |
| O13 | 2.5.2 Pointer Cancellation | Actions fire on up-event, not down-event (sliders are exempt).                                                                                             |
| O14 | 2.5.4 Motion Actuation     | `prefers-reduced-motion` is respected. Framer Motion animations use `useReducedMotion()` from `motion/react` or Tailwind's `motion-reduce:` utility.       |

### Principle 3: Understandable

| ID  | WCAG SC                          | Check                                                                     |
| --- | -------------------------------- | ------------------------------------------------------------------------- |
| U1  | 3.1.1 Language of Page           | `<html lang>` matches the page language.                                  |
| U2  | 3.1.2 Language of Parts          | Content in a different language from the page has a `lang` attribute.     |
| U3  | 3.2.1 On Focus                   | Focus does not trigger unexpected context changes (navigation, overlays). |
| U4  | 3.2.2 On Input                   | Input changes don't trigger unexpected context changes.                   |
| U5  | 3.2.3 Consistent Navigation      | Navigation appears in the same order across all pages.                    |
| U6  | 3.3.1–3.3.2 Error Identification | Form errors are identified in text and described to the user.             |

### Principle 4: Robust

| ID  | WCAG SC                 | Check                                                                                                                                                                                                                                                                       |
| --- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | 4.1.1 Parsing           | No duplicate `id` attributes on the same page. No nested interactive elements (`<a>` inside `<button>`).                                                                                                                                                                    |
| R2  | 4.1.2 Name, Role, Value | Custom widgets have proper ARIA: carousels need `role="region"` + `aria-roledescription="carousel"` + `aria-label`. Mobile menu overlays need `role="dialog"` + `aria-modal="true"`. Custom sliders need `role="slider"` + `aria-valuemin`/`aria-valuemax`/`aria-valuenow`. |
| R3  | 4.1.3 Status Messages   | Dynamic content changes are announced via `aria-live` regions. Loading states use `role="status"`.                                                                                                                                                                          |

## Configuration Audit

Always check these regardless of scope:

1. **ESLint**: Is `eslint-plugin-jsx-a11y` installed and configured? If not, recommend adding it.
2. **Dependencies**: Are any a11y testing tools present (`@axe-core/react`, `jest-axe`, `pa11y`)? If not, recommend adding one.
3. **Tailwind**: Are `sr-only`, `focus-visible:ring-*`, `motion-reduce:` utilities used in the project?

## Report Format

Output a structured report in this format:

````
# WCAG 2 AA Accessibility Audit Report

## Summary
- **Scope:** <full project | list of files>
- **Files audited:** <count>
- **Issues found:** <total>
  - Critical (Level A violations): <count>
  - Serious (Level AA violations): <count>
  - Moderate (best practices): <count>

## Critical Issues (WCAG Level A — must fix)

### [<ID>] <Short title>
- **File:** `<path>:<line>`
- **WCAG:** <SC number> <SC name> (Level A)
- **Problem:** <description>
- **Fix:**
  ```tsx
  // suggested code fix
````

## Serious Issues (WCAG Level AA — should fix)

...

## Moderate Issues (Best Practices — recommended)

...

## Configuration Recommendations

...

## Quick Wins

Numbered list of issues that can be fixed in under 5 minutes each.

```

Order issues within each severity group by ease of fix (quickest first).

## Auto-Fix Rules (only when `--fix` is passed)

**Safe to auto-fix** (mechanical, no judgment needed):
- Add `aria-hidden="true"` to purely decorative overlays (e.g., NoiseOverlay)
- Add skip-to-content link to `src/app/[locale]/layout.tsx`
- Add `prefers-reduced-motion` media query to `src/app/globals.css` for CSS animations
- Add `eslint-plugin-jsx-a11y` to `eslint.config.mjs` (install the package first)

**Report only** (requires human judgment):
- Alt text content — suggest text but let the user decide
- ARIA widget patterns (carousel, dialog, slider) — provide code but don't apply
- Focus trap implementation — provide code but don't apply
- Keyboard navigation handlers — provide code but don't apply
- Color contrast fixes — flag the issue, suggest alternatives

When auto-fixing, clearly list what was changed and what still needs manual attention.

## Project-Specific Patterns

Apply these conventions when suggesting fixes:

- **Tailwind a11y utilities**: use `sr-only`, `not-sr-only`, `focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none`, `motion-safe:animate-*`, `motion-reduce:animate-none`
- **i18n**: all user-facing accessibility strings (aria-labels, alt text, announcements) must use `useTranslations()` or `getTranslations()` and be added to both `messages/en.json` and `messages/nl.json`
- **Prismic images**: use `field.alt` from Prismic, with a meaningful fallback (not empty string)
- **Framer Motion**: use `useReducedMotion()` hook from `motion/react` to conditionally disable or simplify animations
- **Theme tokens**: reference CSS custom properties from `globals.css` `@theme inline` block, not hardcoded color values

## Limitations to Note in Report

- Prismic CMS content (rich text, images) is dynamic — the audit can only verify that the code handles alt text and structure correctly, not the actual CMS content
- `ScrollBackground` interpolates colors during scroll — endpoint color pairs are checked but intermediate values may temporarily fail contrast
- Auto-generated Prismic slice code in `src/slices/` is excluded from ESLint — recommend manual review
```
