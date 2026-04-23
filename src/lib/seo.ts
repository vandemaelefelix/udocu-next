export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.udocu.be";

export function getAlternates(locale: string, path: string = "") {
  const suffix = path ? `/${path}` : "";
  return {
    canonical: `${SITE_URL}/${locale}${suffix}`,
    languages: {
      en: `${SITE_URL}/en${suffix}`,
      nl: `${SITE_URL}/nl${suffix}`,
      "x-default": `${SITE_URL}/nl${suffix}`,
    },
  };
}
