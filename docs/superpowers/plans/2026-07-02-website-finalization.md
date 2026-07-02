# Website Finalization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the final layer of production polish to udocu.be — icons for all platforms, dynamic mobile browser chrome color, social sharing images, and SEO schema improvements.

**Architecture:** Seven independent tasks executed in order. Tasks 1–3 and 5–7 are fully independent. Task 4 (manifest) depends on Task 3 (icons) because it references the generated icon URLs. No new dependencies are added — everything uses built-in Next.js APIs (`next/og`, `Metadata`, `Viewport`).

**Tech Stack:** Next.js 15 App Router, `next/og` ImageResponse API, TypeScript, Tailwind CSS v4, next-intl, Prismic CMS.

## Global Constraints

- All paths use the `@/*` alias (maps to `./src/*`)
- Theme tokens from `globals.css` — use CSS hex values directly in ImageResponse (no Tailwind classes work there)
- Primary brand color: `#686121` (green-dark), logo foreground: `#aed473` (green-light)
- No new npm packages — only built-in Next.js APIs
- Run `npm run tsc` and `npm run lint` before every commit to catch type errors early
- No test runner configured — verification is `npm run tsc`, `npm run lint`, `npm run build`, and visual browser inspection
- Commit after every task

---

## File Map

| File                                   | Action     | Purpose                                                                 |
| -------------------------------------- | ---------- | ----------------------------------------------------------------------- |
| `src/app/[locale]/layout.tsx`          | Modify     | Add `viewport` export with `themeColor`; enrich Person JSON-LD          |
| `src/app/globals.css`                  | Modify     | Add `background-color` to `body` to prevent white flash                 |
| `src/components/ThemeColorSync.tsx`    | **Create** | Client component — syncs scroll `bgColor` → `<meta name="theme-color">` |
| `src/app/[locale]/page.tsx`            | Modify     | Mount `<ThemeColorSync />` inside `<ScrollColorProvider>`               |
| `src/app/apple-icon.tsx`               | **Create** | 180×180 PNG — iOS home screen icon via `ImageResponse`                  |
| `src/app/icon.tsx`                     | **Create** | 512×512 PNG — Android/PWA/modern browser icon via `ImageResponse`       |
| `src/app/manifest.ts`                  | **Create** | Web app manifest — name, colors, icon references                        |
| `src/app/opengraph-image.tsx`          | **Create** | 1200×630 OG fallback image for pages without a Prismic image            |
| `src/app/[locale]/work/[uid]/page.tsx` | Modify     | Add `VideoObject` JSON-LD when a YouTube URL is present                 |
| `src/app/[locale]/blog/[uid]/page.tsx` | Modify     | Add `description` field to existing `BlogPosting` JSON-LD               |
| `src/app/llms-full.txt/route.ts`       | Modify     | Add `Last-Updated` line so AI crawlers see content freshness            |

---

## Task 1: Viewport theme-color + body background

**Files:**

- Modify: `src/app/[locale]/layout.tsx`
- Modify: `src/app/globals.css`

**What this does:** Sets the initial mobile browser chrome color to green-dark and prevents the white flash before CSS paints by giving `body` an explicit background color.

- [ ] **Step 1: Add `viewport` export to layout.tsx**

  Open `src/app/[locale]/layout.tsx`. Add this import at the top alongside the existing `Metadata` import:

  ```tsx
  import type { Metadata, Viewport } from "next";
  ```

  Then add this named export **before** `generateMetadata` (at module level, not inside a function):

  ```tsx
  export const viewport: Viewport = {
    themeColor: "#686121",
  };
  ```

- [ ] **Step 2: Add body background-color to globals.css**

  Open `src/app/globals.css`. Replace the existing `body` rule:

  ```css
  body {
    font-family: var(--font-serif);
    scroll-behavior: initial;
    overscroll-behavior-y: none;
    background-color: #686121;
  }
  ```

- [ ] **Step 3: Type-check**

  ```bash
  npm run tsc
  ```

  Expected: no errors.

- [ ] **Step 4: Lint**

  ```bash
  npm run lint
  ```

  Expected: no errors.

