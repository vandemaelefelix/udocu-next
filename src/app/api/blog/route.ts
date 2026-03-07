import { NextRequest, NextResponse } from "next/server";
import type { Content } from "@prismicio/client";
import { createClient, localeMap } from "@/prismicio";

const PAGE_SIZE = 12;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page") ?? "1");
  const locale = searchParams.get("locale") ?? "nl";

  const client = createClient();

  const response = await client.getByType<Content.BlogPostDocument>(
    "blog_post",
    {
      lang: localeMap[locale] ?? "nl-be",
      orderings: [{ field: "my.blog_post.publish_date", direction: "desc" }],
      pageSize: PAGE_SIZE,
      page,
    },
  );

  return NextResponse.json({
    results: response.results,
    page: response.page,
    totalPages: response.total_pages,
    totalResults: response.total_results_size,
  });
}
