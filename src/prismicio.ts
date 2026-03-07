import * as prismic from "@prismicio/client";
import type { RequestInitLike } from "@prismicio/client";

export const repositoryName = process.env.NEXT_PUBLIC_PRISMIC_REPOSITORY ?? "";

export const localeMap: Record<string, string> = {
  en: "en-us",
  nl: "nl-be",
};

export function createClient() {
  const client = prismic.createClient(repositoryName, {
    fetchOptions: {
      next: { tags: ["prismic"] },
    } as RequestInitLike & { next: NextFetchRequestConfig },
  });

  return client;
}
