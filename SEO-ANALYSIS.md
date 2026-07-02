# SEO Analysis — udocu-next

**Date:** 2026-04-23
**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · Prismic CMS · next-intl (en, nl)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Metadata & Open Graph](#2-metadata--open-graph)
3. [Structured Data (JSON-LD)](#3-structured-data-json-ld)
4. [Sitemap & Robots](#4-sitemap--robots)
5. [Internationalization (i18n) SEO](#5-internationalization-i18n-seo)
6. [URL Structure & Canonicals](#6-url-structure--canonicals)
7. [Heading Hierarchy & Semantic HTML](#7-heading-hierarchy--semantic-html)
8. [Image SEO](#8-image-seo)
9. [Performance & Core Web Vitals](#9-performance--core-web-vitals)
10. [Link SEO](#10-link-seo)
11. [Error Pages](#11-error-pages)
12. [Static Generation & ISR](#12-static-generation--isr)
13. [Accessibility (SEO-related)](#13-accessibility-seo-related)
14. [Priority Action Plan](#14-priority-action-plan)

---

## 1. Executive Summary

The project has a solid foundation — clean URL structure, proper locale routing, server-side rendering, and metadata generation on dynamic pages. However, several critical SEO assets are **completely missing**: sitemap, robots.txt, JSON-LD structured data, hreflang tags, and canonical URLs. Six out of eleven pages lack custom metadata and fall back to the generic root title "udocu". Addressing these gaps will significantly improve crawlability, indexability, and search result appearance.

### Scorecard

| Area              | Score | Status                                       |
| ----------------- | ----- | -------------------------------------------- |
| Metadata & OG     | 4/10  | Only dynamic detail pages have metadata      |
| Structured Data   | 0/10  | Completely missing                           |
| Sitemap & Robots  | 0/10  | Neither exists                               |
| i18n SEO          | 3/10  | Routing works, but no hreflang/canonical     |
| URL Structure     | 8/10  | Clean and semantic                           |
| Heading Hierarchy | 5/10  | Multiple h1s on homepage                     |
| Image SEO         | 6/10  | next/image used, but empty alt texts         |
| Performance       | 7/10  | Good font strategy, image optimization       |
| Link SEO          | 7/10  | Proper rel attributes, good internal linking |
| Error Pages       | 0/10  | No custom 404/error pages                    |

---

## 2. Metadata & Open Graph

### What's Working

- **Root layout** (`src/app/[locale]/layout.tsx:10-22`) uses `generateMetadata()` with translated title/description via next-intl.
- **Blog posts** (`src/app/[locale]/blog/[uid]/page.tsx:23-51`) generate title, OG images, and Twitter `summary_large_image` card.
- **Work detail** (`src/app/[locale]/work/[uid]/page.tsx:26-65`) generates title, description, OG, and Twitter metadata from Prismic fields.
- **Interview detail** (`src/app/[locale]/interviews/[uid]/page.tsx:23-66`) same pattern as work detail.
- HTML `lang` attribute correctly set: `<html lang={locale}>`.

### What's Missing

| Page                                     | Has `generateMetadata`? | Issue                               |
| ---------------------------------------- | ----------------------- | ----------------------------------- |
| Homepage (`/[locale]/page.tsx`)          | No                      | Falls back to generic "udocu" title |
| About (`/[locale]/about/page.tsx`)       | No                      | No unique title or description      |
| Who Am I (`/[locale]/who-am-i/page.tsx`) | No                      | No unique title or description      |
| Blog listing (`/[locale]/blog/page.tsx`) | No                      | No unique title or description      |
| Work listing (`/[locale]/work/page.tsx`) | No                      | No unique title or description      |
| Contact (`/[locale]/contact/page.tsx`)   | No                      | No unique title or description      |

### Specific Issues

- **Blog posts**: Missing `description`, `og:type` ("article"), `article:published_time`, `article:author`.
- **All pages**: Missing `og:url`, `og:site_name`, `og:locale`, `og:locale:alternate`.
- **Root metadata**: Generic description ("So as not to forget who you were") — works as tagline but not optimized for SERP display.
- **No fallback OG image**: Pages without an explicit image have no social sharing preview.

### Recommendations

1. Add `generateMetadata()` to all 6 pages that lack it, with unique translated titles and descriptions.
2. Add `og:type: "article"` and publishing dates to blog post metadata.
3. Set a default OG image in the root layout as fallback.
4. Add `og:site_name: "udocu"` globally.
5. Enhance translation files (`messages/en.json`, `messages/nl.json`) with per-page SEO descriptions.

---

## 3. Structured Data (JSON-LD)

### Current Status: Not Implemented

No JSON-LD, Microdata, or RDFa structured data exists anywhere in the codebase.

### What Should Be Added

| Schema Type               | Where                       | Purpose                                    |
| ------------------------- | --------------------------- | ------------------------------------------ |
| `Organization`            | Root layout                 | Brand identity in search results           |
| `WebSite`                 | Root layout                 | Sitelinks search box                       |
| `Person`                  | Work/Interview detail pages | Rich person snippets for Kurt Vandemaele   |
| `Article` / `BlogPosting` | Blog post pages             | Article rich results, publish date, author |
| `BreadcrumbList`          | All detail pages            | Breadcrumb trail in SERPs                  |
| `VideoObject`             | Pages with CloudinaryVideo  | Video rich results                         |

### Recommendations

1. Create a shared `JsonLd` component or use `<script type="application/ld+json">` in layouts.
2. Start with `Organization` + `WebSite` in the root layout (quick win).
3. Add `Article` schema to blog posts using Prismic data (title, description, publish_date, image).
4. Add `BreadcrumbList` to detail pages.

---

## 4. Sitemap & Robots

### Sitemap: Missing

No `sitemap.ts`, `sitemap.xml`, or any sitemap generation exists. Dynamic content (blog posts, interviews, work entries) is not discoverable by crawlers through a sitemap.

### Robots.txt: Missing

No `robots.txt` in `public/` or `src/app/robots.ts`. Crawlers use permissive defaults, but there's no explicit directive to:

- Point to the sitemap
- Block preview/API routes from indexing
- Define crawl-delay

### Recommendations

1. **Create `src/app/sitemap.ts`** — dynamically generate entries for all static pages and Prismic-managed content (blog posts, interviews, work entries) with `lastModified` dates and `alternates.languages` for each locale.
2. **Create `src/app/robots.ts`** — allow all crawlers, disallow `/api/`, `/slice-simulator/`, and reference the sitemap URL.

---

## 5. Internationalization (i18n) SEO

### What's Working

- **Locale routing**: Clean URL structure with `/{locale}/...` prefix.
- **next-intl middleware** (`src/middleware.ts:1-8`): Properly handles locale detection and routing.
- **Locale config** (`src/i18n/routing.ts:3-6`): `["en", "nl"]` with default `"nl"`.
- **Prismic locale mapping** (`src/prismicio.ts`): `en → en-us`, `nl → nl-be`.
- **Translation files**: Structured metadata keys in both `en.json` and `nl.json`.

### What's Missing

| Feature                             | Status  | Impact                                           |
| ----------------------------------- | ------- | ------------------------------------------------ |
| `hreflang` alternate links          | Missing | Search engines can't identify language variants  |
| `og:locale` / `og:locale:alternate` | Missing | Social platforms can't identify language         |
| Canonical URLs with locale          | Missing | Duplicate content risk between `/en/` and `/nl/` |
| Language switcher UI                | Missing | Users can't switch between languages             |
| `x-default` hreflang                | Missing | No fallback for unmatched locales                |

### Recommendations

1. Add `alternates` to root layout metadata:
   ```ts
   alternates: {
     languages: {
       en: '/en/...',
       nl: '/nl/...',
       'x-default': '/nl/...',
     },
     canonical: '...',
   }
   ```
2. Add `og:locale` and `og:locale:alternate` to metadata.
3. Implement a language switcher component in the header or footer.

---

## 6. URL Structure & Canonicals

### What's Working

- Clean, semantic URLs: `/{locale}/{section}/{uid}`
- Dynamic routes use meaningful Prismic UIDs as slugs
- No query parameters for content navigation
- Middleware properly excludes API and internal routes

### What's Missing

- **No canonical URLs** on any page — risk of duplicate content between locale versions.
- **No trailing slash policy** explicitly set (Next.js defaults to no trailing slash — fine, but should be explicit).

### Recommendations

1. Add `alternates.canonical` to all page metadata, pointing to the current locale version.
2. Consider adding `trailingSlash: false` explicitly in `next.config.ts` for clarity.

---

## 7. Heading Hierarchy & Semantic HTML

### Semantic Elements (Good)

| Element     | Usage            | Files                                                                 |
| ----------- | ---------------- | --------------------------------------------------------------------- |
| `<main>`    | All pages        | `page.tsx` files, `DetailPage.tsx`                                    |
| `<section>` | Content sections | `AboutSection.tsx:43`, `ContactSection.tsx:32`, `WorkSection.tsx:116` |
| `<article>` | Detail content   | `DetailPage.tsx:51`, `interviews/[uid]/page.tsx:111`                  |
| `<nav>`     | Navigation       | `StickyNav.tsx:34,88`, `DetailNav.tsx:34,74`                          |
| `<header>`  | Page header      | `DetailNav.tsx:32`                                                    |
| `<time>`    | Date display     | `work/[uid]/page.tsx:139`, `interviews/[uid]/page.tsx:130`            |

### Issues

| Issue                            | Location                                                                              | Severity |
| -------------------------------- | ------------------------------------------------------------------------------------- | -------- |
| **Multiple h1 tags on homepage** | `WorkSection.tsx:118,298` renders h1 for "Work" while homepage should have its own h1 | High     |
| **No clear h1 on homepage**      | `src/app/[locale]/page.tsx` — ParallaxHero uses `<p>` for tagline, no semantic h1     | High     |
| **Missing `<footer>` element**   | `SocialDock.tsx` uses `<div>` instead of `<footer>`                                   | Low      |
| **Stub pages**                   | `work/page.tsx` and `contact/page.tsx` have only an `<h1>` with no deeper structure   | Medium   |

### Recommendations

1. Add a proper `<h1>` to the homepage (e.g., in ParallaxHero).
2. Change `WorkSection` heading from `<h1>` to `<h2>` when used on the homepage.
3. Wrap `SocialDock` in a `<footer>` element.
4. Expand stub pages with more content and structure.

---

## 8. Image SEO

### What's Working

- **next/image** used consistently across the project.
- **Remote patterns** configured for `images.prismic.io` (`next.config.ts:8-14`).
- **Priority loading** set on hero/above-fold images (`blog/[uid]/page.tsx:91`, `DetailPage.tsx:44`, `ParallaxHero.tsx`).
- **Lazy loading** used where appropriate (`WorkSection.tsx:160,466`, `BlogGrid.tsx:43`).
- **Translated alt text** in some components (`WhoAmISection.tsx:101` uses `alt={t("imageAlt")}`).
- **Sizes attribute** properly set in some components.

### Issues

| Issue                                                     | Location                         |
| --------------------------------------------------------- | -------------------------------- |
| Empty `alt=""` on non-decorative images                   | `AboutSection.tsx:82-85,126-132` |
| Empty `alt=""` on blog post images                        | `blog/[uid]/page.tsx:87,108`     |
| Blog PostCard relies on Prismic alt text without fallback | `BlogGrid.tsx:41`                |
| CloudinaryVideo has no title/description                  | `CloudinaryVideo.tsx`            |

### Recommendations

1. Audit all `alt=""` attributes — replace with descriptive text unless the image is purely decorative.
2. Add fallback alt text for Prismic images: `alt={image.alt ?? "Description of content"}`.
3. Add descriptive titles or nearby text content for video elements.
4. Ensure Prismic content editors fill in alt text fields.

---

## 9. Performance & Core Web Vitals

### What's Working

- **Font loading**: `display: "swap"` on Google Fonts (`src/app/fonts.ts:9`) prevents FOIT.
- **Local fonts**: Helvetica Neue and Posterman loaded locally (no network requests).
- **Image optimization**: next/image handles format conversion, resizing, and lazy loading.
- **Package optimization**: `optimizePackageImports: ["motion"]` in next.config.ts.
- **`poweredByHeader: false`**: Removes unnecessary header.

### Potential Improvements

| Area                     | Current         | Recommendation                                                                                |
| ------------------------ | --------------- | --------------------------------------------------------------------------------------------- |
| Suspense boundaries      | None found      | Add `<Suspense>` around heavy components (blog grid, work section) for streaming              |
| Security/caching headers | None configured | Add `Cache-Control`, `X-Content-Type-Options`, `X-Frame-Options` via `next.config.ts` headers |
| Sizes attribute          | Inconsistent    | Add `sizes` to all `<Image>` components for optimal responsive loading                        |
| Font subsetting          | Latin only      | Consider adding `latin-ext` if Dutch content uses extended characters                         |

---

## 10. Link SEO

### What's Working

- **next/link** used for internal navigation with locale context.
- **External links** have proper `target="_blank"` and `rel="noopener noreferrer"` (`SocialLinks.tsx:37`).
- **Smooth scroll anchors**: `#about`, `#who-am-i`, `#work`, `#contact` with matching section IDs.
- **Translated ARIA labels** on social links (`SocialLinks.tsx:38`).

### Issues

- Some navigation links lack `aria-label` (`StickyNav.tsx:48,50`, `DetailNav.tsx:44`).
- ArrowLink component uses generic "→" symbol — while `aria-hidden="true"` is set on the icon, the link itself could have more descriptive text for crawlers.

### Recommendations

1. Ensure all navigation links have descriptive `aria-label` attributes.
2. Review anchor text quality — generic "Read more" links should include context (e.g., "Read more about [title]").

---

## 11. Error Pages

### Current Status: Not Implemented

No custom error pages found:

- No `src/app/not-found.tsx`
- No `src/app/error.tsx`
- No `src/app/[locale]/not-found.tsx`

Falls back to Next.js default error pages which lack internal links, branding, and SEO value.

### Recommendations

1. Create a custom `not-found.tsx` with navigation links, branding, and a search or sitemap link.
2. Create an `error.tsx` error boundary with graceful fallback UI.
3. Ensure error pages return correct HTTP status codes (404, 500).

---

## 12. Static Generation & ISR

### What's Working

- **Static params** generated for dynamic routes:
  - `blog/[uid]/page.tsx:14-21`
  - `work/[uid]/page.tsx:19-23`
  - `interviews/[uid]/page.tsx:14-21`
- **On-demand revalidation** via Prismic webhook (`src/app/api/revalidate/route.ts`) with secret validation.
- **Cache tagging** with `revalidateTag("prismic")`.

### Issues

| Issue                                           | Impact                                                 |
| ----------------------------------------------- | ------------------------------------------------------ |
| `generateStaticParams()` doesn't include locale | May not pre-render pages for all locales at build time |
| Preview routes lack `X-Robots-Tag: noindex`     | Preview URLs could be indexed by crawlers              |

### Recommendations

1. Update `generateStaticParams` to return locale variants:
   ```ts
   return documents.flatMap((doc) =>
     ["en", "nl"].map((locale) => ({ locale, uid: doc.uid })),
   );
   ```
2. Add `X-Robots-Tag: noindex` header to preview API routes.

---

## 13. Accessibility (SEO-related)

Accessibility improvements that directly impact SEO:

| Issue                        | Location               | Recommendation                             |
| ---------------------------- | ---------------------- | ------------------------------------------ |
| No skip-to-main-content link | Layout                 | Add a visually hidden skip link before nav |
| Inconsistent focus styles    | Global                 | Add visible `:focus-visible` ring styles   |
| Menu button ARIA             | `StickyNav.tsx:75-76`  | Already has `aria-expanded` — good         |
| Mute button ARIA             | `AboutSection.tsx:141` | Already has dynamic `aria-label` — good    |

---

## 14. Priority Action Plan

### Critical (Do First)

| #   | Action                                       | Files to Create/Modify                                                                                  |
| --- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1   | Create sitemap                               | `src/app/sitemap.ts`                                                                                    |
| 2   | Create robots.txt                            | `src/app/robots.ts`                                                                                     |
| 3   | Add hreflang + canonical to metadata         | `src/app/[locale]/layout.tsx`, all page.tsx files                                                       |
| 4   | Add `generateMetadata` to 6 pages missing it | `page.tsx`, `about/page.tsx`, `who-am-i/page.tsx`, `blog/page.tsx`, `work/page.tsx`, `contact/page.tsx` |
| 5   | Add JSON-LD (Organization + WebSite)         | `src/app/[locale]/layout.tsx`                                                                           |

### High (Do Next)

| #   | Action                                     | Files to Create/Modify                                                    |
| --- | ------------------------------------------ | ------------------------------------------------------------------------- |
| 6   | Add Article JSON-LD to blog posts          | `src/app/[locale]/blog/[uid]/page.tsx`                                    |
| 7   | Fix homepage heading hierarchy (single h1) | `src/components/WorkSection.tsx`, `src/components/ParallaxHero.tsx`       |
| 8   | Fix empty alt texts                        | `src/components/AboutSection.tsx`, `src/app/[locale]/blog/[uid]/page.tsx` |
| 9   | Add default fallback OG image              | `src/app/[locale]/layout.tsx`                                             |
| 10  | Include locale in `generateStaticParams`   | `blog/[uid]/page.tsx`, `work/[uid]/page.tsx`, `interviews/[uid]/page.tsx` |

### Medium

| #   | Action                                            | Files to Create/Modify                 |
| --- | ------------------------------------------------- | -------------------------------------- |
| 11  | Create custom 404 page                            | `src/app/not-found.tsx`                |
| 12  | Add BreadcrumbList JSON-LD to detail pages        | Detail page components                 |
| 13  | Add blog post publishing metadata (dates, author) | `src/app/[locale]/blog/[uid]/page.tsx` |
| 14  | Enhance page descriptions in translation files    | `messages/en.json`, `messages/nl.json` |
| 15  | Add language switcher component                   | New component in `src/components/`     |

### Low

| #   | Action                                        | Files to Create/Modify                 |
| --- | --------------------------------------------- | -------------------------------------- |
| 16  | Add skip-to-main-content link                 | `src/app/[locale]/layout.tsx`          |
| 17  | Wrap SocialDock in `<footer>`                 | `src/components/SocialDock.tsx`        |
| 18  | Add security/caching headers                  | `next.config.ts`                       |
| 19  | Add `X-Robots-Tag: noindex` to preview routes | `next.config.ts` headers or middleware |
| 20  | Add Suspense boundaries for streaming         | Heavy components                       |
