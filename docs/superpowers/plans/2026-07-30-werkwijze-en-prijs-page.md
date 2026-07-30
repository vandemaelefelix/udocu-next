# "Procedure en prijs" Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `/werkwijze` page carrying Kurt's supplied "Procedure en prijs" copy, reachable from the menu, so visitors can find the price without emailing to ask.

**Architecture:** A new detail page built on the existing `DetailPage` shell, added to both nav components as a page-link (the way `blog` already works) with no homepage section and no change to the homepage scroll choreography. The supplied 13 points render as an ordered list with large Posterman numerals, with the price point lifted to the top as an unnumbered lead. Adding a sixth nav item overflows the desktop nav at `md`, so the desktop nav breakpoint moves to `lg` first.

**Tech Stack:** Next.js 16 (App Router, RSC), TypeScript strict, Tailwind CSS v4, next-intl, Playwright.

**Design spec:** `docs/superpowers/specs/2026-07-30-werkwijze-en-prijs-page-design.md`

## Global Constraints

- **Kurt's copy is used verbatim.** Do not rewrite, reword, shorten, correct, or add headings to any of the 13 points. Reordering (the price block moving to the top) is the only permitted change. If a sentence looks wrong, leave it.
- **Copy lives in `messages/nl.json`.** The site is Dutch-only (`routing.ts`: `locales: ["nl"]`). There is no `en.json`; do not create one.
- **No em dash (`—`) in anything you write** (commit messages, code comments, new copy). Existing text that already contains one is left alone.
- Use Tailwind theme tokens from `globals.css` `@theme inline`, never hardcoded colour values.
- Use the `@/*` path alias for imports.
- **The homepage is not touched.** No changes to `src/app/[locale]/page.tsx`, `ScrollBackground`, `ScrollColorContext`, or `SECTION_IDS`.
- Every task ends with `npm run tsc` and `npm run lint` passing.

## File Structure

| File                                           | Responsibility                                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `src/components/StickyNav.tsx` (modify)        | Homepage nav. Gains the sixth item, the `lg` breakpoint, the `PAGE_HREFS` lookup.                            |
| `src/components/DetailNav.tsx` (modify)        | Detail-page nav. Same three changes, kept in sync with `StickyNav`.                                          |
| `src/components/DetailPage.tsx` (modify)       | Detail-page shell. Cover media becomes genuinely optional; overlay colours become forwardable.               |
| `src/components/NumberedPoints.tsx` (create)   | Renders a `string[]` as a numbered `<ol>` with Posterman numerals. Sole responsibility: the numbered layout. |
| `src/app/[locale]/werkwijze/page.tsx` (create) | The route: metadata, price lead block, and the numbered points.                                              |
| `messages/nl.json` (modify)                    | All copy: the `werkwijze` namespace, the `nav.werkwijze` label, the two metadata strings.                    |
| `src/app/sitemap.ts` (modify)                  | Adds `/werkwijze`.                                                                                           |
| `src/app/llms.txt/route.ts` (modify)           | Adds the page link.                                                                                          |
| `src/app/llms-full.txt/route.ts` (modify)      | Adds the page link, and corrects two now-contradicted facts.                                                 |
| `tests/navigation/menu.spec.ts` (modify)       | Existing menu coverage extended to the new item.                                                             |
| `tests/navigation/werkwijze.spec.ts` (create)  | Page-level coverage: renders, price visible, 12 numbered points.                                             |

## Notes on testing

The repo's only test harness is Playwright end-to-end (`playwright.config.ts`, `testDir: "./tests"`). There is no unit-test runner, so genuine test-first cycles apply to Tasks 4 and 5, where an e2e test can fail meaningfully before the code exists. Tasks 1, 2, 3 and 6 are a breakpoint change, a no-behaviour-change refactor, a JSON copy addition, and static text output; those are verified by running the existing suite plus explicit manual checks, which is stated per task.

Playwright auto-starts the dev server (`webServer` in `playwright.config.ts`), so no server needs to be running first. The navigation projects are `navigation-desktop` (1280px Chrome), `navigation-mobile` (Pixel 5), `navigation-webkit` (iPhone 12) and `navigation-webkit-desktop` (1280px Safari), all matching `tests/navigation/**/*.spec.ts`.

---

### Task 1: Move the desktop nav breakpoint from `md` to `lg`

The desktop nav is a `justify-between` row: logo plus five uppercase labels at `text-sm` with `tracking-widest` and `gap-6`. The labels total roughly 415px, the gaps 96px, the logo up to 144px, and `px-8` adds 64px. At 768px, where `md:flex` currently engages, that leaves only about 50px of slack. "WERKWIJZE" needs roughly 115px including its gap, so the sixth item overflows at `md`. Moving the desktop nav to `lg` hands tablets the full-screen overlay, which already handles any number of items.

Do this before adding the nav item, so the nav is never in a broken state.

