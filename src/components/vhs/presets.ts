import type { TapeParams } from "./tapeRenderer";

export type TapePresetName = "screen" | "screenAmbient" | "poster" | "noSignal";

/**
 * Shader uniform values per surface. These are GPU parameters, not design
 * tokens, so they live here as plain numbers rather than in globals.css.
 */
export const TAPE_PRESETS: Record<TapePresetName, TapeParams> = {
  // The /about poster while paused. An invitation, not content, so stronger.
  poster: {
    speed: 0.5,
    wave: 0.6,
    jitter: 0.2,
    aberration: 1.6,
    scanlines: 0.2,
    // Matches the previous buffer-tied frequency at this surface's 480px
    // buffer height (480/2 = 240 lines), so the look is unchanged.
    scanlineLines: 480,
    grain: 0.12,
    switching: 0.06,
    switchingHeight: 0.03,
    barrel: 0.1,
    vignette: 0.2,
    saturation: 0.95,
    exposure: 1.0,
  },
  // Live content at full strength: the homepage TV screen, which is always on,
  // and a work carousel card under the cursor. One preset because both are
  // real footage seen as footage, and they sit on the same page a scroll
  // apart, so two different tape looks read as an inconsistency rather than as
  // variety.
  //
  // Both surfaces must therefore render at a buffer at least 360 tall, or
  // scanlineLines aliases into flat grey once the canvas is upscaled by CSS.
  // See the scanlineLines doc comment in tapeRenderer.ts.
  screen: {
    speed: 0.7,
    wave: 0.5,
    jitter: 0.3,
    // Measured in internal buffer pixels, so it tracks the buffer rather than
    // the displayed size. Both surfaces here run a ~360-tall buffer shown at
    // roughly one buffer pixel per CSS pixel, so the split lands the same on
    // each. Past about 6 the background breaks into vertical rainbow banding.
    aberration: 4.0,
    scanlines: 0.15,
    scanlineLines: 360,
    grain: 0.1,
    switching: 0.08,
    switchingHeight: 0.03,
    barrel: 0.08,
    vignette: 0.1,
    saturation: 0.95,
    exposure: 1.05,
  },
  // The resting state of a work carousel card: every card on screen wears the
  // tape, and hovering one ramps it up to `screen`. Ambient keeps the tape
  // stock (fine scanlines, a little grain, a hint of tube) and gives up the
  // disruption, so a wall of cards reads as old footage rather than as a
  // gallery of broken images. The disruptive dials are what the hover buys.
  //
  // Two fields are deliberately identical to `screen` and must stay that way,
  // because lerpTapeParams interpolates between the two presets on hover:
  //   - speed, because a changing clock makes the animation jump mid-ramp.
  //   - scanlineLines, because sweeping a frequency beats and aliases.
  screenAmbient: {
    speed: 0.7,
    wave: 0.15,
    jitter: 0.06,
    aberration: 0.6,
    scanlines: 0.1,
    scanlineLines: 360,
    grain: 0.06,
    switching: 0,
    // Height, not strength. With switching at 0 it has no effect at rest; it
    // matches `screen` so the band grows in place rather than sliding as the
    // ramp runs.
    switchingHeight: 0.03,
    barrel: 0.04,
    vignette: 0.06,
    saturation: 1.0,
    exposure: 1.0,
  },
  // 404. No content texture at all: a dead channel.
  noSignal: {
    speed: 1.0,
    wave: 0.8,
    jitter: 0.5,
    aberration: 2.5,
    scanlines: 0.3,
    // Matches the previous buffer-tied frequency at this surface's 480px
    // buffer height (480/2 = 240 lines), so the look is unchanged.
    scanlineLines: 480,
    grain: 0.55,
    switching: 0.4,
    switchingHeight: 0.06,
    barrel: 0.15,
    vignette: 0.35,
    saturation: 0.6,
    exposure: 1.0,
  },
};

/**
 * Linear interpolation between two param sets, `t` clamped to [0,1].
 *
 * This is how the carousel ramps a card from `screenAmbient` to `screen` on
 * hover. It walks the keys of `a` rather than listing them, so a param added
 * to TapeParams is interpolated automatically instead of silently freezing at
 * its ambient value.
 *
 * Interpolating a field is only meaningful when it is an amount. Frequencies
 * and clocks must match between the two endpoints; see the note on
 * `screenAmbient`.
 */
export function lerpTapeParams(
  a: TapeParams,
  b: TapeParams,
  t: number,
): TapeParams {
  const k = t < 0 ? 0 : t > 1 ? 1 : t;
  const out = {} as TapeParams;
  for (const key of Object.keys(a) as Array<keyof TapeParams>) {
    out[key] = a[key] + (b[key] - a[key]) * k;
  }
  return out;
}
