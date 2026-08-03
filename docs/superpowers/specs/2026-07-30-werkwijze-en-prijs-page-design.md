# "Procedure en prijs" page

## Context

The site is live and drawing compliments on design, but visitors keep asking for more practical information, and several have said they miss a price. The price was deliberately left off to avoid scaring people away with a large number.

Kurt has asked for a new rubriek, "Procedure en prijs", and supplied finished copy: 13 numbered points covering how the conversation is structured, how the filming works, what gets delivered, and what it costs. The standard price is 900 euro, one USB stick included, 20 euro per extra stick, travel kept to a minimum, invoiced without VAT.

Two constraints shape the design:

1. **The copy is used as written.** No rewriting, no invented headings, no restructuring of his sentences. Presentation is ours to decide; wording is not.
2. **The homepage scroll is not touched.** The single-page scroll (`ScrollBackground`, the `-mt-[100vh]` section overlaps, `ScrollColorContext`) was recently tuned for LCP and scroll behaviour. Weaving a new section into it needs its own design pass and a new colour stop, so it is deferred.

## Decisions

1. **Nav-only page, no homepage section.** The page behaves exactly like `blog` does today: an entry in `NAV_ITEMS`, no entry in `SECTION_IDS`, no scroll choreography touched. A homepage teaser section remains desirable and is planned as a separate follow-up.
2. **Route `/werkwijze`. Nav label "WERKWIJZE". Page `<h1>` "Procedure en prijs".** The nav label does not need to match the page title, and here it cannot: see decision 5.
3. **The price is lifted above point 1.** Kurt's point 13 is rendered first, as an unnumbered lead block, with points 1 through 12 following in his order. This is reordering, not editing; his wording is untouched. The complaint being fixed is that the price is unfindable, and ending roughly 1100 words on it would not fix that.
4. **The numerals become the design.** Points 1 through 12 render with large Posterman numerals as anchors. Posterman currently does no work on detail pages, and a numbered structure gives a long text visual rhythm and scannability without adding a single word.
5. **The desktop nav breakpoint moves from `md` to `lg`.** This is required, not cosmetic. The current five labels total roughly 415px of text plus 96px of `gap-6`, and with the logo (`md:max-w-36`) and `px-8` padding that leaves only about 50px of slack at 768px where `md:flex` currently engages. "WERKWIJZE" needs roughly 115px including its gap, so a sixth item overflows at md. Tablets fall back to the existing full-screen overlay, which already handles any number of items and gives headroom for the deferred homepage section too. (Widths are estimated from font metrics; verify in-browser during implementation.)
6. **Copy lives in `messages/nl.json`.** Consistent with the rest of the site. Kurt expects to reread and correct the text, so each revision is an edit plus a deploy. Prismic was considered and rejected to avoid splitting the site's copy across two systems.
7. **Colour scheme `bg-blue-dark text-blue-light`.** Theme Pair 4 (`#2d5f63` / `#c5e8e6`) is the only pair unused by an existing detail page. About is red, Wie ben ik is green. The cooler pair also suits a practical page next to two emotional ones.

## Changes

### New route

- `src/app/[locale]/werkwijze/page.tsx`, built on `DetailPage` with `backHref="/"`, `colorScheme="bg-blue-dark text-blue-light"`, and `generateMetadata` following the pattern in `about/page.tsx`.
- Body renders as: the price lead block, then an `<ol className="list-none">` of points 1 through 12. Each `<li>` carries an `aria-hidden` Posterman numeral (left gutter on desktop, above the paragraph on mobile) alongside the serif body. The real `<ol>` is kept so assistive tech still announces list position rather than relying on decorative numerals.
- Point 3 is the one point supplied as two paragraphs. Store multi-paragraph points with `\n\n` between paragraphs in the JSON and split at render, the pattern `ContactSection.tsx:62` already uses for `contact.overlay`. This keeps the shape uniform if Kurt splits other points during his rereads.

