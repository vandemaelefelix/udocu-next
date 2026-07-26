# Single-locale (Dutch-only) Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Drop English support entirely, serve the site as Dutch-only with no `/nl` URL prefix, consolidate the duplicate interview detail route, and fix the underlying bug (all-language Prismic fetch) that caused English placeholder content to render on the Dutch homepage.

**Architecture:** Keep next-intl and the existing `src/app/[locale]/` route tree (Approach A from the design spec), but reconfigure `routing.ts` to a single locale (`nl`) with `localePrefix: "never"`. Replace the `en`/`nl` Prismic `localeMap` with a single `PRISMIC_LOCALE = "nl-be"` constant. Strip every hardcoded `/${locale}` URL interpolation across pages and components down to plain unprefixed paths. Delete the duplicate `/interviews/[uid]` route in favor of `/work/[uid]`.

**Tech Stack:** Next.js 16 (App Router), next-intl 4.9, @prismicio/client 7.21, TypeScript (strict), Playwright.

## Global Constraints

- Design spec: `docs/superpowers/specs/2026-07-26-single-locale-nl-design.md` — every decision below traces back to it.
- `npm run tsc` and `npm run lint` must pass after every task.
- No API/CLI path exists to delete Prismic documents or change Prismic locale settings — those are manual dashboard steps for the user, called out at the end, not part of any task here.
- The site is not yet live under its real domain, so no redirects for old `/nl/...` URLs are needed (confirmed in the design spec's "Out of scope").

---

### Task 1: Reconfigure next-intl routing for a single, unprefixed locale

**Files:**

- Modify: `src/i18n/routing.ts`
- Modify: `src/i18n/request.ts`
- Modify: `src/app/[locale]/layout.tsx:85`
- Delete: `messages/en.json`

**Interfaces:**

- Produces: `routing.locales` is now `readonly ["nl"]` — every later task that does `locale as "en" | "nl"` must narrow to `"nl"` only.

- [ ] **Step 1: Update `src/i18n/routing.ts`**

Replace the full file content:

```ts
import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["nl"],
  defaultLocale: "nl",
  // Single-locale site: never show a /nl prefix in the URL.
  localePrefix: "never",
  localeDetection: false,
});
```

- [ ] **Step 2: Update `src/i18n/request.ts`**

Replace the full file content:

```ts
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

const messageImports = {
  nl: () => import("../../messages/nl.json"),
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "nl")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await messageImports[locale as keyof typeof messageImports]())
      .default,
  };
});
```

- [ ] **Step 3: Fix the locale type-cast in `src/app/[locale]/layout.tsx`**

At line 85, change:

```ts
  if (!routing.locales.includes(locale as "en" | "nl")) {
```

to:

```ts
  if (!routing.locales.includes(locale as "nl")) {
```

- [ ] **Step 4: Delete `messages/en.json`**

```bash
git rm messages/en.json
```

- [ ] **Step 5: Verify**

```bash
npm run tsc
npm run lint
```

Expected: both pass with no errors (there will be no remaining reference to `messages/en.json` — `request.ts` was its only importer, confirmed during design research).

- [ ] **Step 6: Manual smoke check**

```bash
npm run dev &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/nl
kill %1
```

Expected: `/` returns `200`; `/nl` returns `404` (no more locale-prefixed route — this is expected and will be fixed for in-app links in Task 4, but the URL itself intentionally no longer exists).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: reconfigure next-intl to a single unprefixed nl locale"
```

---

### Task 2: Delete the duplicate `/interviews/[uid]` route

**Files:**

- Delete: `src/app/[locale]/interviews/[uid]/page.tsx`

**Interfaces:**

- Consumes: nothing from Task 1.
- Produces: nothing consumed by later tasks — this is a pure deletion. `work/[uid]/page.tsx` (touched in Task 3) already has full parity with what this route rendered (name, video, back link), confirmed by reading both files during planning; `interviews/[uid]` had an outdated dark-theme layout with no active internal links pointing to it.

- [ ] **Step 1: Delete the route and its now-empty parent directories**

```bash
git rm src/app/[locale]/interviews/[uid]/page.tsx
rmdir src/app/[locale]/interviews/[uid] src/app/[locale]/interviews 2>/dev/null || true
```

- [ ] **Step 2: Verify**

```bash
npm run tsc
npm run lint
```

Expected: both pass — no other file imports from `interviews/[uid]/page.tsx` (confirmed via grep during planning: `WorkSection.tsx` links to `/work/${uid}`, `sitemap.ts` emits `/work/${uid}` for interview documents, nothing references `/interviews`).

- [ ] **Step 3: Manual smoke check**

```bash
npm run dev &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/interviews/interview-1
kill %1
```

Expected: `404`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor: delete duplicate /interviews/[uid] route in favor of /work/[uid]"
```

---

### Task 3: Simplify Prismic locale handling + SEO alternates, fix every data-fetching page

This is the largest task because `PRISMIC_LOCALE` (replacing `localeMap`) and `getAlternates()`'s new single-argument signature are both breaking changes that every consumer must adopt in the same commit, or the build won't type-check.

**Files:**

- Modify: `src/prismicio.ts`
- Modify: `src/lib/seo.ts`
- Modify: `src/app/[locale]/page.tsx`
- Modify: `src/app/[locale]/about/page.tsx`
- Modify: `src/app/[locale]/who-am-i/page.tsx`
- Modify: `src/app/[locale]/work/page.tsx`
- Modify: `src/app/[locale]/contact/page.tsx`
- Modify: `src/app/[locale]/blog/page.tsx`
- Modify: `src/app/[locale]/blog/[uid]/page.tsx`
- Modify: `src/app/[locale]/work/[uid]/page.tsx`
- Modify: `src/app/api/blog/route.ts`

**Interfaces:**

- Consumes: nothing from Tasks 1–2 directly (independent config surface), but must land after Task 2 since Task 2 deletes a file that also used `localeMap` (avoids fixing a file about to be deleted).
- Produces: `PRISMIC_LOCALE: string` (exported from `@/prismicio`, value `"nl-be"`) and `getAlternates(path?: string): { canonical: string }` (exported from `@/lib/seo`, no `locale` parameter). Task 4's components don't consume either, but any future page added to this codebase should use both.

- [ ] **Step 1: Replace `localeMap` with `PRISMIC_LOCALE` in `src/prismicio.ts`**

Change:

```ts
export const localeMap: Record<string, string> = {
  en: "en-us",
  nl: "nl-be",
};
```

to:

```ts
export const PRISMIC_LOCALE = "nl-be";
```

- [ ] **Step 2: Simplify `getAlternates` in `src/lib/seo.ts`**

Replace the full file content:

```ts
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.udocu.be";

export function getAlternates(path: string = "") {
  const suffix = path ? `/${path}` : "";
  return {
    canonical: `${SITE_URL}${suffix}`,
  };
}
```

- [ ] **Step 3: Fix the homepage (`src/app/[locale]/page.tsx`)**

Change the import:

```ts
import { createClient } from "@/prismicio";
```

to:

```ts
import { createClient, PRISMIC_LOCALE } from "@/prismicio";
```

Change the `generateMetadata` alternates call (line 34):

```ts
    alternates: getAlternates(locale),
```

to:

```ts
    alternates: getAlternates(),
```

Change the interview fetch (lines 46-52) — this is the actual fix for English placeholder interviews rendering on the Dutch homepage:

```tsx
const interviews = await client.getAllByType<Content.InterviewDocument>(
  "interview",
  {
    lang: "*",
    orderings: [{ field: "my.interview.publish_date", direction: "desc" }],
  },
);
```

to:

```tsx
const interviews = await client.getAllByType<Content.InterviewDocument>(
  "interview",
  {
    lang: PRISMIC_LOCALE,
    orderings: [{ field: "my.interview.publish_date", direction: "desc" }],
  },
);
```

- [ ] **Step 4: Fix `src/app/[locale]/about/page.tsx`**

Change line 22:

```ts
    alternates: getAlternates(locale, "about"),
```

to:

```ts
    alternates: getAlternates("about"),
```

- [ ] **Step 5: Fix `src/app/[locale]/who-am-i/page.tsx`**

Change line 21:

```ts
    alternates: getAlternates(locale, "who-am-i"),
```

to:

```ts
    alternates: getAlternates("who-am-i"),
```

- [ ] **Step 6: Fix `src/app/[locale]/work/page.tsx`**

Change line 19:

```ts
    alternates: getAlternates(locale, "work"),
```

to:

```ts
    alternates: getAlternates("work"),
```

- [ ] **Step 7: Fix `src/app/[locale]/contact/page.tsx`**

Change line 19:

```ts
    alternates: getAlternates(locale, "contact"),
```

to:

```ts
    alternates: getAlternates("contact"),
```

- [ ] **Step 8: Fix `src/app/[locale]/blog/page.tsx`**

Change the import (line 4):

```ts
import { createClient, localeMap } from "@/prismicio";
```

to:

```ts
import { createClient, PRISMIC_LOCALE } from "@/prismicio";
```

Change the `generateMetadata` alternates call (line 25):

```ts
    alternates: getAlternates(locale, "blog"),
```

to:

```ts
    alternates: getAlternates("blog"),
```

Change the Prismic fetch (line 42):

```ts
      lang: localeMap[locale] ?? "nl-be",
```

to:

```ts
      lang: PRISMIC_LOCALE,
```

Change the `DetailNav` back link (line 55):

```tsx
<DetailNav backHref={`/${locale}`} activeItem="blog" hideBackLink />
```

to:

```tsx
<DetailNav backHref="/" activeItem="blog" hideBackLink />
```

Note: `locale` (from `getLocale()`) stays in this file — it's still passed to `<BlogGrid locale={locale} .../>` for date formatting.

- [ ] **Step 9: Fix `src/app/[locale]/blog/[uid]/page.tsx`**

Change the import (line 6):

```ts
import { createClient, localeMap } from "@/prismicio";
```

to:

```ts
import { createClient, PRISMIC_LOCALE } from "@/prismicio";
```

Change `generateStaticParams` (lines 15-22):

```tsx
export async function generateStaticParams() {
  const client = createClient();
  const documents = await client.getAllByType("blog_post", { lang: "*" });

  return documents.flatMap((doc) =>
    ["en", "nl"].map((locale) => ({ locale, uid: doc.uid })),
  );
}
```

to:

```tsx
export async function generateStaticParams() {
  const client = createClient();
  const documents = await client.getAllByType("blog_post", {
    lang: PRISMIC_LOCALE,
  });

  return documents.map((doc) => ({ locale: "nl", uid: doc.uid }));
}
```

In `generateMetadata`, change the fetch (line 37) and the alternates call (line 58):

```ts
        lang: localeMap[locale] ?? "nl-be",
```

to:

```ts
        lang: PRISMIC_LOCALE,
```

and:

```ts
      alternates: getAlternates(locale, `blog/${uid}`),
```

to:

```ts
      alternates: getAlternates(`blog/${uid}`),
```

In the default export, change the fetch (line 76):

```ts
page = await client.getByUID<Content.BlogPostDocument>("blog_post", uid, {
  lang: localeMap[locale] ?? "nl-be",
});
```

to:

```ts
page = await client.getByUID<Content.BlogPostDocument>("blog_post", uid, {
  lang: PRISMIC_LOCALE,
});
```

Change the JSON-LD and back link (lines 103, 110, 121, 127, 148) — drop the locale segment from every absolute/relative URL:

```ts
      url: `${SITE_URL}/${locale}/who-am-i`,
```

→

```ts
      url: `${SITE_URL}/who-am-i`,
```

```ts
    mainEntityOfPage: `${SITE_URL}/${locale}/blog/${uid}`,
```

→

```ts
    mainEntityOfPage: `${SITE_URL}/blog/${uid}`,
```

```ts
        item: `${SITE_URL}/${locale}`,
```

→

```ts
        item: SITE_URL,
```

```ts
        item: `${SITE_URL}/${locale}/blog`,
```

→

```ts
        item: `${SITE_URL}/blog`,
```

```tsx
        backHref={`/${locale}/blog`}
```

→ `backHref="/blog"`

`locale` stays destructured from `params` in the default export (still used by `formatDate(page.data.publish_date, locale)` at line 88) — only its use inside the JSON-LD/back-link strings above is removed.

- [ ] **Step 10: Fix `src/app/[locale]/work/[uid]/page.tsx`**

Change the import (line 4):

```ts
import { createClient, localeMap } from "@/prismicio";
```

to:

```ts
import { createClient, PRISMIC_LOCALE } from "@/prismicio";
```

Change `generateStaticParams` (lines 16-23):

```tsx
export async function generateStaticParams() {
  const client = createClient();
  const documents = await client.getAllByType("interview", { lang: "*" });

  return documents.flatMap((doc) =>
    ["en", "nl"].map((locale) => ({ locale, uid: doc.uid })),
  );
}
```

to:

```tsx
export async function generateStaticParams() {
  const client = createClient();
  const documents = await client.getAllByType("interview", {
    lang: PRISMIC_LOCALE,
  });

  return documents.map((doc) => ({ locale: "nl", uid: doc.uid }));
}
```

Replace all of `generateMetadata` (lines 25-65) — this also drops the now-pointless `lang: "*"` fallback (there's only one Prismic locale left, so a locale-specific lookup failing means the document genuinely doesn't exist) and the `getAlternates` call's locale arg:

```tsx
export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { uid } = await params;
  const client = createClient();

  try {
    const page = await client.getByUID<Content.InterviewDocument>(
      "interview",
      uid,
      { lang: PRISMIC_LOCALE },
    );

    const title = page.data.name ?? undefined;
    const description = prismic.asText(page.data.lead) ?? undefined;
    const images = page.data.image_url?.url
      ? [{ url: page.data.image_url.url }]
      : [];

    return {
      title,
      description,
      openGraph: { title, description, images },
      twitter: { card: "summary_large_image", title, description, images },
      alternates: getAlternates(`work/${uid}`),
    };
  } catch {
    return {};
  }
}
```

Replace the start of the default export (lines 67-90), dropping the `lang: "*"` fallback and the now-unused `locale` destructure:

```tsx
export default async function WorkDetailPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { uid } = await params;
  const client = createClient();

  let page: Content.InterviewDocument;
  try {
    page = await client.getByUID<Content.InterviewDocument>("interview", uid, {
      lang: PRISMIC_LOCALE,
    });
  } catch {
    notFound();
  }
```

Change the breadcrumb JSON-LD (lines 100-122) — drop the locale segment:

```ts
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_URL}/${locale}`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Work",
        item: `${SITE_URL}/${locale}/work`,
      },
