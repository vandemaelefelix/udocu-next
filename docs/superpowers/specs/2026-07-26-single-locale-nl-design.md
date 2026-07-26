# Single-locale (Dutch-only) simplification

## Context

The site currently supports two locales (`en`, `nl`) via next-intl, with Prismic content mapped `en` → `en-us` and `nl` → `nl-be`. In practice:

- No UI language switcher exists anywhere in the codebase; `en` is only reachable by manually typing `/en/...`.
- The only Prismic documents in the `en-us` locale are 5 placeholder/seed `interview` documents (`interview-1`..`interview-5`, all created within a 5-minute window on 2026-02-28) — not real editorial content.
- The homepage's Work section fetches interviews with `lang: "*"` (all languages), which is why those English placeholder docs were rendering on the Dutch homepage even though no real Dutch interview content existed yet.
- The site has not been officially deployed to production under its real domain yet (still Vercel preview/default URLs), so there's no indexed-URL/SEO migration to worry about.

Decision: drop English, keep only Dutch (`nl-be` in Prismic), and simplify both the website and Prismic accordingly.

## Decisions

1. **URL structure**: drop the `/nl` prefix entirely. URLs become `/about`, `/work`, `/contact`, etc.
2. **i18n library**: keep next-intl (rather than ripping it out) for copy/code separation, reconfigured for a single locale with no URL prefix.
3. **Routing implementation**: keep the existing `src/app/[locale]/` folder structure and reconfigure `routing.ts` (`locales: ["nl"]`, `localePrefix: "never"`), rather than physically flattening every route out of `[locale]/`. Smallest, lowest-risk diff; next-intl explicitly supports this as the pattern for a single-locale, unprefixed site. Leaves the door open to reintroduce a locale later without restructuring the route tree.
4. **Duplicate interview routes**: consolidate `src/app/[locale]/work/[uid]/page.tsx` and `src/app/[locale]/interviews/[uid]/page.tsx` (both render the same Prismic `interview` document type, near-identical implementations) into one — `work/[uid]` survives, `interviews/[uid]` is deleted. No redirect needed since the site isn't live yet.

## Changes

### Routing & i18n config

- `src/i18n/routing.ts`: `locales: ["nl"]`, `defaultLocale: "nl"`, add `localePrefix: "never"`; narrow the `"en" | "nl"` union type to `"nl"`.
- `src/i18n/request.ts`: `messageImports` map shrinks to `{ nl: ... }`.
- Delete `messages/en.json`. `messages/nl.json` unchanged.
- `src/middleware.ts` matcher unchanged.

### Prismic locale handling + route consolidation

- `src/prismicio.ts`: replace `localeMap: Record<string, string>` with `export const PRISMIC_LOCALE = "nl-be";`. Update all call sites (`page.tsx`, `blog/[uid]/page.tsx`, `blog/page.tsx`, `work/[uid]/page.tsx`, `api/blog/route.ts`) to use the constant directly instead of `localeMap[locale] ?? "nl-be"`.
- Homepage `WorkSection` fetch (`src/app/[locale]/page.tsx:46-52`): change `lang: "*"` to `lang: PRISMIC_LOCALE`. This is the permanent fix for English placeholder content leaking onto the Dutch homepage.
- `sitemap.ts`: scope the all-language interview/blog fetch to `PRISMIC_LOCALE` instead of `lang: "*"`.
- Merge `interviews/[uid]/page.tsx` into `work/[uid]/page.tsx`; delete the `interviews/[uid]` route.
- `generateStaticParams` in `work/[uid]/page.tsx` and `blog/[uid]/page.tsx`: drop the `["en","nl"].map(...)` cross-product — one static param per document.

### SEO / metadata

- `src/lib/seo.ts`'s `getAlternates()`: drop the `languages`/`x-default` hreflang block; return `{ canonical }` only.
- `sitemap.ts`: drop the `["en", "nl"]` map over static pages (one entry per route); drop alternate-language pairing on blog/interview entries.
- `src/app/[locale]/layout.tsx`: `openGraph.locale` fixed to `"nl_BE"`, no `alternateLocale`. JSON-LD `inLanguage` becomes `"nl-BE"` (single string).
- `src/app/llms.txt/route.ts` and `llms-full.txt/route.ts`: fix existing `/en/...` links to unprefixed paths; update the "Languages: Dutch (primary), English" line to reflect Dutch-only.
- `src/utils/formatDate.ts`: fix the `"nl-NL"` branch to `"nl-BE"`.

### Testing

- Update existing Playwright tests (`tests/navigation/menu-ux.spec.ts`, `tests/performance/vitals.spec.ts`, `tests/scroll-colors/scroll-colors.spec.ts`) from hardcoded `/nl/...` paths to unprefixed paths.
- `npm run tsc` and `npm run lint` must pass after the locale union type / `localeMap` removal.

### Manual steps (outside code, no API path exists for either)

1. In Prismic, archive then permanently delete `interview-1` through `interview-5`.
2. Optionally, in Prismic → Settings → Translations & Locales, remove `en-us` as an enabled locale (safe to leave enabled and simply unused, if there's any chance English content returns later).

## Out of scope

- Physically flattening `src/app/[locale]/` routes (rejected in favor of the smaller reconfiguration approach).
- Any redirect/SEO migration for previously-indexed `/nl/...` URLs (site not yet live under its real domain).