- [ ] **Step 5: Verify in browser**

  Run `npm run dev`, open `http://localhost:3000/nl` on a mobile device or using Chrome DevTools device emulation. The browser address bar should show `#686121` (dark olive green).

- [ ] **Step 6: Commit**

  ```bash
  git add src/app/\[locale\]/layout.tsx src/app/globals.css
  git commit -m "feat: add viewport themeColor and body background-color"
  ```

---

## Task 2: Dynamic theme-color sync on homepage scroll

**Files:**

- Create: `src/components/ThemeColorSync.tsx`
- Modify: `src/app/[locale]/page.tsx`

**What this does:** On the homepage only, the mobile browser chrome color follows the scroll-based color theme. As the user scrolls from section to section (green → orange → red → blue), the browser chrome updates to match. On all other pages, the static `#686121` from Task 1 is used.

**Depends on:** `ScrollColorContext` in `src/context/ScrollColorContext.tsx` (already exists — exposes `bgColor: string`).

- [ ] **Step 1: Create `ThemeColorSync.tsx`**

  Create `src/components/ThemeColorSync.tsx` with this exact content:

  ```tsx
  "use client";

  import { useEffect } from "react";
  import { useScrollColor } from "@/context/ScrollColorContext";

  export default function ThemeColorSync() {
    const { bgColor } = useScrollColor();

    useEffect(() => {
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute("content", bgColor);
    }, [bgColor]);

    return null;
  }
  ```

- [ ] **Step 2: Mount in page.tsx**

  Open `src/app/[locale]/page.tsx`. Add the import:

  ```tsx
  import ThemeColorSync from "@/components/ThemeColorSync";
  ```

  Then add `<ThemeColorSync />` as the first child inside `<ScrollColorProvider>`:

  ```tsx
  <ScrollColorProvider>
    <ThemeColorSync />
    <MagneticScroll />
    <main id="main-content">{/* ... rest unchanged ... */}</main>
  </ScrollColorProvider>
  ```

- [ ] **Step 3: Type-check and lint**

  ```bash
  npm run tsc && npm run lint
  ```

  Expected: no errors.

- [ ] **Step 4: Verify in browser**

  Open `http://localhost:3000/nl` in Chrome DevTools with a mobile device profile. Scroll down through sections — the theme-color in the DevTools Application tab (or the simulated chrome bar) should update to each section's background color.

- [ ] **Step 5: Commit**

  ```bash
  git add src/components/ThemeColorSync.tsx src/app/\[locale\]/page.tsx
  git commit -m "feat: sync mobile browser chrome color with scroll section"
  ```

---

## Task 3: Apple touch icon + browser icon

**Files:**

- Create: `src/app/apple-icon.tsx`
- Create: `src/app/icon.tsx`

**What this does:** Next.js automatically picks up `apple-icon.tsx` and `icon.tsx` from the `app/` directory and injects the correct `<link>` tags. `apple-icon.tsx` generates the 180×180 PNG shown when a user adds the site to their iOS home screen. `icon.tsx` generates a 512×512 PNG for Android, PWA, and high-DPI browser tabs (coexists with the existing `favicon.ico`).

Both render the udocu wordmark SVG (5 paths, no mask needed) as white on the `#686121` background using Next.js `ImageResponse`.

