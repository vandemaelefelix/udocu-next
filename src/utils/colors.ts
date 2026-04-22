export const COLOR_PAIRS = [
  { bg: "bg-contact-bg", text: "text-orange-light" },
  { bg: "bg-green-dark", text: "text-green-light" },
  { bg: "bg-red-dark", text: "text-red-light" },
  { bg: "bg-blue-dark", text: "text-blue-light" },
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