**Files:**

- Modify: `src/components/StickyNav.tsx:97` (desktop `<ul>`), `:134` (hamburger button), `:163` (overlay container)
- Modify: `src/components/DetailNav.tsx:57` (desktop `<ul>`), `:75` (hamburger button), `:103` (overlay container)

**Interfaces:**

- Consumes: nothing from earlier tasks.
- Produces: no API change. Later tasks rely only on the desktop nav now appearing at `lg` (1024px) rather than `md` (768px).

- [ ] **Step 1: Confirm the current breakpoint behaviour in the browser**

Run `npm run dev`, open `http://localhost:3000`, and set the browser width to 800px. Expected: the five horizontal nav labels are visible and the hamburger is hidden. Note how little space remains to the right of the logo. This is the state you are about to change.

- [ ] **Step 2: Change the three classes in `StickyNav.tsx`**

Line 97, the desktop `<ul>`:

```tsx
<ul className="hidden gap-6 font-helvetica text-sm font-medium uppercase tracking-widest lg:flex lg:gap-8">
```

Line 134, the hamburger `<button>`, change only the trailing `md:hidden`:

```tsx
className =
  "relative z-[60] flex h-8 w-8 flex-col items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 rounded lg:hidden";
```

Line 163, the overlay container, change only `md:hidden`:

```tsx
className={`fixed inset-0 z-50 flex flex-col items-center justify-center lg:hidden ${
  menuOpen ? "pointer-events-auto" : "pointer-events-none"
}`}
```

- [ ] **Step 3: Change the same three classes in `DetailNav.tsx`**

Line 57, the desktop `<ul>` (note this one uses `text-xs`, not `text-sm`):

```tsx
<ul className="hidden gap-6 font-helvetica text-xs font-medium uppercase tracking-widest lg:flex lg:gap-8">
```

Line 75, the hamburger `<button>`:

```tsx
className =
  "relative z-[60] flex h-8 w-8 flex-col items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current focus-visible:ring-offset-2 rounded lg:hidden";
```

Line 103, the overlay container:

```tsx
className={`fixed inset-0 z-50 flex flex-col items-center justify-center lg:hidden ${
  menuOpen ? "pointer-events-auto" : "pointer-events-none"
}`}
```

- [ ] **Step 4: Verify the new behaviour in the browser**

With `npm run dev` running, check three widths on both `/` and `/about`:

- 800px: hamburger visible, horizontal labels hidden. Clicking the hamburger opens the full-screen overlay.
- 1024px: horizontal labels visible, hamburger hidden.
- 390px: unchanged from before, hamburger visible.

- [ ] **Step 5: Run the existing navigation suite**

Run: `npx playwright test --project=navigation-desktop --project=navigation-mobile`
Expected: PASS. These projects use 1280px and Pixel 5 (393px) viewports with no tablet in between, so both stay on the same side of the breakpoint as before. If anything fails here, the failure is real and not an artifact of the breakpoint move.

- [ ] **Step 6: Type-check and lint**

Run: `npm run tsc && npm run lint`
Expected: both pass with no output errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/StickyNav.tsx src/components/DetailNav.tsx
git commit -m "refactor: move desktop nav breakpoint from md to lg

