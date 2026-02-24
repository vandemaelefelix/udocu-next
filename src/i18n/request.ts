import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

const messageImports = {
  en: () => import("../../messages/en.json"),
  nl: () => import("../../messages/nl.json"),
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !routing.locales.includes(locale as "en" | "nl")) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await messageImports[locale as keyof typeof messageImports]())
      .default,
  };
});
