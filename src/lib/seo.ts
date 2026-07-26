export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.udocu.be";

export function getAlternates(path: string = "") {
  const suffix = path ? `/${path}` : "";
  return {
    canonical: `${SITE_URL}${suffix}`,
  };
}