Makes room for a sixth nav item. At 768px the five current labels plus
gaps and logo left roughly 50px of slack, so a sixth would overflow.
Tablets now get the full-screen overlay, which scales to any item count."
```

---

### Task 2: Replace the `blog` special-case with a `PAGE_HREFS` lookup

Both nav components special-case the single page-link with `item === "blog"`, repeated across four render sites (a desktop list and an overlay list in each component). A second page-link would turn each into a compound condition. Replace with a lookup now, while it is still a pure refactor with no behaviour change.

**Files:**

- Modify: `src/components/StickyNav.tsx:13-19` (constants), `:98-128` (desktop list), `:177-211` (overlay list)
- Modify: `src/components/DetailNav.tsx:20` (constant), `:58-69` (desktop list), `:117-137` (overlay list)

**Interfaces:**

- Consumes: nothing from Task 1 beyond the files being in their post-Task-1 state.
- Produces: `PAGE_HREFS: Record<string, string>` module-scoped in both components. Task 5 adds a key to it. Any nav item present in `PAGE_HREFS` renders as a `next/link` to that path; any item absent renders as a homepage-section link.

- [ ] **Step 1: Add the constant to `StickyNav.tsx`**

Directly below `SECTION_IDS` (line 19), add:

```tsx
// Nav entries that link to their own page instead of scrolling to a homepage
// section. Module-scoped for the same reason as SECTION_IDS: StickyNav
// re-renders ~60x/sec during scroll and a fresh object each render is waste.
const PAGE_HREFS: Record<string, string> = {
  blog: "/blog",
};
```

- [ ] **Step 2: Use it in the `StickyNav` desktop list**

Replace the body of the desktop `NAV_ITEMS.map` (lines 98-128) with:

```tsx
{
  NAV_ITEMS.map((item) => {
    const label = t(item);
    const pageHref = PAGE_HREFS[item];
    return pageHref ? (
      <li key={item}>
        <Link
          href={pageHref}
          className="focus-visible:opacity-70 focus-visible:outline-none"
        >
          <GlitchText>{label}</GlitchText>
        </Link>
      </li>
    ) : (
      <li key={item}>
        <a
          href={`#${item}`}
          aria-current={item === activeSection ? "true" : undefined}
          className={`focus-visible:opacity-70 focus-visible:outline-none ${
            item === activeSection ? "underline underline-offset-4" : ""
          }`}
          onClick={(e) => {
            e.preventDefault();
            scrollToSection(item);
          }}
        >
          <GlitchText>{label}</GlitchText>
        </a>
      </li>
    );
  });
}
```

- [ ] **Step 3: Use it in the `StickyNav` overlay list**

Replace the body of the overlay `NAV_ITEMS.map` (lines 177-211) with:

```tsx
{
  NAV_ITEMS.map((item, index) => {
    const animationStyle = menuOpen
      ? { animation: `menu-link-in 280ms ease-out ${index * 60}ms both` }
      : { animation: "none" };
    const pageHref = PAGE_HREFS[item];
    return pageHref ? (
      <li key={item} style={animationStyle}>
        <Link
          href={pageHref}
          tabIndex={menuOpen ? 0 : -1}
          className="focus-visible:opacity-70 focus-visible:outline-none"
          onClick={() => setMenuOpen(false)}
        >
          <GlitchText>{t(item)}</GlitchText>
        </Link>
      </li>
    ) : (
      <li key={item} style={animationStyle}>
        <a
          href={`#${item}`}
          tabIndex={menuOpen ? 0 : -1}
          aria-current={item === activeSection ? "true" : undefined}
          className={`focus-visible:opacity-70 focus-visible:outline-none ${
            item === activeSection ? "underline underline-offset-4" : ""
          }`}
          onClick={handleNavClick}
        >
          <GlitchText>{t(item)}</GlitchText>
        </a>
      </li>
    );
  });
}
```

- [ ] **Step 4: Add the constant to `DetailNav.tsx`**

Directly below `NAV_ITEMS` (line 20), add:

```tsx
// Keep in sync with StickyNav. Nav entries that link to their own page
// instead of a homepage section anchor.
const PAGE_HREFS: Record<string, string> = {
  blog: "/blog",
};
```

- [ ] **Step 5: Use it at both `DetailNav` render sites**

`DetailNav` renders every item as a `<Link>` already, so both sites need only the `href` expression changed. Line 61 and line 126 currently read:

```tsx
href={item === "blog" ? "/blog" : `/#${item}`}
```

Both become:

```tsx
href={PAGE_HREFS[item] ?? `/#${item}`}
```

- [ ] **Step 6: Verify no behaviour changed**

Run: `npx playwright test --project=navigation-desktop --project=navigation-mobile`
Expected: PASS. This refactor must not alter a single rendered href. `tests/navigation/menu.spec.ts` asserts the exact href of every item on the homepage, a detail page, and the blog overview, on both mobile and desktop, which is precisely the coverage this needs.

- [ ] **Step 7: Type-check and lint**

Run: `npm run tsc && npm run lint`
Expected: both pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/StickyNav.tsx src/components/DetailNav.tsx
git commit -m "refactor: replace blog nav special-case with PAGE_HREFS lookup

The item === 'blog' ternary was repeated across four render sites. A
lookup keeps it to one place now that a second page-link is coming."
```

---

### Task 3: Add the copy to `messages/nl.json`

Kurt's 13 points, verbatim. Point 13 becomes the `price` key (rendered as the lead block); points 1 to 12 keep their numbering as `point1` through `point12`.

Multi-paragraph points store `\n\n` between paragraphs and are split at render, the pattern `ContactSection.tsx:62` already uses for `contact.overlay`. Point 3 is the only supplied point with two paragraphs; the convention is applied uniformly so Kurt can split others during his rereads without a code change.

**Files:**

- Modify: `messages/nl.json`

**Interfaces:**

- Consumes: nothing.
- Produces: the `werkwijze` namespace with keys `title`, `price`, `point1` through `point12`; the `nav.werkwijze` label; `metadata.werkwijzeTitle` and `metadata.werkwijzeDescription`. Task 4 reads all of these via `getTranslations("werkwijze")` and `getTranslations({ locale, namespace: "metadata" })`. Task 5 reads `nav.werkwijze` via the existing `useTranslations("nav")`.

- [ ] **Step 1: Add the `werkwijze` namespace**

Insert this block into `messages/nl.json` after the `contact` object and before `blog`. Copy it exactly; do not fix spelling, spacing or punctuation.