- [ ] **Step 1: Create `apple-icon.tsx`**

  Create `src/app/apple-icon.tsx`:

  ```tsx
  import { ImageResponse } from "next/og";

  export const size = { width: 180, height: 180 };
  export const contentType = "image/png";

  export default function AppleIcon() {
    return new ImageResponse(
      <div
        style={{
          width: 180,
          height: 180,
          background: "#686121",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg viewBox="0 0 1042 562" width={148} height={80} fill="white">
          <path d="M407.092 453.53C406.758 469.858 404.754 485.094 399.272 499.687C390.543 523.92 372.422 541.951 348.162 550.565C334.327 555.396 320.286 557.943 305.294 557.959L214.634 558.058L214.635 3.9325L303.606 4.02689C319.367 4.04286 334.302 6.52751 348.91 11.764C372.686 20.4872 390.546 38.2776 399.214 62.1338C404.53 76.7643 407.056 92.1224 407.057 108.07L407.092 453.53ZM336.623 420.256L336.626 141.319C336.626 136.396 335.705 132.214 334.626 127.837C331.892 116.744 322.73 109.207 311.033 108.724C302.372 108.365 293.8 108.48 285.303 108.618V453.268C294.281 453.406 303.287 453.682 312.273 453.141C322.651 452.515 330.962 445.807 334.016 436.191C335.616 431.15 336.623 426.368 336.623 420.256Z" />
          <path d="M607.926 510.391C587.419 552.952 541.077 568.956 496.638 559.336C466.173 552.74 441.956 531.733 430.88 502.604C425.775 489.18 422.926 475.032 422.928 460.262L422.968 101.078C422.971 82.904 427.36 65.0961 435.557 49.2733C446.434 28.2794 464.569 12.718 487.019 5.40345C508.876 -1.71505 532.424 -1.79057 554.333 5.12028C577.804 12.5249 596.518 28.7223 607.466 50.7139C615.276 66.4045 619.31 83.7521 619.308 101.682L619.299 460.873C619.299 478.264 615.29 495.111 607.926 510.391ZM548.778 427.648L548.785 138.111C548.785 120.501 541.224 104.705 521.845 104.576C503.323 104.451 495.047 116.516 493.545 134.01L493.551 426.246C493.551 443.03 502.849 457.831 521.268 457.493C539.612 457.156 547.307 444.997 548.778 427.648Z" />
          <path d="M970.948 3.97453L1041.41 3.89612L1041.36 460.239C1041.36 503.008 1019.22 542.961 977.23 556.684C955.551 563.768 932.035 563.81 910.283 557.028C883.945 548.818 863.814 529.547 853.547 504.114C847.625 489.781 845.28 474.709 844.931 458.949L844.921 3.92661L915.566 3.92516L915.563 426.98C916.02 431.548 916.617 435.369 917.798 439.285C921.251 451.097 931.423 457.684 943.468 457.535C954.665 457.395 964.154 451.775 968.053 440.902C969.672 435.98 970.941 430.824 970.941 425.057L970.948 3.97453Z" />
          <path d="M125.904 3.97022H196.527L196.437 460.862C196.434 478.237 192.409 495.121 185.055 510.395C172.842 535.757 150.115 553.456 122.631 559.372C78.2876 568.919 32.0493 552.891 11.5476 510.605C3.97167 495.632 0.916315 479.404 0.0130695 462.527L0 3.90051L70.6754 3.9949L70.6725 426.223C70.9629 431.661 71.6933 436.461 73.5231 441.188C77.5456 451.81 87.1168 457.702 98.3884 457.497C107.393 457.334 115.61 453.952 120.592 446.238C123.344 440.637 125.874 434.531 125.875 427.625L125.904 3.97022Z" />
          <path d="M733.616 457.501C744.997 457.479 754.16 451.835 758.516 441.568C760.988 435.636 761.631 429.379 761.881 422.628L761.888 353.105L830.83 353.102L830.802 460.917C830.237 478.484 826.976 494.878 819.387 510.446C807.078 535.697 784.475 553.459 756.939 559.379C712.069 569.029 665.939 552.304 645.956 509.226C638.915 494.044 635.119 477.432 635.12 460.284L635.13 100.994C635.132 82.7849 639.458 65.1019 647.632 49.2661C658.821 27.5853 677.696 11.8017 701.067 4.68466C722.109 -1.72229 744.667 -1.54222 765.575 5.17984C788.954 12.6948 807.337 28.8893 818.279 50.6703C826.175 66.406 829.595 83.1538 829.966 100.986L829.95 203.479L761.042 203.458L761.018 137.61C760.818 131.062 759.958 124.824 757.347 119.053C752.928 109.242 743.826 104.535 733.318 104.534C714.62 104.531 705.793 118.915 705.794 136.191L705.829 427.659C705.83 432.922 707.569 437.922 709.336 442.182C713.512 452.253 722.674 457.522 733.616 457.501Z" />
        </svg>
      </div>,
      { width: 180, height: 180 },
    );
  }
  ```

