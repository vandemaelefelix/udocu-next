/**
 * Single source of truth for the site menu.
 *
 * Every nav (StickyNav on the one-pager, DetailNav on detail pages) renders
 * these entries through `SiteNav`, so a destination added here appears on every
 * screen at once. Keys are `nav.*` translation keys.
 */

// Homepage sections first, in scroll order, then the standalone pages. Anything
// a visitor can reach by scrolling the one-pager comes before anything that
// takes them off it.
export const NAV_ITEMS = [
  "about",
  "who-am-i",
  "work",
  "contact",
  "werkwijze",
  "blog",
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];

/**
 * Entries that link to their own page. Everything not listed here is a
 * homepage section: the one-pager scrolls to it, other pages link to `/#<id>`.
 */
export const PAGE_HREFS: Partial<Record<NavItem, string>> = {
  werkwijze: "/werkwijze",
  blog: "/blog",
};

/**
 * Ids of the homepage sections, derived so it can never drift from NAV_ITEMS.
 *
 * Module-scoped so the reference is stable across renders: StickyNav re-renders
 * ~60x/sec during scroll (it consumes bgColor/textColor from ScrollColorContext,
 * which updates per requestAnimationFrame), and a new array each render would
 * force useActiveSection's IntersectionObserver to disconnect + rebuild every
 * frame.
 */
export const SECTION_IDS: readonly NavItem[] = NAV_ITEMS.filter(
  (item) => !PAGE_HREFS[item],
);
