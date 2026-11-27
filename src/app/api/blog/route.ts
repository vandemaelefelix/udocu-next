import { after, NextRequest, NextResponse } from "next/server";
import { SeverityNumber } from "@opentelemetry/api-logs";
import type { Content } from "@prismicio/client";
import { createClient, PRISMIC_LOCALE } from "@/prismicio";
import { loggerProvider, posthogLogsLogger } from "../../../../instrumentation";

const PAGE_SIZE = 12;

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const page = Number(searchParams.get("page") ?? "1");

  const client = createClient();

  const response = await client.getByType<Content.BlogPostDocument>(
    "blog_post",
    {
      lang: PRISMIC_LOCALE,
      orderings: [{ field: "my.blog_post.publish_date", direction: "desc" }],
      pageSize: PAGE_SIZE,
      page,
    },
  );

  posthogLogsLogger?.emit({
    body: "Blog page served",
    severityNumber: SeverityNumber.INFO,
    attributes: {
      event: "blog_page_served",
      page: response.page,
      result_count: response.results.length,
      total_pages: response.total_pages,
    },
  });

  after(() => loggerProvider?.forceFlush().catch(() => {}));

  return NextResponse.json({
    results: response.results,
    page: response.page,
    totalPages: response.total_pages,
    totalResults: response.total_results_size,
  });
}
