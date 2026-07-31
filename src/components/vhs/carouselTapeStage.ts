import {
  createTapeRenderer,
  type TapeParams,
  type TapeRenderer,
} from "./tapeRenderer";
import { TAPE_PRESETS } from "./presets";

/**
 * A single shared canvas and GL context for the work carousel.
 *
 * The carousel repeats its items to fake an infinite loop, so one renderer per
 * card would mean a dozen or more GL contexts. Instead the canvas is moved
 * into whichever card is hovered. Re-parenting a canvas preserves its GL
 * context, and because the canvas becomes a child of the card it inherits the
 * card's entrance and inertia transforms with no per-frame measuring.
 */

let canvas: HTMLCanvasElement | null = null;
let renderer: TapeRenderer | null = null;
let owner: HTMLElement | null = null;
// The exact image element that was hidden on acquire, restored on release.
// Not re-derived via `host.querySelector("img")` because a card could one day
// contain more than one <img> (a badge, a secondary photo); querying would
// then risk restoring the wrong element and leaving the real one invisible.
let activeSource: HTMLImageElement | null = null;
let unavailable = false;

function build(): boolean {
  if (renderer) return true;
  if (unavailable || typeof document === "undefined") return false;

  const el = document.createElement("canvas");
  el.setAttribute("aria-hidden", "true");
  el.dataset.tapeStage = "";
  el.style.position = "absolute";
  el.style.inset = "0";
  el.style.width = "100%";
  el.style.height = "100%";
  el.style.pointerEvents = "none";

  const r = createTapeRenderer(el, {
    source: null,
    // Overwritten by the params acquireTapeStage passes in; this is only the
    // seed value for the pre-warm build.
    params: { ...TAPE_PRESETS.hover },
    maxHeight: 360,
    // A GPU-process crash or driver reset kills this shared context for
    // good (no webglcontextrestored recovery). With one renderer shared
    // across every card, leaving it wired up would silently no-op forever;
    // instead release whichever card currently owns it, restore its image,
    // and mark the stage permanently unavailable so future hovers fall back
    // to the plain image instead of an invisible canvas.
    onContextLost: () => {
      if (owner) releaseTapeStage(owner);
      renderer = null;
      canvas = null;
      unavailable = true;
    },
  });
  if (!r) {
    unavailable = true;
    return false;
  }

  canvas = el;
  renderer = r;
  return true;
}

/**
 * Compile ahead of the first hover so there is no shader-compile stall on it.
 * Safe to call repeatedly.
 */
export function warmTapeStage(): void {
  build();
}

export function acquireTapeStage(
  host: HTMLElement,
  source: HTMLImageElement,
  params: TapeParams,
): boolean {
  if (!build() || !canvas || !renderer) return false;

  if (owner && owner !== host) releaseTapeStage(owner);

  owner = host;
  activeSource = source;
  host.appendChild(canvas);

  const rect = host.getBoundingClientRect();
  renderer.setParams(params);
  renderer.setSource(source);
  renderer.resize(rect.width, rect.height);

  source.style.opacity = "0";

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    renderer.renderOnce();
  } else {
    renderer.start();
  }
  return true;
}

export function releaseTapeStage(host: HTMLElement): void {
  if (owner !== host || !canvas || !renderer) return;
  renderer.stop();
  if (activeSource) activeSource.style.opacity = "1";
  canvas.remove();
  owner = null;
  activeSource = null;
}