```

to:

```ts
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Work",
        item: `${SITE_URL}/work`,
      },
```

Change the `DetailNav` back link (line 160):

```tsx
          backHref={`/${locale}#work`}
```

to: `backHref="/#work"`

Change the `DetailBackLink` href (line 187):

```tsx
              href={`/${locale}#work`}
```

to: `href="/#work"`

- [ ] **Step 11: Fix `src/app/api/blog/route.ts`**

Replace the full file content — the `locale` query param is no longer needed since there's only one Prismic locale:

```ts
import { NextRequest, NextResponse } from "next/server";
import type { Content } from "@prismicio/client";
import { createClient, PRISMIC_LOCALE } from "@/prismicio";

const PAGE_SIZE = 12;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page") ?? "1");

  const client = createClient();

  const response = await client.getByType<Content.BlogPostDocument>(
    "blog_post",
    {
      lang: PRISMIC_LOCALE,
      orderings: [{ field: "my.blog_post.publish_date", direction: "desc" }],
      pageSize: PAGE_SIZE,
      page,
    },
  );

  return NextResponse.json({
    results: response.results,
    page: response.page,
    totalPages: response.total_pages,
    totalResults: response.total_results_size,
  });
}
```

- [ ] **Step 12: Verify**

```bash
npm run tsc
npm run lint
```

Expected: both pass. If `tsc` reports an unused `locale` variable anywhere, remove that specific destructure (this plan already removes `locale` where it becomes fully unused — e.g. `work/[uid]/page.tsx`'s two functions).

- [ ] **Step 13: Manual smoke check**

```bash
npm run dev &
sleep 3
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/blog
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/work/interview-1
kill %1
```

Expected: all `200` (the 5 placeholder interview docs still exist in Prismic at this point in the plan — they're deleted manually by the user per the design spec, not by this plan).

- [ ] **Step 14: Commit**

```bash
git add -A
git commit -m "refactor: replace Prismic localeMap with single PRISMIC_LOCALE constant, simplify getAlternates"
```

---

### Task 4: Strip locale prefix from client-side navigation components

**Files:**

- Modify: `src/components/StickyNav.tsx`
- Modify: `src/components/DetailNav.tsx`
- Modify: `src/components/WorkSection.tsx`
- Modify: `src/components/WhoAmISection.tsx`
- Modify: `src/components/AboutSection.tsx`
- Modify: `src/components/BlogGrid.tsx`
- Modify: `src/app/[locale]/error.tsx`
- Modify: `src/app/[locale]/not-found.tsx`

**Interfaces:**

- Consumes: no compile-time dependency on Task 3, but Step 6 below (BlogGrid.tsx) relies on Task 3 Step 11 having already dropped the `locale` query param from `/api/blog` — land this task after Task 3.
- Produces: nothing consumed by later tasks — these are leaf UI components.

- [ ] **Step 1: Fix `src/components/StickyNav.tsx`**

Remove `useLocale` from the import (line 4):

```ts
import { useTranslations, useLocale } from "next-intl";
```

to:

```ts
import { useTranslations } from "next-intl";
```

Remove the `locale` variable (line 24):

```ts
const locale = useLocale();
```

Change the `scrollToSection` push (line 47):

```ts
router.push(`/${locale}#${item}`, { scroll: false });
```

to:

```ts
router.push(`/#${item}`, { scroll: false });
```

Update the `useCallback` dependency array right below it — drop `locale`:

```ts
    [locale, router],
