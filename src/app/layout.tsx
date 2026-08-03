import type { ReactNode } from "react";
import "./globals.css";

/**
 * Root layout. This app is otherwise entirely rendered through
 * `[locale]/layout.tsx`, which owns `<html>`/`<body>` for every real page.
 *
 * This file exists only so that a root `not-found.tsx` can render. Next.js
 * requires a root layout to be present for that (even a pass-through one)
 * because a small class of "not found" responses never enter the `[locale]`
 * segment at all: e.g. `[locale]/[...rest]` is registered with
 * `dynamicParams = false` so bad URLs get a genuine 404 status resolved at
 * build/route-match time, before any layout in the `[locale]` tree runs.
 * Root `not-found.tsx` supplies its own `<html>`/`<body>` for that case.
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
