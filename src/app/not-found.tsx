import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import TapeSurface from "@/components/vhs/TapeSurface";
import { TAPE_PRESETS } from "@/components/vhs/presets";
import { garamond, helveticaNeue, posterman } from "./fonts";
import "./globals.css";

// This is the single-locale site's only locale; explicit rather than derived
// because this route renders outside the `[locale]` segment (see layout.tsx).
const LOCALE = "nl";

export const metadata: Metadata = {
  title: "404",
  robots: { index: false, follow: false },
};

const fontVariables = [garamond, helveticaNeue, posterman]
  .map((f) => f.variable)
  .join(" ");

/**
 * Root-level not-found page.
 *
 * Handles bad URLs that never enter the `[locale]` segment: `[...rest]` is
 * statically resolved with `dynamicParams = false`, so Next serves this page
 * directly (with a real 404 status) instead of running `[locale]/layout.tsx`
 * and `[locale]/not-found.tsx`. It therefore supplies its own `<html>`/
 * `<body>` and duplicates the visual treatment of `[locale]/not-found.tsx`
 * (dead-channel VHS backdrop, same copy) rather than depending on it.
 */
export default async function RootNotFound() {
  const t = await getTranslations({ locale: LOCALE, namespace: "notFound" });

  return (
    <html lang={LOCALE}>
      <body className={`${fontVariables} antialiased`}>
        <main className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center text-red-light">
          <TapeSurface
            active
            params={TAPE_PRESETS.noSignal}
            className="pointer-events-none fixed inset-0 -z-10"
            style={{ position: "fixed" }}
          />
          <h1 className="mb-4 font-posterman text-[72px] font-black leading-none md:text-[120px]">
            404
          </h1>
          <p className="mb-2 font-serif text-2xl font-semibold">
            {t("heading")}
          </p>
          <p className="mb-8 font-serif text-lg opacity-70">
            {t("description")}
          </p>
          <Link
            href="/"
            className="font-helvetica text-sm font-medium uppercase tracking-widest underline underline-offset-4 transition-opacity hover:opacity-70"
          >
            {t("backHome")}
          </Link>
        </main>
      </body>
    </html>
  );
}
