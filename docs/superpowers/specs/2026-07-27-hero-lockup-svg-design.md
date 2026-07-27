# Hero wordmark + tagline as one scaling SVG

## Context

The homepage hero renders the "UDOCU" wordmark (`UdocuLogo`, an SVG with `viewBox="0 0 1042 562"`) and the tagline ("Om niet te vergeten wie u was") as two separate elements:

- `UdocuLogo` is sized via responsive Tailwind classes (`h-auto w-[90vw] md:h-[48vh] md:w-auto md:max-w-[92vw]`) and scales continuously with the viewport.
- The tagline is a plain `<h1>` styled with fixed Tailwind text utilities (`text-4xl` on mobile, `md:text-[80px] md:whitespace-nowrap`). Its size is decoupled from the logo's — it doesn't grow/shrink in sync as the viewport changes, and its rendered width has no fixed relationship to the wordmark's width.

Decision: merge both into a single SVG so they share one coordinate space and one scaling factor, and use SVG's `textLength`/`lengthAdjust` to force the tagline to render at exactly the wordmark's width on one line, at every screen size.

## Decisions

1. **New component, not a change to `UdocuLogo.tsx`.** `UdocuLogo` is also used standalone (small, no tagline) in `StickyNav.tsx` and `DetailNav.tsx`. A new hero-only component, `src/components/HeroLockup.tsx`, composes the two; `UdocuLogo.tsx` is untouched.
2. **Tagline stays real text**, rendered as an SVG `<text>` element (not converted to outline paths). `textLength={1042}` + `lengthAdjust="spacingAndGlyphs"` pins its rendered width to exactly the wordmark's width regardless of copy length, and it keeps using the actual EB Garamond webfont (`font-family: var(--font-garamond)`) via the CSS custom property already available on the page.
3. **Wordmark is reused by SVG nesting**, not path duplication: `<UdocuLogo x={0} y={0} width={1042} height={562} .../>` is nested as a child `<svg>` inside `HeroLockup`'s outer `<svg>`. `UdocuLogo`'s existing `SVGProps` spread already supports `x`/`y`/`width`/`height`, so no changes are needed to that component.
4. **Accessibility**: the outer `<svg>` is `aria-hidden="true"` (decorative, as `UdocuLogo` already is elsewhere). `HeroLockup` also renders a visually-hidden but real `<h1 className="sr-only">{tagline}</h1>` so the tagline stays present as accessible/SEO text — matching the existing pattern where `UdocuLogo` is `aria-hidden` and the accessible label comes from a sibling (`Link aria-label`).
5. **Sizing moves onto the single outer `<svg>`.** The responsive classes currently on `UdocuLogo` in the hero (`w-[90vw]` mobile / `md:h-[48vh] md:w-auto md:max-w-[92vw]` desktop) move to `HeroLockup`'s outer `<svg>`. Because the wordmark and tagline now share one viewBox, any responsive size change scales both proportionally, at every breakpoint and browser zoom level — this is the actual fix for the reported bug.
6. **Exact numbers (viewBox height, gap between wordmark/tagline, tagline's local font-size, mobile vs. desktop size percentages) are tuned empirically**, not decided up front: implement with reasonable starting values, then render the homepage with Playwright at a spread of viewport sizes (mobile through ultra-wide, matching the verification approach used for the previous hero fix), screenshot, and adjust. Starting point for the local tagline font-size: chosen so the tagline's _natural_ (untransformed) width is already close to 1042 units, minimizing how much `lengthAdjust="spacingAndGlyphs"` has to stretch/compress letterforms.
7. **Mobile legibility check**: since the tagline's size is no longer set independently (previously a fixed `text-4xl` regardless of viewport), tying it to the same `w-[90vw]` scale factor as the logo could render it smaller than today on narrow phones. If the empirical check shows this, adjust the mobile sizing class on the outer `<svg>` (e.g. a larger vw percentage) to keep the tagline comfortably legible — the logo growing slightly to match is an acceptable side effect.

## Changes

- `src/components/HeroLockup.tsx` (new): renders the sr-only `<h1>` + the combined `<svg>` (nested `UdocuLogo` + `<text>` tagline). Accepts a `tagline: string` prop.
- `src/app/[locale]/page.tsx`: replace the current hero markup block (the `<div className="flex flex-col items-center">` containing `UdocuLogo` + `<h1>`) with `<HeroLockup tagline={t("tagline")} />`.
- `src/components/UdocuLogo.tsx`: unchanged.
- `src/components/StickyNav.tsx`, `src/components/DetailNav.tsx`: unchanged.

## Testing

- Visual verification via a throwaway Playwright script (as used for the previous hero-overflow fix): screenshot across a spread of viewport widths/heights (mobile ~360-390px wide, common laptop/desktop sizes, up to ~2560px wide) and confirm:
  - The tagline always renders on one line at exactly the wordmark's width.
  - Neither the wordmark nor the tagline is clipped vertically or horizontally at any tested size.
  - The tagline stays legible (not excessively small) on narrow mobile widths.
- `npm run lint` and `npm run tsc` must pass on the changed files.

## Out of scope

- Any change to `UdocuLogo.tsx` itself or its other call sites (nav bars).
- Localizing the tagline beyond the current single `nl` locale (unrelated to this change; see the separate single-locale-nl spec).
- Converting the tagline to static outline paths (considered and rejected — `textLength` achieves the exact-width goal without sacrificing live/editable text).
