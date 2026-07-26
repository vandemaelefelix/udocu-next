import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["nl"],
  defaultLocale: "nl",
  // Single-locale site: never show a /nl prefix in the URL.
  localePrefix: "never",
  localeDetection: false,
});