```json
  "werkwijze": {
    "title": "Procedure en prijs",
    "price": "De standaardprijs is 900 euro. Dat is een aanzienlijk bedrag voor een doorsneemens, maar weinig als je bedenkt dat er minstens 3, soms 4 of zelfs 5 dagen werk in zit. In die prijs zit 1 stick inbegrepen, waarop de opnamen. Bovenop komt nog 20 euro per stick die ik aanlever met het eindresultaat. Verplaatsingskosten worden tot een minimum beperkt. In de mate van het mogelijke reis ik met het openbaar vervoer. In het opstartjaar heb ik wel al een BTW-nummer, maar ik geniet nog van een vrijstelling van BTW, dus ik factureer zonder btw.",
    "point1": "Ik volg een zeker stramien om het gesprek te voeren. Dat verschilt natuurlijk van mens tot mens, maar doorgaans komen er een tien à vijftien thema's aan bod (soms onderverdeeld in nog een aantal verschillende blokken), die de geïnterviewde in staat stellen om een goed beeld te schetsen van zichzelf. De bedoeling is om de essentie te vatten van de mens voor de camera's.",
    "point2": "Doorgaans bespreken we zo weinig mogelijk vooraf, omdat de spontaniteit belangrijk is. Maar als er bepaalde thema's zijn die je absoluut aan bod wil laten komen, moet je dat zeker vermelden. Want jij bepaalt wat er gezegd wordt. Vaak krijg ik de vraag van volwassen kinderen om hun vader of moeder te interviewen. Natuurlijk moeten ze dan zelf wel checken of die persoon bereid is om zo'n interview te doen. In een uitzonderlijk geval ga ik de persoon in kwestie zelf uitleggen hoe ik tewerk ga.",
    "point3": "Het gesprek wordt vanuit verschillende standpunten gefilmd om de opnamen wat vaart te geven, de babbel vloeiend te laten gebeuren. Een hapering kan gerust, maar storende haperingen of passages die de betrokkene liever niet ziet worden geknipt.\n\nEr wordt doorlopend met drie of vier verschillende camera's gefilmd. Niet in 4 K, ook al omdat het inladen en het renderen van de beelden een gigantisch werk maken. Nee, gewoon in 1080p Full HD.",
    "point4": "De opname gaat naar wie het gesprek heeft besteld. De afnemer doet met het resultaat wat hij of zij wil. Maar een echt openhartige babbel wordt best niet online gezwierd. Sommigen zullen de opnamen misschien meteen tonen aan de naaste geliefden, anderen zullen ze jaren wegleggen of misschien pas naar boven laten komen na hun dood.",
    "point5": "Waar en wanneer gebeuren de opnamen? Op een plek waar het rustig is en waar de geïnterviewde zich op haar of zijn gemak voelt. Dat kan thuis zijn, maar ook op een andere locatie waar een rustig gesprek mogelijk is. Zelfs een park of een bos kan, als je daar met rust wordt gelaten en kan praten.",
    "point6": "Reken voor de start een uurtje om de juiste plekken voor het gesprek te bepalen en alle benodigdheden op te stellen.",
    "point7": "De opnamen verlopen eveneens rustig. Wie aan het woord is, moet zich kunnen ontspannen. We doen een lang interview en dat gebeurt hoofdzakelijk zittend. Alleen de geïnterviewde komt in beeld. De vragen worden er zoveel mogelijk uitgeknipt. Bij eerdere opnamen is het al vaker gebeurd dat we er 's morgens aan beginnen, 's middags een pauze inlassen (voor een eventueel middagdutje) en na de middag doorgaan.",
    "point8": "Er kan natuurlijk op verschillende plaatsen in een huis of ander pand gedraaid worden. Als een geïnterviewde graag kookt en een en ander wil demonstreren, dan kan dat. Als een geïnterviewde een auto wil laten zien of een fiets, een wijnkelder, een bibliotheek… dan kunnen we daar uiteraard tussendoor even naar gaan kijken… Een deel van het gesprek kan bijvoorbeeld in de woonkamer, de keuken, het bureau… of de tuin gedraaid worden. Een nabije locatie kan ook nog wel, maar geen verre verplaatsingen tussendoor.",
    "point9": "Ik sleur geen belichting mee, gewoon lichte, kleine camera's en statieven. Ik maak daarnaast wat tussenbeelden op de plek waar we ons bevinden (foto's tegen de muur, schilderijen, beelden die de setting weergeven). En eventueel draai ik nog wat beelden waar de mens in kwestie even gaat wandelen, of in huis met één of ander iets bezig is.",
    "point10": "We draaien wat tussenbeelden op de locatie waar we zijn (de setting, het decor…), maar we gaan niet het hele gesprek illustreren. Er kunnen ter plekke wel een paar foto's gefilmd worden, maar als er een half foto-album in beeld moet komen, moeten we foto's laten scannen en komt er een meerprijs.",
    "point11": "Voor de levering worden enkele passages via een verborgen link doorgemaild. Betaling gebeurt voor of bij levering. Nadien kunnen nog drie weken lang bepaalde passages verwijderd worden, indien je die liever niet in het eindproduct ziet.",
    "point12": "Wat krijgt de klant? Een stick met de volledige film erop. Soms is die opgesplitst in twee delen. De uiteindelijke duur is al vlug twee uren, soms drie of net iets meer. Het eerste wat je best doet na ontvangst is die stick downloaden op je computer en het bestand ook minstens op één harde schijf zetten. En eventueel ook in the cloud. Daarnaast is het een goed idee om dat bestand geregeld eens naar een andere schijf te verplaatsen. En komt er een nieuwe drager uit, dan zet je je file het best over op het nieuwe formaat. Je kent het verhaal van de floppy disk en de cloud. Wellicht komen er ooit tijden dat je het filmpje zal kunnen laten inplanten in je persoonlijk geheugen."
  },
```

