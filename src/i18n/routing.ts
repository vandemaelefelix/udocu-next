import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "nl"],
  defaultLocale: "nl",
  // Always serve Dutch by default; only switch to English when the user
  // explicitly navigates to an `/en` route (no Accept-Language negotiation).
  localeDetection: false,
});