- [ ] **Step 2: Create `icon.tsx`**

  Create `src/app/icon.tsx` with the same SVG but at 512×512. The logo is sized to 432×233 (aspect ratio 1042:562) with centered padding:

  ```tsx
  import { ImageResponse } from "next/og";

  export const size = { width: 512, height: 512 };
  export const contentType = "image/png";

  export default function Icon() {
    return new ImageResponse(
      <div
        style={{
          width: 512,
          height: 512,
          background: "#686121",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg viewBox="0 0 1042 562" width={432} height={233} fill="white">
          <path d="M407.092 453.53C406.758 469.858 404.754 485.094 399.272 499.687C390.543 523.92 372.422 541.951 348.162 550.565C334.327 555.396 320.286 557.943 305.294 557.959L214.634 558.058L214.635 3.9325L303.606 4.02689C319.367 4.04286 334.302 6.52751 348.91 11.764C372.686 20.4872 390.546 38.2776 399.214 62.1338C404.53 76.7643 407.056 92.1224 407.057 108.07L407.092 453.53ZM336.623 420.256L336.626 141.319C336.626 136.396 335.705 132.214 334.626 127.837C331.892 116.744 322.73 109.207 311.033 108.724C302.372 108.365 293.8 108.48 285.303 108.618V453.268C294.281 453.406 303.287 453.682 312.273 453.141C322.651 452.515 330.962 445.807 334.016 436.191C335.616 431.15 336.623 426.368 336.623 420.256Z" />
          <path d="M607.926 510.391C587.419 552.952 541.077 568.956 496.638 559.336C466.173 552.74 441.956 531.733 430.88 502.604C425.775 489.18 422.926 475.032 422.928 460.262L422.968 101.078C422.971 82.904 427.36 65.0961 435.557 49.2733C446.434 28.2794 464.569 12.718 487.019 5.40345C508.876 -1.71505 532.424 -1.79057 554.333 5.12028C577.804 12.5249 596.518 28.7223 607.466 50.7139C615.276 66.4045 619.31 83.7521 619.308 101.682L619.299 460.873C619.299 478.264 615.29 495.111 607.926 510.391ZM548.778 427.648L548.785 138.111C548.785 120.501 541.224 104.705 521.845 104.576C503.323 104.451 495.047 116.516 493.545 134.01L493.551 426.246C493.551 443.03 502.849 457.831 521.268 457.493C539.612 457.156 547.307 444.997 548.778 427.648Z" />
          <path d="M970.948 3.97453L1041.41 3.89612L1041.36 460.239C1041.36 503.008 1019.22 542.961 977.23 556.684C955.551 563.768 932.035 563.81 910.283 557.028C883.945 548.818 863.814 529.547 853.547 504.114C847.625 489.781 845.28 474.709 844.931 458.949L844.921 3.92661L915.566 3.92516L915.563 426.98C916.02 431.548 916.617 435.369 917.798 439.285C921.251 451.097 931.423 457.684 943.468 457.535C954.665 457.395 964.154 451.775 968.053 440.902C969.672 435.98 970.941 430.824 970.941 425.057L970.948 3.97453Z" />
          <path d="M125.904 3.97022H196.527L196.437 460.862C196.434 478.237 192.409 495.121 185.055 510.395C172.842 535.757 150.115 553.456 122.631 559.372C78.2876 568.919 32.0493 552.891 11.5476 510.605C3.97167 495.632 0.916315 479.404 0.0130695 462.527L0 3.90051L70.6754 3.9949L70.6725 426.223C70.9629 431.661 71.6933 436.461 73.5231 441.188C77.5456 451.81 87.1168 457.702 98.3884 457.497C107.393 457.334 115.61 453.952 120.592 446.238C123.344 440.637 125.874 434.531 125.875 427.625L125.904 3.97022Z" />
          <path d="M733.616 457.501C744.997 457.479 754.16 451.835 758.516 441.568C760.988 435.636 761.631 429.379 761.881 422.628L761.888 353.105L830.83 353.102L830.802 460.917C830.237 478.484 826.976 494.878 819.387 510.446C807.078 535.697 784.475 553.459 756.939 559.379C712.069 569.029 665.939 552.304 645.956 509.226C638.915 494.044 635.119 477.432 635.12 460.284L635.13 100.994C635.132 82.7849 639.458 65.1019 647.632 49.2661C658.821 27.5853 677.696 11.8017 701.067 4.68466C722.109 -1.72229 744.667 -1.54222 765.575 5.17984C788.954 12.6948 807.337 28.8893 818.279 50.6703C826.175 66.406 829.595 83.1538 829.966 100.986L829.95 203.479L761.042 203.458L761.018 137.61C760.818 131.062 759.958 124.824 757.347 119.053C752.928 109.242 743.826 104.535 733.318 104.534C714.62 104.531 705.793 118.915 705.794 136.191L705.829 427.659C705.83 432.922 707.569 437.922 709.336 442.182C713.512 452.253 722.674 457.522 733.616 457.501Z" />
        </svg>
      </div>,
      { width: 512, height: 512 },
    );
  }
  ```