- [ ] **Step 2: Add the nav label**

In the `nav` object, add the entry after `"work"`:

```json
    "werkwijze": "Werkwijze",
```

- [ ] **Step 3: Add the metadata strings**

In the `metadata` object, add after `workDescription`:

```json
    "werkwijzeTitle": "Procedure en prijs",
    "werkwijzeDescription": "Hoe een udocu-gesprek verloopt, van de voorbereiding en de opnamen tot de levering. Inclusief de standaardprijs van 900 euro.",
```

Note: `werkwijzeDescription` is new copy written for search-result snippets, not part of Kurt's supplied text. Kurt should see it in review, since it is the one sentence here he did not write.

- [ ] **Step 4: Verify the JSON is valid**

Run: `node -e "JSON.parse(require('fs').readFileSync('messages/nl.json','utf8')); console.log('valid')"`
Expected: prints `valid`. A stray comma or unescaped character here breaks the whole site at build time, so do not skip this.

- [ ] **Step 5: Spot-check three passages against the source**

Compare the rendered JSON against Kurt's original message for `point3` (the only two-paragraph point, so its `\n\n` must be right), `point8` (contains three `…` ellipsis characters), and `price` (contains the numbers 900, 3, 4, 5, 1 and 20, all of which must survive). Character-for-character.

- [ ] **Step 6: Commit**

```bash
git add messages/nl.json
git commit -m "feat: add Procedure en prijs copy to translations

Kurt's 13 supplied points verbatim, plus nav label and page metadata."
```

---

### Task 4: Build the `/werkwijze` page

Two supporting changes to `DetailPage` come with this task, because the new page is the first consumer that needs them: the cover media block currently renders an empty `aspect-video` box when neither `image` nor `media` is passed, and `DetailNav`'s overlay colours are not forwardable, so a blue page would get the red default overlay.

**Deviation from the spec:** the spec proposed shipping with "a still from the existing Fragmenten set" until Kurt supplies a behind-the-scenes photo. That does not work: those stills are Prismic assets on `interview` documents, not static imports, so using one would mean a Prismic fetch for a placeholder. The page ships with no cover instead, and the guard below makes that render cleanly. Nothing else about the cover-media decision changes: Kurt still owes a photograph, and it drops in as `image={...}` when it arrives.

**Files:**

- Create: `src/components/NumberedPoints.tsx`
- Create: `src/app/[locale]/werkwijze/page.tsx`
- Modify: `src/components/DetailPage.tsx:7-20` (props), `:38` (nav), `:51-71` (cover block)
- Test: `tests/navigation/werkwijze.spec.ts`

**Interfaces:**

- Consumes: from Task 3, `werkwijze.title`, `werkwijze.price`, `werkwijze.point1` through `point12`, `metadata.werkwijzeTitle`, `metadata.werkwijzeDescription`.
- Produces: `NumberedPoints`, a server component with props `{ points: string[] }`, rendering an `<ol>` whose visible numerals are `aria-hidden`. `DetailPage` gains two optional props, `overlayBgColor?: string` and `overlayTextColor?: string`, forwarded to `DetailNav`. The route `/werkwijze` becomes available for Task 5 to link to and Task 6 to list.

- [ ] **Step 1: Write the failing test**

Create `tests/navigation/werkwijze.spec.ts`:

