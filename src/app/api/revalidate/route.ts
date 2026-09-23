import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

// Prismic's webhook "Secret" field is sent in the JSON body, not as a header.
// Accept either, so the webhook works whether it was set up with the built-in
// secret field or with a custom `x-webhook-secret` header.
async function getSecret(request: Request): Promise<string | null> {
  const header = request.headers.get("x-webhook-secret");
  if (header) return header;

  try {
    const body = (await request.json()) as { secret?: unknown };
    return typeof body.secret === "string" ? body.secret : null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const expected = process.env.PRISMIC_WEBHOOK_SECRET;
  const secret = await getSecret(request);

  if (!expected || secret !== expected) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  // Expire immediately rather than stale-while-revalidate, so the first visitor
  // after a publish already gets the new content.
  revalidateTag("prismic", { expire: 0 });
  // Also drop every rendered page, in case a page's cache entry lost its link
  // to the "prismic" tag.
  revalidatePath("/", "layout");

  return NextResponse.json({ revalidated: true });
}