```

to:

```ts
    [router],
```

Change the logo link (line 87):

```tsx
            href={`/${locale}`}
```

to: `href="/"`

Change both blog links (lines 104, 187):

```tsx
                    href={`/${locale}/blog`}
```

to: `href="/blog"`

- [ ] **Step 2: Fix `src/components/DetailNav.tsx`**

Remove `useLocale` from the import (line 5):

```ts
import { useTranslations, useLocale } from "next-intl";
```

to:

```ts
import { useTranslations } from "next-intl";
```

Remove the `locale` variable and the now-unnecessary `resolvedBackHref` normalization (lines 38, 44-47) — with no locale prefix, every `backHref` caller already passes the final correct path (either a shorthand `"/#section"` or a plain path), so this transform becomes a no-op and can be deleted:

```ts
const t = useTranslations("nav");
const locale = useLocale();
const [menuOpen, setMenuOpen] = useState(false);
const overlayRef = useRef<HTMLDivElement>(null);
useFocusTrap(overlayRef, menuOpen);

// "/#about" → "/nl#about": callers often omit the locale prefix; also
// strip a trailing slash before the hash so storage keys are consistent.
const resolvedBackHref = backHref.startsWith("/#")
  ? `/${locale}${backHref.slice(1)}`
  : backHref.replace(/\/#/, "#");
```

to:

```ts
const t = useTranslations("nav");
const [menuOpen, setMenuOpen] = useState(false);
const overlayRef = useRef<HTMLDivElement>(null);
useFocusTrap(overlayRef, menuOpen);
```

Update the `ArrowLink` at the bottom of the file: change the JSX attribute `href={resolvedBackHref}` to `href={backHref}`.

Change the logo link (line 65):

```tsx
          href={`/${locale}`}
```

to: `href="/"`

Change both nav-item hrefs (lines 81, 148) — the ternary `item === "blog" ? \`/${locale}/blog\` : \`/${locale}#${item}\`` becomes `item === "blog" ? "/blog" : \`/#${item}\``.

- [ ] **Step 3: Fix `src/components/WorkSection.tsx`**

Remove `useLocale` from the import (line 3):

```ts
import { useLocale, useTranslations } from "next-intl";
```

to:

```ts
import { useTranslations } from "next-intl";
```

Remove the `locale` variable (line 53):

```ts
const locale = useLocale();
```

Change the href builder (line 59):

```ts
    href: `/${locale}/work/${item.uid}`,
```

to:

```ts
    href: `/work/${item.uid}`,
```

- [ ] **Step 4: Fix `src/components/WhoAmISection.tsx`**

Remove `useLocale` from the import (line 5):

```ts
import { useTranslations, useLocale } from "next-intl";
```

to:

```ts
import { useTranslations } from "next-intl";
```

Remove the `locale` variable (line 13):

```ts
const locale = useLocale();
```

Change the `ArrowLink` href (line 112):

```tsx
            <ArrowLink href={`/${locale}/who-am-i`}>
```

to:

```tsx
            <ArrowLink href="/who-am-i">
```

- [ ] **Step 5: Fix `src/components/AboutSection.tsx`**

Remove `useLocale` from the import (line 5):

```ts
import { useTranslations, useLocale } from "next-intl";
```

to:

```ts
import { useTranslations } from "next-intl";
```

Remove the `locale` variable (line 15):

```ts
const locale = useLocale();
```

Change both hrefs (lines 156, 248):

```tsx
              href={`/${locale}/about`}
```

to: `href="/about"`

```tsx
<ArrowLink href={`/${locale}/about`}>{t("readMoreLink")}</ArrowLink>
```

to:

```tsx
<ArrowLink href="/about">{t("readMoreLink")}</ArrowLink>
```

- [ ] **Step 6: Fix `src/components/BlogGrid.tsx`**

Change the post link (line 44):

```tsx
        href={`/${locale}/blog/${post.uid}`}
```

to:

```tsx
        href={`/blog/${post.uid}`}
```

Change the `loadMore` fetch URL (line 140) — drop the now-unused `locale` query param (the API route no longer reads it, per Task 3 Step 11):

```ts
        `/api/blog?page=${nextPage}&locale=${encodeURIComponent(locale)}`,
```

to:

```ts
        `/api/blog?page=${nextPage}`,
```

`locale` stays as a prop on both `BlogGrid` and `PostCard` — it's still passed to `formatDate(post.data.publish_date, locale)`.

- [ ] **Step 7: Fix `src/app/[locale]/error.tsx`**

Remove `useLocale` from the import (line 5):

```ts
import { useTranslations, useLocale } from "next-intl";
```

to:

```ts
import { useTranslations } from "next-intl";
```

Remove the `locale` variable (line 15):

```ts
const locale = useLocale();
```

Change the link (line 37):

```tsx
          href={`/${locale}`}
```

to: `href="/"`

- [ ] **Step 8: Fix `src/app/[locale]/not-found.tsx`**

Remove `useLocale` from the import (line 2):

```ts
import { useTranslations, useLocale } from "next-intl";
```

to:

```ts
import { useTranslations } from "next-intl";
```

Remove the `locale` variable (line 6):

```ts
const locale = useLocale();
```

Change the link (line 16):

```tsx
        href={`/${locale}`}
```

to: `href="/"`

- [ ] **Step 9: Verify**

```bash
npm run tsc
npm run lint
```

Expected: both pass — no unused `useLocale` imports or `locale` variables should remain flagged.

- [ ] **Step 10: Manual smoke check**

Start the dev server and click through the one-pager in a browser: logo → home, "about" read-more → `/about`, "who-am-i" read-more → `/who-am-i`, a work carousel item → `/work/<uid>`, blog nav item → `/blog`, a blog card → `/blog/<uid>`, and each detail page's back link. Confirm no URL ever shows a `/nl` segment and no link 404s.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "refactor: strip /nl prefix from all internal nav and content links"
```

---

### Task 5: Simplify sitemap, layout metadata, llms.txt, and date formatting

**Files:**

- Modify: `src/app/sitemap.ts`
- Modify: `src/app/[locale]/layout.tsx`
- Modify: `src/app/llms.txt/route.ts`
- Modify: `src/app/llms-full.txt/route.ts`
- Modify: `src/utils/formatDate.ts`

**Interfaces:**

- Consumes: `PRISMIC_LOCALE` from `src/prismicio.ts` (Task 3).
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Rewrite `src/app/sitemap.ts`**

Replace the full file content — drop the `["en", "nl"]` cross-product, the per-document locale derivation, and the `alternates.languages` blocks (hreflang alternates don't apply to a single-language site):

```ts
import type { MetadataRoute } from "next";
import { createClient, PRISMIC_LOCALE } from "@/prismicio";
import type { Content } from "@prismicio/client";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.udocu.be";

const staticPages = [
  { path: "", priority: 1.0, changeFrequency: "weekly" as const },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/who-am-i", priority: 0.8, changeFrequency: "monthly" as const },
  { path: "/work", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/contact", priority: 0.6, changeFrequency: "yearly" as const },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" as const },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const client = createClient();

  const [blogPosts, interviews] = await Promise.all([
    client.getAllByType<Content.BlogPostDocument>("blog_post", {
      lang: PRISMIC_LOCALE,
    }),
    client.getAllByType<Content.InterviewDocument>("interview", {
      lang: PRISMIC_LOCALE,
    }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = staticPages.map((page) => ({
    url: `${SITE_URL}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${SITE_URL}/blog/${post.uid}`,
    lastModified: post.last_publication_date
      ? new Date(post.last_publication_date)
      : new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const interviewEntries: MetadataRoute.Sitemap = interviews.map(
    (interview) => ({
      url: `${SITE_URL}/work/${interview.uid}`,
      lastModified: interview.last_publication_date
        ? new Date(interview.last_publication_date)
        : new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }),
  );

  return [...staticEntries, ...blogEntries, ...interviewEntries];
}
```

- [ ] **Step 2: Simplify locale metadata in `src/app/[locale]/layout.tsx`**

Change the `openGraph` block (lines 53-59):

```ts
    openGraph: {
      siteName: t("title"),
      locale: locale === "en" ? "en_US" : "nl_BE",
      alternateLocale: locale === "en" ? "nl_BE" : "en_US",
      type: "website",
      images: [`${SITE_URL}/videos/hero-poster.webp`],
    },
```

to:

```ts
    openGraph: {
      siteName: t("title"),
      locale: "nl_BE",
      type: "website",
      images: [`${SITE_URL}/videos/hero-poster.webp`],
    },
```

Change the `WebSite` JSON-LD `inLanguage` field (line 196):

```ts
            inLanguage: ["en", "nl"],
```

to:

```ts
            inLanguage: "nl-BE",
```

Change the founder URL (line 121) — drop the already-hardcoded `/nl` prefix, now genuinely redundant:

```ts
              url: `${SITE_URL}/nl/who-am-i`,
```

to:

```ts
              url: `${SITE_URL}/who-am-i`,
```

- [ ] **Step 3: Fix links and language claim in `src/app/llms.txt/route.ts`**

Change the language line (line 27):

```
- **Languages**: Dutch (primary), English
```

to:

```
- **Languages**: Dutch
```

Change every link (lines 31-35):

```
- [About udocu](${SITE_URL}/en/about)
- [Who is Kurt Vandemaele](${SITE_URL}/en/who-am-i)
- [Work & Interviews](${SITE_URL}/en/work)
- [Blog](${SITE_URL}/en/blog)
- [Contact](${SITE_URL}/en/contact)
```

to:

```
- [About udocu](${SITE_URL}/about)
- [Who is Kurt Vandemaele](${SITE_URL}/who-am-i)
- [Work & Interviews](${SITE_URL}/work)
- [Blog](${SITE_URL}/blog)
- [Contact](${SITE_URL}/contact)
```

- [ ] **Step 4: Fix links and language claims in `src/app/llms-full.txt/route.ts`**

Change both language lines (lines 59, 27 is llms.txt not this file — only line 59 here):

```
- **Languages**: Dutch (primary), English
```

to:

```
- **Languages**: Dutch
```

Change the site-structure links (lines 63-68):

```
- [Home](${SITE_URL}/en) — Main landing page with overview of all sections
- [About udocu](${SITE_URL}/en/about) — Detailed explanation of the udocu concept and services
- [Who Am I](${SITE_URL}/en/who-am-i) — Kurt Vandemaele's personal story and background
- [Work](${SITE_URL}/en/work) — Portfolio of documentary interviews and projects
- [Blog](${SITE_URL}/en/blog) — Stories, insights, and reflections on documentary storytelling
- [Contact](${SITE_URL}/en/contact) — Get in touch with udocu
```

to:

```
- [Home](${SITE_URL}) — Main landing page with overview of all sections
- [About udocu](${SITE_URL}/about) — Detailed explanation of the udocu concept and services
- [Who Am I](${SITE_URL}/who-am-i) — Kurt Vandemaele's personal story and background
- [Work](${SITE_URL}/work) — Portfolio of documentary interviews and projects
- [Blog](${SITE_URL}/blog) — Stories, insights, and reflections on documentary storytelling
- [Contact](${SITE_URL}/contact) — Get in touch with udocu
```

Change the FAQ answer about website language (line 79) — the website-availability claim only, not the surrounding business-language sentence:

```
Udocu primarily works in Dutch but also offers services in English. The website is available in both Dutch and English.
```

to:

```
Udocu primarily works in Dutch but also offers services in English. The website itself is in Dutch.
```

- [ ] **Step 5: Fix `src/utils/formatDate.ts`**

Change the locale code (line 3):

```ts
    locale === "nl" ? "nl-NL" : "en-US",
```

to:

```ts
    locale === "nl" ? "nl-BE" : "en-US",
```

- [ ] **Step 6: Verify**

```bash
npm run tsc
npm run lint
```

Expected: both pass.

- [ ] **Step 7: Manual smoke check**

```bash
npm run dev &
sleep 3
curl -s http://localhost:3000/sitemap.xml | grep -c "/en/"
curl -s http://localhost:3000/llms.txt | grep -c "/en/"
kill %1
```

Expected: both return `0` (no remaining `/en/` links anywhere).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "refactor: simplify sitemap, OpenGraph/JSON-LD locale metadata, and llms.txt for Dutch-only site"
```

---

### Task 6: Update Playwright tests for unprefixed URLs, then full verification

**Files:**

- Modify: `tests/navigation/helpers.ts`
- Modify: `tests/navigation/navigation.spec.ts`
- Modify: `tests/navigation/menu.spec.ts`
- Modify: `tests/navigation/menu-ux.spec.ts`
- Modify: `tests/performance/vitals.spec.ts`
- Modify: `tests/scroll-colors/scroll-colors.spec.ts`

**Interfaces:**

- Consumes: the final, fully-updated app from Tasks 1–5 (this task must run last).

- [ ] **Step 1: Fix `tests/navigation/helpers.ts`**

Change the locale constants (lines 12-13):

```ts
export const LOCALE = "nl";
export const HOME = `/${LOCALE}`;
```

to:

```ts
export const HOME = "";
```

Change `goHome` (inside the function body) — it can no longer navigate to `HOME` directly since `HOME` is now an empty prefix, not a path:

```ts
export async function goHome(page: Page): Promise<void> {
  await page.goto(HOME, { waitUntil: "load" });
```

to:

```ts
export async function goHome(page: Page): Promise<void> {
  await page.goto("/", { waitUntil: "load" });
```

Update the doc comment above `firstHref` (currently says `e.g. "/nl/work/"`) to `e.g. "/work/"`.

- [ ] **Step 2: Fix `tests/navigation/navigation.spec.ts`**

Change the import (drop `LOCALE`, keep everything else):

```ts
import {
  LOCALE,
  HOME,
  SECTIONS,
  HAMBURGER,
  goHome,
  gotoPage,
  visibleBackLink,
  sectionCoversViewportCentre,
  firstHref,
  revealSection,
```

to:

```ts
import {
  HOME,
  SECTIONS,
  HAMBURGER,
  goHome,
  gotoPage,
  visibleBackLink,
  sectionCoversViewportCentre,
  firstHref,
  revealSection,
```

Replace every `new RegExp(`/${LOCALE}/...`)` assertion with the unprefixed equivalent:

```ts
await expect(page).toHaveURL(new RegExp(`/${LOCALE}/about/?$`));
```

→

```ts
await expect(page).toHaveURL(/\/about\/?$/);
```

```ts
await expect(page).toHaveURL(new RegExp(`/${LOCALE}/who-am-i/?$`));
```

→

```ts
await expect(page).toHaveURL(/\/who-am-i\/?$/);
```

```ts
await expect(page).toHaveURL(new RegExp(`/${LOCALE}/work/[^/]+/?$`));
```

→

```ts
await expect(page).toHaveURL(/\/work\/[^/]+\/?$/);
```

(this pattern appears twice — lines 97 and 129 — fix both)

```ts
await expect(page).toHaveURL(new RegExp(`/${LOCALE}(#work)?$`));
```

→

```ts
await expect(page).toHaveURL(/\/(#work)?$/);
```

```ts
await expect(page).toHaveURL(new RegExp(`/${LOCALE}(#about)?$`));
```

→

```ts
await expect(page).toHaveURL(/\/(#about)?$/);
```

```ts
expect(href, "fallback href should target #about").toMatch(/\/nl#about$/);
```

→

```ts
expect(href, "fallback href should target #about").toMatch(/\/#about$/);
```

```ts
await expect(page).toHaveURL(new RegExp(`/${LOCALE}/blog/?$`));
```

→

```ts
await expect(page).toHaveURL(/\/blog\/?$/);
```

(this pattern appears twice — lines 197 and 221/225 — fix all occurrences)

Update the doc comment block at the top of the file (lines 9-11, 18) replacing `/nl/about`, `/nl/who-am-i`, `/nl/work/<uid>`, `/nl/blog` with `/about`, `/who-am-i`, `/work/<uid>`, `/blog`.

- [ ] **Step 3: Fix `tests/navigation/menu.spec.ts`**

Change the import (line 13):

```ts
import { LOCALE, HAMBURGER } from "./helpers";
```

to:

```ts
import { HAMBURGER } from "./helpers";
```

Change the `SCREENS` array (lines 17-21):

```ts
const SCREENS: Array<{ name: string; path: string; nav: NavKind }> = [
  { name: "home (StickyNav)", path: `/${LOCALE}`, nav: "sticky" },
  { name: "about detail (DetailNav)", path: `/${LOCALE}/about`, nav: "detail" },
  { name: "blog overview (DetailNav)", path: `/${LOCALE}/blog`, nav: "detail" },
];
```

to:

```ts
const SCREENS: Array<{ name: string; path: string; nav: NavKind }> = [
  { name: "home (StickyNav)", path: "/", nav: "sticky" },
  { name: "about detail (DetailNav)", path: "/about", nav: "detail" },
  { name: "blog overview (DetailNav)", path: "/blog", nav: "detail" },
];
```

Change `itemHref` (lines 28-33):

```ts
function itemHref(nav: NavKind, key: Item): string {
  if (key === "home") return `/${LOCALE}`;
  if (key === "blog") return `/${LOCALE}/blog`;
  // Section links: StickyNav uses bare "#about"; DetailNav uses "/nl#about".
  return nav === "sticky" ? `#${key}` : `/${LOCALE}#${key}`;
}
```

to:

```ts
function itemHref(nav: NavKind, key: Item): string {
  if (key === "home") return "/";
  if (key === "blog") return "/blog";
  // Section links: StickyNav uses bare "#about"; DetailNav uses "/#about".
  return nav === "sticky" ? `#${key}` : `/#${key}`;
}
```

Change `expectedUrl` (lines 36-40):

```ts
function expectedUrl(key: Item): RegExp {
  if (key === "home") return new RegExp(`/${LOCALE}$`);
  if (key === "blog") return new RegExp(`/${LOCALE}/blog/?$`);
  return new RegExp(`/${LOCALE}#${key}$`);
}
```

to:

```ts
function expectedUrl(key: Item): RegExp {
  if (key === "home") return /\/$/;
  if (key === "blog") return /\/blog\/?$/;
  return new RegExp(`/#${key}$`);
}
```

- [ ] **Step 4: Fix `tests/navigation/menu-ux.spec.ts`**

Change line 41:

```ts
await page.locator(`[role="dialog"] a[href="/nl/blog"]`).click();
```

to:

```ts
await page.locator(`[role="dialog"] a[href="/blog"]`).click();
```

Change line 42:

```ts
await expect(page).toHaveURL(/\/nl\/blog\/?$/);
```

to:

```ts
await expect(page).toHaveURL(/\/blog\/?$/);
```

Change line 83:

```ts
await page.goto("/nl/about", { waitUntil: "load" });
```

to:

```ts
await page.goto("/about", { waitUntil: "load" });
```

- [ ] **Step 5: Fix `tests/performance/vitals.spec.ts`**

Change line 11:

```ts
await page.goto("/nl", { waitUntil: "load" });
```

to:

```ts
await page.goto("/", { waitUntil: "load" });
```

Change the `describe` title (line 45):

```ts
test.describe("Core Web Vitals — homepage (/nl)", () => {
```

to:

```ts
test.describe("Core Web Vitals — homepage (/)", () => {
```

- [ ] **Step 6: Fix `tests/scroll-colors/scroll-colors.spec.ts`**

Change line 55:

```ts
await page.goto("/nl", { waitUntil: "load" });
```

to:

```ts
await page.goto("/", { waitUntil: "load" });
```

- [ ] **Step 7: Run the full test suite**

```bash
npm run tsc
npm run lint
npm run build
npm run test:nav
npm run test:perf
npx playwright test --project=scroll-colors-desktop
```

Expected: `tsc`, `lint`, and `build` all pass with zero errors; all Playwright projects pass (`test:nav` covers `navigation-webkit-desktop` + `navigation-webkit`, which runs both `navigation.spec.ts` and `menu.spec.ts` and `menu-ux.spec.ts`; `test:perf` covers `vitals.spec.ts`; the explicit `scroll-colors-desktop` project covers `scroll-colors.spec.ts`).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "test: update Playwright specs for unprefixed single-locale URLs"
```

---

## Manual steps after this plan (not part of any task — no API/CLI path exists)

1. In Prismic, archive then permanently delete `interview-1` through `interview-5` (Settings → the document list → select all five → Archive, then Archived tab → Delete).
2. Optionally, in Prismic → Settings → Translations & Locales, remove `en-us` as an enabled locale — safe to skip and leave it enabled-but-unused if there's any chance English content returns later.