- [ ] **Step 3: Type-check and lint**

  ```bash
  npm run tsc && npm run lint
  ```

  Expected: no errors.

- [ ] **Step 4: Verify icon routes**

  With `npm run dev` running, open these URLs in a browser and confirm they render the udocu wordmark on a dark green background:
  - `http://localhost:3000/apple-icon.png`
  - `http://localhost:3000/icon.png`

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/apple-icon.tsx src/app/icon.tsx
  git commit -m "feat: add apple-touch-icon and 512px browser/PWA icon"
  ```

---

## Task 4: Web app manifest

**Files:**

- Create: `src/app/manifest.ts`

**What this does:** Makes the site installable as a Progressive Web App on Android and removes the white splash screen on launch. References the icons generated in Task 3.

**Depends on:** Task 3 (icon.tsx and apple-icon.tsx must be committed so Next.js generates their routes at `/icon` and `/apple-icon`).

- [ ] **Step 1: Create `manifest.ts`**

  Create `src/app/manifest.ts`:

  ```ts
  import type { MetadataRoute } from "next";

  export default function manifest(): MetadataRoute.Manifest {
    return {
      name: "udocu",
      short_name: "udocu",
      description: "So as not to forget who you were",
      start_url: "/nl",
      display: "standalone",
      background_color: "#686121",
      theme_color: "#686121",
      icons: [
        {
          src: "/apple-icon",
          sizes: "180x180",
          type: "image/png",
        },
        {
          src: "/icon",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    };
  }
  ```

- [ ] **Step 2: Type-check and lint**

  ```bash
  npm run tsc && npm run lint
  ```

  Expected: no errors.

- [ ] **Step 3: Verify manifest route**

  Open `http://localhost:3000/manifest.webmanifest` — confirm it returns valid JSON with `name`, `theme_color`, and `icons`.

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/manifest.ts
  git commit -m "feat: add web app manifest for PWA installability"
  ```

---

## Task 5: OG image — site-wide social sharing fallback

**Files:**

- Create: `src/app/opengraph-image.tsx`

**What this does:** Provides a branded 1200×630 image for link previews on Twitter/X, LinkedIn, Facebook, Instagram, iMessage, Slack, etc. for any page that doesn't supply its own Prismic image. Blog posts and interview pages already have per-page images — this serves home, about, who-am-i, and contact.

- [ ] **Step 1: Create `opengraph-image.tsx`**

  Create `src/app/opengraph-image.tsx`:

  ```tsx
  import { ImageResponse } from "next/og";

  export const size = { width: 1200, height: 630 };
  export const contentType = "image/png";

  export default function OGImage() {
    return new ImageResponse(
      <div
        style={{
          width: 1200,
          height: 630,
          background: "#686121",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
        }}
      >
        <svg viewBox="0 0 1042 562" width={700} height={377} fill="white">
          <path d="M407.092 453.53C406.758 469.858 404.754 485.094 399.272 499.687C390.543 523.92 372.422 541.951 348.162 550.565C334.327 555.396 320.286 557.943 305.294 557.959L214.634 558.058L214.635 3.9325L303.606 4.02689C319.367 4.04286 334.302 6.52751 348.91 11.764C372.686 20.4872 390.546 38.2776 399.214 62.1338C404.53 76.7643 407.056 92.1224 407.057 108.07L407.092 453.53ZM336.623 420.256L336.626 141.319C336.626 136.396 335.705 132.214 334.626 127.837C331.892 116.744 322.73 109.207 311.033 108.724C302.372 108.365 293.8 108.48 285.303 108.618V453.268C294.281 453.406 303.287 453.682 312.273 453.141C322.651 452.515 330.962 445.807 334.016 436.191C335.616 431.15 336.623 426.368 336.623 420.256Z" />
          <path d="M607.926 510.391C587.419 552.952 541.077 568.956 496.638 559.336C466.173 552.74 441.956 531.733 430.88 502.604C425.775 489.18 422.926 475.032 422.928 460.262L422.968 101.078C422.971 82.904 427.36 65.0961 435.557 49.2733C446.434 28.2794 464.569 12.718 487.019 5.40345C508.876 -1.71505 532.424 -1.79057 554.333 5.12028C577.804 12.5249 596.518 28.7223 607.466 50.7139C615.276 66.4045 619.31 83.7521 619.308 101.682L619.299 460.873C619.299 478.264 615.29 495.111 607.926 510.391ZM548.778 427.648L548.785 138.111C548.785 120.501 541.224 104.705 521.845 104.576C503.323 104.451 495.047 116.516 493.545 134.01L493.551 426.246C493.551 443.03 502.849 457.831 521.268 457.493C539.612 457.156 547.307 444.997 548.778 427.648Z" />
          <path d="M970.948 3.97453L1041.41 3.89612L1041.36 460.239C1041.36 503.008 1019.22 542.961 977.23 556.684C955.551 563.768 932.035 563.81 910.283 557.028C883.945 548.818 863.814 529.547 853.547 504.114C847.625 489.781 845.28 474.709 844.931 458.949L844.921 3.92661L915.566 3.92516L915.563 426.98C916.02 431.548 916.617 435.369 917.798 439.285C921.251 451.097 931.423 457.684 943.468 457.535C954.665 457.395 964.154 451.775 968.053 440.902C969.672 435.98 970.941 430.824 970.941 425.057L970.948 3.97453Z" />
          <path d="M125.904 3.97022H196.527L196.437 460.862C196.434 478.237 192.409 495.121 185.055 510.395C172.842 535.757 150.115 553.456 122.631 559.372C78.2876 568.919 32.0493 552.891 11.5476 510.605C3.97167 495.632 0.916315 479.404 0.0130695 462.527L0 3.90051L70.6754 3.9949L70.6725 426.223C70.9629 431.661 71.6933 436.461 73.5231 441.188C77.5456 451.81 87.1168 457.702 98.3884 457.497C107.393 457.334 115.61 453.952 120.592 446.238C123.344 440.637 125.874 434.531 125.875 427.625L125.904 3.97022Z" />
          <path d="M733.616 457.501C744.997 457.479 754.16 451.835 758.516 441.568C760.988 435.636 761.631 429.379 761.881 422.628L761.888 353.105L830.83 353.102L830.802 460.917C830.237 478.484 826.976 494.878 819.387 510.446C807.078 535.697 784.475 553.459 756.939 559.379C712.069 569.029 665.939 552.304 645.956 509.226C638.915 494.044 635.119 477.432 635.12 460.284L635.13 100.994C635.132 82.7849 639.458 65.1019 647.632 49.2661C658.821 27.5853 677.696 11.8017 701.067 4.68466C722.109 -1.72229 744.667 -1.54222 765.575 5.17984C788.954 12.6948 807.337 28.8893 818.279 50.6703C826.175 66.406 829.595 83.1538 829.966 100.986L829.95 203.479L761.042 203.458L761.018 137.61C760.818 131.062 759.958 124.824 757.347 119.053C752.928 109.242 743.826 104.535 733.318 104.534C714.62 104.531 705.793 118.915 705.794 136.191L705.829 427.659C705.83 432.922 707.569 437.922 709.336 442.182C713.512 452.253 722.674 457.522 733.616 457.501Z" />
        </svg>
        <p
          style={{
            color: "#aed473",
            fontSize: 28,
            fontStyle: "italic",
            margin: 0,
            letterSpacing: "0.02em",
            fontFamily: "serif",
          }}
        >
          So as not to forget who you were
        </p>
      </div>,
      { width: 1200, height: 630 },
    );
  }
  ```

- [ ] **Step 2: Type-check and lint**

  ```bash
  npm run tsc && npm run lint
  ```

  Expected: no errors.

- [ ] **Step 3: Verify OG image route**

  Open `http://localhost:3000/opengraph-image.png` — confirm it renders the udocu wordmark in white on a dark green background with the green-light tagline below.

- [ ] **Step 4: Commit**

  ```bash
  git add src/app/opengraph-image.tsx
  git commit -m "feat: add OG image fallback for social link previews"
  ```

---

## Task 6: VideoObject schema on interview pages

**Files:**

- Modify: `src/app/[locale]/work/[uid]/page.tsx`

**What this does:** Adds `VideoObject` JSON-LD to interview pages that have a YouTube embed. This enables Google's Video Search carousel and gives AI models structured information about the video content.

- [ ] **Step 1: Add the VideoObject JSON-LD block**

  Open `src/app/[locale]/work/[uid]/page.tsx`. The file already has `videoUrl`, `page.data.name`, `page.data.lead`, `page.data.image_url`, and `page.data.publish_date`. Add this block immediately after the existing `breadcrumbJsonLd` definition (around line 128), before `return`:

  ```tsx
  const videoJsonLd = videoUrl
    ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: page.data.name,
        description: prismic.asText(page.data.lead) ?? undefined,
        thumbnailUrl: page.data.image_url?.url ?? undefined,
        embedUrl: videoUrl,
        uploadDate: page.data.publish_date ?? undefined,
        publisher: {
          "@type": "Organization",
          name: "udocu",
          url: SITE_URL,
        },
      }
    : null;
  ```

  You need to add `import * as prismic from "@prismicio/client"` at the top of the file if it isn't already imported. Check the existing imports — it's already there as `import * as prismic from "@prismicio/client"` on line 3.

- [ ] **Step 2: Render the VideoObject script tag**

  Inside the `return` block, after the existing breadcrumb `<script>` tag, add:

  ```tsx
  {
    videoJsonLd && (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
      />
    );
  }
  ```

  Place it immediately after the breadcrumb script tag (around line 135).

- [ ] **Step 3: Type-check and lint**

  ```bash
  npm run tsc && npm run lint
  ```

  Expected: no errors.

- [ ] **Step 4: Verify schema**

  With `npm run dev` running, open any interview page (e.g. `http://localhost:3000/nl/work/<uid>`). View page source and confirm a `<script type="application/ld+json">` block containing `"@type": "VideoObject"` is present when the interview has a video.

  Then paste the page URL into https://validator.schema.org to confirm the `VideoObject` is valid.

- [ ] **Step 5: Commit**

  ```bash
  git add src/app/\[locale\]/work/\[uid\]/page.tsx
  git commit -m "feat: add VideoObject JSON-LD to interview pages"
  ```

---

## Task 7: SEO micro-improvements

**Files:**

- Modify: `src/app/[locale]/layout.tsx`
- Modify: `src/app/[locale]/blog/[uid]/page.tsx`
- Modify: `src/app/llms-full.txt/route.ts`

**What this does:**

1. Enriches Kurt's `Person` schema with a `url` pointing to his bio page and a `sameAs` array for LinkedIn — helps Google Knowledge Graph and AI models identify him as a real person with verifiable identity.
2. Adds a `description` field to the `BlogPosting` JSON-LD — currently only `headline`, `image`, `datePublished`, `author`, `publisher`, and `mainEntityOfPage` are set.
3. Adds a `Last-Updated` header to `llms-full.txt` so AI crawlers can assess content freshness.

**Note for step 1:** You need Kurt's LinkedIn profile URL. If unknown at implementation time, find it by searching LinkedIn for "Kurt Vandemaele journalist Kortrijk" or checking the existing site's social links. Replace `"YOUR_LINKEDIN_URL"` with the actual URL (format: `https://www.linkedin.com/in/<slug>/`).

- [ ] **Step 1: Enrich Person schema in layout.tsx**

  Open `src/app/[locale]/layout.tsx`. Find the `founder` object inside the `ProfessionalService` JSON-LD block (around line 99). Replace it:

  ```tsx
  founder: {
    "@type": "Person",
    name: "Kurt Vandemaele",
    url: `${SITE_URL}/nl/who-am-i`,
    jobTitle: "Journalist & Founder",
    description:
      "Veteran journalist with 40 years of experience, including 24 years at Humo magazine. Founder of udocu, specialising in personal documentary interviews and heritage preservation.",
    sameAs: [
      "YOUR_LINKEDIN_URL",
    ],
  },
  ```

- [ ] **Step 2: Add `description` to BlogPosting JSON-LD**

  Open `src/app/[locale]/blog/[uid]/page.tsx`. Find `articleJsonLd` (around line 93). The `description` field is already available — the page already extracts `prismic.asText(page.data.body)?.slice(0, 160)` for the `<meta description>`. Add `description` to the schema object:

  ```tsx
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: title,
    description: prismic.asText(page.data.body)?.slice(0, 200) ?? undefined,
    image: page.data.image?.url ?? undefined,
    datePublished: page.data.publish_date ?? undefined,
    author: {
      "@type": "Person",
      name: "Kurt Vandemaele",
      url: `${SITE_URL}/nl/who-am-i`,
    },
    publisher: {
      "@type": "Organization",
      name: "udocu",
      url: SITE_URL,
    },
    mainEntityOfPage: `${SITE_URL}/${locale}/blog/${uid}`,
  };
  ```

- [ ] **Step 3: Add Last-Updated to llms-full.txt**

  Open `src/app/llms-full.txt/route.ts`. Find the `content` template literal. Replace the very first line of the content string:

  ```
  # udocu — Preserving Personal and Cultural Heritage
  ```

  with:

  ```ts
  const today = new Date().toISOString().split("T")[0];
  ```

  Then change the start of the `content` template literal to:

  ```ts
  const content = `# udocu — Preserving Personal and Cultural Heritage

  Last-Updated: ${today}

  > Udocu is a creative studio...
  ```

  (Keep the rest of the content exactly as-is.)

- [ ] **Step 4: Type-check and lint**

  ```bash
  npm run tsc && npm run lint
  ```

  Expected: no errors.

- [ ] **Step 5: Verify llms-full.txt**

  Open `http://localhost:3000/llms-full.txt` — confirm the `Last-Updated: YYYY-MM-DD` line appears at the top.

- [ ] **Step 6: Full build check**

  ```bash
  npm run build
  ```

  Expected: build succeeds with no type errors. This also validates all ImageResponse files compile correctly.

- [ ] **Step 7: Commit**

  ```bash
  git add src/app/\[locale\]/layout.tsx src/app/\[locale\]/blog/\[uid\]/page.tsx src/app/llms-full.txt/route.ts
  git commit -m "feat: enrich Person schema, add BlogPosting description, add llms-full.txt freshness date"
  ```

---

## Self-Review Checklist

- [x] **Task 1** covers: viewport themeColor ✅, body background-color ✅
- [x] **Task 2** covers: dynamic theme-color sync on homepage scroll ✅
- [x] **Task 3** covers: apple-touch-icon ✅, 512px browser/PWA icon ✅
- [x] **Task 4** covers: web app manifest ✅
- [x] **Task 5** covers: OG social sharing image fallback ✅
- [x] **Task 6** covers: VideoObject JSON-LD on interview pages ✅
- [x] **Task 7** covers: Person schema enrichment ✅, BlogPosting description ✅, llms freshness ✅
- [x] No placeholders except the LinkedIn URL (genuinely external data — explicitly flagged in Task 7 Step 1)
- [x] All SVG paths are identical across Tasks 3 and 5 (copied verbatim from `UdocuLogo.tsx`)
- [x] `SITE_URL` is already imported in all modified files via `@/lib/seo`
- [x] `prismic` is already imported in blog and work detail pages
- [x] Task 4 depends on Task 3 — noted explicitly

---

_Plan saved. LinkedIn URL for Kurt's sameAs is the only external input needed._
