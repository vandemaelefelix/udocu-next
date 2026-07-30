import type { TapeParams } from "./tapeRenderer";

export type TapePresetName = "tvScreen" | "poster" | "hover" | "noSignal";

/**
 * Shader uniform values per surface. These are GPU parameters, not design
 * tokens, so they live here as plain numbers rather than in globals.css.
 * Starting values; tuned empirically in the final task.
 */
export const TAPE_PRESETS: Record<TapePresetName, TapeParams> = {
  // Homepage TV screen. Restrained: it sits behind a photographed TV frame
  // that already supplies curvature, so barrel stays 0.
  tvScreen: {
    speed: 0.5,
    wave: 0.3,
    jitter: 0.12,
    aberration: 1.0,
    scanlines: 0.18,
    grain: 0.08,
    switching: 0.03,
    switchingHeight: 0.02,
    barrel: 0,
    vignette: 0.15,
    saturation: 0.9,
    exposure: 1.0,
  },
  // The /about poster while paused. An invitation, not content, so stronger.
  poster: {
    speed: 0.5,
    wave: 0.6,
    jitter: 0.2,
    aberration: 1.6,
    scanlines: 0.2,
    grain: 0.12,
    switching: 0.06,
    switchingHeight: 0.03,
    barrel: 0.1,
    vignette: 0.2,
    saturation: 0.95,
    exposure: 1.0,
  },
  // Work carousel hover. Transient, so it can afford to be punchy.
  hover: {
    speed: 0.7,
    wave: 0.5,
    jitter: 0.3,
    aberration: 2.0,
    scanlines: 0.15,
    grain: 0.1,
    switching: 0.08,
    switchingHeight: 0.03,
    barrel: 0.08,
    vignette: 0.1,
    saturation: 0.95,
    exposure: 1.05,
  },
  // 404. No content texture at all: a dead channel.
  noSignal: {
    speed: 1.0,
    wave: 0.8,
    jitter: 0.5,
    aberration: 2.5,
    scanlines: 0.3,
    grain: 0.55,
    switching: 0.4,
    switchingHeight: 0.06,
    barrel: 0.15,
    vignette: 0.35,
    saturation: 0.6,
    exposure: 1.0,
  },
};