### Copy

- New `werkwijze` namespace in `messages/nl.json`: `title`, `price` (Kurt's point 13), and `point1` through `point12`, all verbatim.
- `nav.werkwijze` label: `"Werkwijze"`.
- `metadata.werkwijzeTitle` and `metadata.werkwijzeDescription`.

### Navigation

- `StickyNav.tsx:13` and `DetailNav.tsx:20`: add `"werkwijze"` to `NAV_ITEMS`, positioned after `"work"` and before `"contact"`, so practical information sits immediately before the call to act. `SECTION_IDS` is unchanged.
- Both files currently special-case the single page-link with `item === "blog" ? <Link href="/blog"> : <a href={`#${item}`}>`, repeated across four render sites (desktop list and overlay list in each component). With a second page-link this becomes a compound condition in four places. Replace it with a module-scoped `PAGE_HREFS: Record<string, string>` lookup (`{ blog: "/blog", werkwijze: "/werkwijze" }`) and branch on `PAGE_HREFS[item]`. Targeted cleanup of code the change touches; no wider nav refactor.
- Breakpoint move: `md:flex` becomes `lg:flex` on the desktop `<ul>` in both components; `md:hidden` becomes `lg:hidden` on the hamburger button and the overlay container in both components.

### SEO

- `src/app/sitemap.ts`: add `{ path: "/werkwijze", priority: 0.8, changeFrequency: "monthly" }` to the static entries.
- `src/app/llms.txt/route.ts` and `llms-full.txt/route.ts`: add the page to the listed routes.

### Cover media

`DetailPage` takes an optional `image` or `media`. About uses the video, Wie ben ik uses the portrait. **This page wants an asset and Kurt has to supply it.** The natural fit is a behind-the-scenes photograph of the small cameras and tripods set up in a living room, which illustrates his points 3 and 9 directly.

The page ships without a cover rather than waiting on the photo. Reusing an existing static image would mean putting an unrelated picture on the page (the only candidates are the contact photo and the Kurt portrait), and the Fragmenten stills are Prismic assets on `interview` documents rather than static imports, so borrowing one would mean a Prismic fetch for a placeholder. Instead, `DetailPage`'s cover block becomes conditional so the page renders cleanly with no cover at all, and Kurt's photograph drops in later as `image={...}` with no other change.

### Testing

- The Playwright projects use 1280px and phone-sized viewports (`Pixel 5`, `iPhone 12`) with no tablet project in between, so the `md` to `lg` breakpoint move does not invalidate the hardcoded 768px desktop/mobile checks in `tests/navigation/`. Confirm the suite still passes rather than assuming it.
- Add a navigation test covering that the Werkwijze link is present in both nav components and routes to `/werkwijze`.
- `npm run tsc` and `npm run lint` must pass.

## Out of scope

- **The homepage teaser section.** Deferred deliberately. It needs its own visual design, a `ScrollColorContext` stop, and a place in the `-mt-[100vh]` overlap sequence. Until it exists, the price is only reachable via the menu, which partially addresses the original complaint.
- **A business audience.** Kurt noted 900 euro reads differently to a company than to a private person. Nothing in the supplied copy speaks to a business buyer, and the site's framing is entirely personal. Separate decision, separate work.
- **Prismic-backed copy** for this page (rejected in decision 6).
- **Copy edits.** Four passages were flagged as working against the sale: the 4K justification reads as an apology, "in het opstartjaar" undercuts the forty-years-of-journalism positioning, "dat is een aanzienlijk bedrag voor een doorsneemens" argues against the price before the buyer does, and the floppy-disk passage is a long aside mid-decision. Kurt has said he will reread the text himself. Recorded here only so the observation is not lost.
- **Unanswered buyer questions** in the supplied copy: delivery lead time, how to actually book, and whether 900 euro covers one person or a couple. Worth raising with Kurt, but not blocking this page.
