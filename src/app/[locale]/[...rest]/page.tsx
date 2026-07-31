import { notFound } from "next/navigation";

/**
 * Catch-all for URLs that match no real route. Next only renders a segment's
 * not-found.tsx when notFound() is called inside that segment, so without this
 * the styled 404 was unreachable and visitors got Next's built-in page.
 */
export default function CatchAllNotFound() {
  notFound();
}
