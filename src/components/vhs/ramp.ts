/**
 * Shared timing for ramping a tape surface between two param sets on hover.
 *
 * Both consumers (the carousel pool and TapeSurface) use these so a card and
 * the homepage TV screen ramp at the same rate. Keeping the maths here rather
 * than in either consumer also keeps it testable without a browser.
 */

/** Ramp duration, matching TapeSurface's default crossfade. */
export const TAPE_RAMP_MS = 220;

/** Cubic ease-in-out, so a ramp neither snaps at the start nor drifts at the end. */
export function easeTapeRamp(t: number): number {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
}

/**
 * Moves `current` toward `target` by one frame's worth of ramp, clamped so it
 * lands exactly on the target rather than overshooting. Linear in time; the
 * easing is applied when reading the result, not when advancing it.
 *
 * `dtMs` is clamped so a long frame (a background tab waking up, a slow paint)
 * cannot jump most of the ramp in one step.
 */
export function advanceRamp(
  current: number,
  target: number,
  dtMs: number,
): number {
  const step = Math.max(0, Math.min(dtMs, 100)) / TAPE_RAMP_MS;
  if (target > current) return Math.min(target, current + step);
  if (target < current) return Math.max(target, current - step);
  return target;
}
