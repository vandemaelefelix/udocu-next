export const COLOR_PAIRS = [
  {
    bg: "bg-contact-bg",
    text: "text-orange-light",
    overlayBg: "var(--color-contact-bg)",
    overlayText: "var(--color-orange-light)",
  },
  {
    bg: "bg-green-dark",
    text: "text-green-light",
    overlayBg: "var(--color-green-dark)",
    overlayText: "var(--color-green-light)",
  },
  {
    bg: "bg-red-dark",
    text: "text-red-light",
    overlayBg: "var(--color-red-dark)",
    overlayText: "var(--color-red-light)",
  },
  {
    bg: "bg-blue-dark",
    text: "text-blue-light",
    overlayBg: "var(--color-blue-dark)",
    overlayText: "var(--color-blue-light)",
  },
] as const;

export function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getColorPair(uid: string) {
  return COLOR_PAIRS[hashString(uid) % COLOR_PAIRS.length];
}