```ts
/**
 * Werkwijze page — the "Procedure en prijs" page renders Kurt's supplied copy,
 * opens on the price, and lists the 12 numbered points.
 *
 * Requires a running dev/preview server (BASE_URL env or http://localhost:3000).
 */

import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/werkwijze", { waitUntil: "load" });
  await page.waitForSelector("#main-content", { timeout: 15000 });
});

test("werkwijze: page renders with its title", async ({ page }) => {
  await expect(
    page.getByRole("heading", { level: 1, name: "Procedure en prijs" }),
  ).toBeVisible();
});

test("werkwijze: the price is stated above the numbered points", async ({
  page,
}) => {
  const price = page.getByText("De standaardprijs is 900 euro");
  await expect(price).toBeVisible();

  // The price block must precede the list, which is the whole point of the
  // page: someone scanning for a number should not have to read to the end.
  // Scoped to <article>: the nav renders its own <ul> higher up the DOM, so
  // an unscoped list locator would match the menu instead of the points.
  const priceBox = await price.boundingBox();
  const listBox = await page.locator("article ol").boundingBox();
  expect(priceBox!.y).toBeLessThan(listBox!.y);
});

test("werkwijze: all 12 numbered points are present", async ({ page }) => {
  await expect(page.locator("article ol > li")).toHaveCount(12);
});

test("werkwijze: the back link returns to the homepage", async ({ page }) => {
  await page.locator('a[href="/"]').first().click();
  await expect(page).toHaveURL(/\/$/);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright test tests/navigation/werkwijze.spec.ts --project=navigation-desktop`
Expected: FAIL. The route does not exist, so `/werkwijze` serves the 404 page and `#main-content` either never appears with the expected heading or the heading assertion fails.

- [ ] **Step 3: Make the cover media optional in `DetailPage`**

Wrap the cover block (lines 51-71) so it renders nothing when neither `media` nor `image` is supplied, instead of an empty `aspect-video` box:

```tsx
{
  /* Cover media (optional: pages without a cover skip the block entirely) */
}
{
  (media || image) && (
    <div className="mx-auto max-w-5xl px-8">
      <div className="relative aspect-video w-full overflow-hidden">
        {media ??
          (image && (
            <Image
              src={image}
              alt={imageAlt}
              fill
              className={imageClassName}
              sizes="100vw"
              priority
            />
          ))}
        {imageCredit && (
          <span className="pointer-events-none absolute bottom-2 right-2 z-10 font-helvetica text-xs tracking-wide text-white/80 md:bottom-3 md:right-3">
            {imageCredit}
          </span>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Let `DetailPage` forward overlay colours**

Add two optional props to the interface (after `imageCredit`):

```tsx
  /** Mobile overlay background, forwarded to DetailNav. Defaults to red-dark. */
  overlayBgColor?: string;
  /** Mobile overlay text colour, forwarded to DetailNav. Defaults to red-light. */
  overlayTextColor?: string;
```

Destructure them in the signature alongside the existing props, then change line 38 from `<DetailNav />` to:

```tsx
<DetailNav
  overlayBgColor={overlayBgColor}
  overlayTextColor={overlayTextColor}
/>
```

`DetailNav` already defaults both to the red pair when they are `undefined`, so every existing page is unaffected.

- [ ] **Step 5: Create the `NumberedPoints` component**

Create `src/components/NumberedPoints.tsx`:

```tsx
interface NumberedPointsProps {
  /** Point bodies in order. Paragraphs within a point are separated by "\n\n". */
  points: string[];
}

/**
 * Renders the werkwijze points as a numbered list. The visible numerals are
 * Posterman display type and are aria-hidden: the <ol> already conveys
 * position to assistive tech, so announcing "1" twice would be noise.
 */
