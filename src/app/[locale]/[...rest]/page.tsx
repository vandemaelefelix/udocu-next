import { notFound } from "next/navigation";

/**
 * Catch-all for URLs that match no real route. Next only renders a segment's
 * not-found.tsx when notFound() is called inside that segment, so without this
 * the styled 404 was unreachable and visitors got Next's built-in page.
 *
 * generateStaticParams returns no paths and dynamicParams is false, so every
 * request to this route is resolved at build/route-match time as "not one of
 * the known params", instead of running this component and calling
 * notFound() on a live request. That matters because a live, streamed
 * notFound() call (this segment sits under a loading.tsx) commits the
 * response headers with a 200 status before the not-found boundary resolves,
 * turning every bad URL into a soft 404. Statically resolving it sidesteps
 * that entirely: Next serves the root `src/app/not-found.tsx` directly, with
 * a genuine 404 status, without ever entering this segment's own layout.
 */
export function generateStaticParams() {
  return [];
}

export const dynamicParams = false;

export default function CatchAllNotFound() {
  notFound();
}
