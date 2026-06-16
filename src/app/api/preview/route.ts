import { NextRequest, NextResponse } from "next/server";
import { redirectToPreviewURL } from "@prismicio/next";
import { timingSafeEqual } from "node:crypto";

import { createClient } from "../../../prismicio";

function safeCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a);
  const bBuf = Buffer.from(b);
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

export async function GET(request: NextRequest) {
  const expected = process.env.PRISMIC_PREVIEW_SECRET;

  if (!expected) {
    return NextResponse.json(
      { message: "Preview is not configured" },
      { status: 503 },
    );
  }

  const provided = request.nextUrl.searchParams.get("secret") ?? "";

  if (!safeCompare(provided, expected)) {
    return NextResponse.json({ message: "Invalid secret" }, { status: 401 });
  }

  const client = createClient();

  return await redirectToPreviewURL({ client, request });
}