export default function NumberedPoints({ points }: NumberedPointsProps) {
  return (
    <ol className="list-none space-y-10 md:space-y-14">
      {points.map((point, index) => (
        <li key={index} className="md:grid md:grid-cols-[5rem_1fr] md:gap-8">
          <span
            aria-hidden="true"
            className="mb-2 block font-posterman text-[40px] font-black leading-none opacity-40 md:mb-0 md:text-[64px]"
          >
            {index + 1}
          </span>
          <div className="space-y-4">
            {point.split("\n\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}
```

- [ ] **Step 6: Create the page**

Create `src/app/[locale]/werkwijze/page.tsx`:

```tsx
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAlternates } from "@/lib/seo";
import DetailPage from "@/components/DetailPage";
import NumberedPoints from "@/components/NumberedPoints";

type Params = { locale: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "metadata" });

  return {
    title: t("werkwijzeTitle"),
    description: t("werkwijzeDescription"),
    alternates: getAlternates("werkwijze"),
  };
}

export default async function WerkwijzePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("werkwijze");

  // Kurt supplied the price as his final point. It leads instead, because the
  // reason this page exists is that visitors could not find the price.
  const points = Array.from({ length: 12 }, (_, i) => t(`point${i + 1}`));

  return (
    <DetailPage
      backHref="/"
      colorScheme="bg-blue-dark text-blue-light"
      overlayBgColor="var(--color-blue-dark)"
      overlayTextColor="var(--color-blue-light)"
      title={t("title")}
    >
      <p className="font-serif text-[20px] leading-7 md:text-[24px] md:leading-9">
        {t("price")}
      </p>

      <NumberedPoints points={points} />
    </DetailPage>
  );
}
```

- [ ] **Step 7: Run the test to verify it passes**

Run: `npx playwright test tests/navigation/werkwijze.spec.ts --project=navigation-desktop --project=navigation-mobile`
Expected: PASS, all four tests on both projects.

Both list assertions are scoped to `article ol`, so the nav's own `<ul>` cannot interfere on either viewport. If the count comes back as 0 rather than 12, `NumberedPoints` is rendering outside `DetailPage`'s `<article>`; check that it is passed as a child rather than into another slot.

- [ ] **Step 8: Check the page in the browser**

With `npm run dev` running, open `http://localhost:3000/werkwijze` and confirm:

- The blue theme (`#2d5f63` background, `#c5e8e6` text) reads well and the body copy is legible against it.
- The page starts with the back link, then the title, then the price paragraph. No empty gap where the cover image would have been.
- Posterman numerals sit in the left gutter at 1280px and above the paragraph at 390px.
- Point 3 shows as two paragraphs; every other point as one.
- At 390px, open the hamburger and confirm the overlay is blue rather than red.

- [ ] **Step 9: Type-check and lint**

Run: `npm run tsc && npm run lint`
Expected: both pass.

- [ ] **Step 10: Commit**

```bash
git add src/components/NumberedPoints.tsx src/app/\[locale\]/werkwijze/page.tsx src/components/DetailPage.tsx tests/navigation/werkwijze.spec.ts
git commit -m "feat: add Procedure en prijs page at /werkwijze

Kurt's 13 supplied points, with the price lifted from last to first so
visitors can find it. Cover media is now genuinely optional in
DetailPage, and overlay colours are forwardable, since this is the first
page with no cover photo and the first on the blue theme."
```

---

### Task 5: Add the page to both navs

**Files:**

- Modify: `src/components/StickyNav.tsx:13` (`NAV_ITEMS`), and the `PAGE_HREFS` added in Task 2
- Modify: `src/components/DetailNav.tsx:20` (`NAV_ITEMS`), and its `PAGE_HREFS`
- Test: `tests/navigation/menu.spec.ts:24` (`ITEMS`)

**Interfaces:**

- Consumes: `PAGE_HREFS` from Task 2, the `/werkwijze` route from Task 4, the `nav.werkwijze` label from Task 3.
- Produces: nothing later tasks depend on.

- [ ] **Step 1: Extend the existing menu test**

`tests/navigation/menu.spec.ts` already asserts that every item in its `ITEMS` array is visible and clickable across three screens on both mobile and desktop. Add the new item to line 24, positioned as it will appear in the nav:

```ts
const ITEMS = [
  "home",
  "about",
  "who-am-i",
  "work",
  "werkwijze",
  "contact",
  "blog",
] as const;
```

Then teach its two href helpers about the new page-link. In `itemHref` (line 28), add after the `blog` line:

```ts
if (key === "werkwijze") return "/werkwijze";
```

And in `expectedUrl` (line 36), add after the `blog` line:

```ts
if (key === "werkwijze") return /\/werkwijze\/?$/;
```

Also update the file's header comment (line 6-7), which lists the destinations both navs must expose, to include `werkwijze`.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright test tests/navigation/menu.spec.ts --project=navigation-desktop`
Expected: FAIL on the three new `menu: "werkwijze" is clickable on ...` tests, with the link locator resolving to `null` because no nav renders `href="/werkwijze"` yet. The other tests still pass.

- [ ] **Step 3: Add the item in `StickyNav.tsx`**

Line 13:

```tsx
const NAV_ITEMS = [
  "about",
  "who-am-i",
  "work",
  "werkwijze",
  "contact",
  "blog",
] as const;
```

And add the route to `PAGE_HREFS`:

```tsx
const PAGE_HREFS: Record<string, string> = {
  werkwijze: "/werkwijze",
  blog: "/blog",
};
```

`SECTION_IDS` is deliberately unchanged: `/werkwijze` is a page, not a homepage section, so it takes no part in scroll-spy.

- [ ] **Step 4: Add the item in `DetailNav.tsx`**

Line 20, matching `StickyNav` exactly:

```tsx
const NAV_ITEMS = [
  "about",
  "who-am-i",
  "work",
  "werkwijze",
  "contact",
  "blog",
] as const;

const PAGE_HREFS: Record<string, string> = {
  werkwijze: "/werkwijze",
  blog: "/blog",
};
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx playwright test tests/navigation/ --project=navigation-desktop --project=navigation-mobile`
Expected: PASS, the whole navigation suite including the new werkwijze menu tests.

- [ ] **Step 6: Verify the nav does not overflow**

This is the check Task 1 existed to make safe, so do it properly. With `npm run dev` running, on both `/` and `/about`:

- 1024px: six horizontal labels on one line, not wrapped, not overlapping the logo. If they collide, the fix is to reduce `lg:gap-8` to `lg:gap-6`, not to shorten the label.
- 1280px: comfortable spacing.
- 1023px: hamburger, and the overlay lists all six items.

- [ ] **Step 7: Type-check and lint**

Run: `npm run tsc && npm run lint`
Expected: both pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/StickyNav.tsx src/components/DetailNav.tsx tests/navigation/menu.spec.ts
git commit -m "feat: add Werkwijze to both nav components"
```

---

### Task 6: Update sitemap and the LLM-facing text files

`llms-full.txt` currently contradicts the new page in two places, so this task is a correction as well as an addition:

- Its FAQ answers "How much does a udocu interview cost?" with "Contact Kurt directly for pricing information", which is now false.
- It states the customer receives the film "on an external hard drive", while Kurt's point 12 says a USB stick.

**Files:**

- Modify: `src/app/sitemap.ts:7-14`
- Modify: `src/app/llms.txt/route.ts:29-35`
- Modify: `src/app/llms-full.txt/route.ts:61-68`, `:81-85`

**Interfaces:**

- Consumes: the `/werkwijze` route from Task 4.
- Produces: nothing.

- [ ] **Step 1: Add the route to the sitemap**

In `staticPages` (line 7-14), add after the `/work` entry:

```ts
  { path: "/werkwijze", priority: 0.8, changeFrequency: "monthly" as const },
```

Priority 0.8 matches `/about` and `/who-am-i`: a primary content page, not a leaf.

- [ ] **Step 2: Add the link to `llms.txt`**

In the `## Links` list (line 31-35), add after the `Work & Interviews` line:

```ts
- [Procedure and pricing](${SITE_URL}/werkwijze)
```

- [ ] **Step 3: Add the link to `llms-full.txt`**

In the `## Site structure` list (line 64-68), add after the `Work` line:

```ts
- [Procedure and pricing](${SITE_URL}/werkwijze) - How a udocu interview works, from preparation to delivery, including pricing
```

- [ ] **Step 4: Correct the pricing FAQ answer**

Replace the answer under `### How much does a udocu interview cost?` (line 82):

```ts
The standard price is 900 euro, which includes one USB stick with the recordings. Additional sticks are 20 euro each. Travel costs are kept to a minimum. Invoiced without VAT. Full details at ${SITE_URL}/werkwijze
```

- [ ] **Step 5: Correct the delivery-format answer**

Under `### What do I receive after the interview?` (line 85), "an external hard drive" contradicts Kurt's point 12. Replace the answer with:

```ts
You receive a USB stick containing the complete film, typically two to three hours long and sometimes split into two parts. The result is entirely yours: you decide who sees it and when.
```

Note the em dash in the original sentence is gone, per the global constraints.

- [ ] **Step 6: Verify all three routes render**

With `npm run dev` running:

```bash
curl -s http://localhost:3000/sitemap.xml | grep werkwijze
curl -s http://localhost:3000/llms.txt | grep -i werkwijze
curl -s http://localhost:3000/llms-full.txt | grep -iE "werkwijze|900 euro|USB stick"
```

Expected: the sitemap contains a `<loc>` for `/werkwijze`; `llms.txt` contains the link; `llms-full.txt` contains the link, the price, and the corrected delivery format with no remaining mention of an external hard drive.

- [ ] **Step 7: Type-check and lint**

Run: `npm run tsc && npm run lint`
Expected: both pass.

- [ ] **Step 8: Run the full test suite**

Run: `npx playwright test --project=navigation-desktop --project=navigation-mobile --project=navigation-webkit --project=navigation-webkit-desktop`
Expected: PASS. This is the last task, so the whole navigation suite should be green across all four projects before the branch is considered done.

- [ ] **Step 9: Commit**

```bash
git add src/app/sitemap.ts src/app/llms.txt/route.ts src/app/llms-full.txt/route.ts
git commit -m "feat: list Procedure en prijs in sitemap and LLM text files

Also corrects two facts the new page contradicts: the FAQ said to email
for pricing, and the delivery format was listed as an external hard
drive rather than a USB stick."
```

---

## Follow-ups, not part of this plan

- **Homepage teaser section.** Deferred by decision. Until it exists the price is menu-only, which partially addresses the original complaint. Needs its own visual design, a `ScrollColorContext` stop, and a place in the `-mt-[100vh]` overlap sequence.
- **Cover photograph.** Kurt supplies a behind-the-scenes shot of the cameras and tripods set up in a living room. Drops in as `image={...}` on the page with no other change.
- **Three unanswered buyer questions** in the supplied copy: delivery lead time, how to book, and whether 900 euro covers one person or a couple.
- **Four copy passages** flagged in the spec as working against the sale. Kurt's call, and he has said he will reread the text.
