"use client";

import { useEffect } from "react";

/**
 * Copies a detail page's own background colour onto <html> and <body>.
 *
 * Two things make this necessary. `globals.css` paints body a warm near-black
 * (#1a1613), deliberately, because iOS 26 Safari samples the initial background
 * for its toolbar tint. And ThemeColorSync, which overrides those inline while
 * the one-pager scrolls, renders only on the homepage and does not clean up
 * after itself. So a detail page either shows the near-black or, after a
 * client-side navigation off the homepage, whatever section colour was last
 * scrolled to. Either way the overscroll rubber band bleeds the wrong colour.
 *
 * The colour is read from the rendered page rather than passed in, so it can
 * never drift from the `colorScheme` class that actually paints the page.
 *
 * This runs after first paint on purpose. Letting the initial background stand
 * preserves the iOS toolbar behaviour globals.css sets up, and the corrected
 * colour only has to be right by the time a user can overscroll to see it.
 */
export default function SyncPageBackground({
  targetId,
}: {
  /** Element whose computed background colour should be mirrored. */
  targetId: string;
}) {
  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target) return;

    const { backgroundColor } = getComputedStyle(target);
    if (!backgroundColor) return;

    const html = document.documentElement;
    const previousHtml = html.style.backgroundColor;
    const previousBody = document.body.style.backgroundColor;

    html.style.backgroundColor = backgroundColor;
    document.body.style.backgroundColor = backgroundColor;

    return () => {
      html.style.backgroundColor = previousHtml;
      document.body.style.backgroundColor = previousBody;
    };
  }, [targetId]);

  return null;
}
