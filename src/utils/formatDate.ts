export function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(
    locale === "nl" ? "nl-BE" : "en-US",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    },
  );
}
