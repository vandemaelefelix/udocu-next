/**
 * Per-URL scroll positions, remembered for the length of a browsing session.
 *
 * Written on every in-app link click and read back on Back/Forward by
 * `ScrollRestoration`. Kept in its own module so other components can also
 * forget a position when they deliberately want a page to open at the top
 * (see `useHomeLogoClick`).
 */

const STORAGE_KEY = "udocu_scroll";

export function readScrollPositions(): Record<string, number> {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function saveScrollPosition(url: string, y: number) {
  try {
    const positions = readScrollPositions();
    positions[url] = y;
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {}
}

export function forgetScrollPosition(url: string) {
  try {
    const positions = readScrollPositions();
    delete positions[url];
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {}
}
