import { createTapeRenderer, type TapeRenderer } from "./tapeRenderer";
import { TAPE_PRESETS, lerpTapeParams } from "./presets";
import { advanceRamp, easeTapeRamp } from "./ramp";

/**
 * Tape stages for the work carousel: every card on screen wears the effect at
 * `screenAmbient`, and the hovered card ramps to `screen` and back.
 *
 * The carousel repeats its items to fake an infinite loop, so the DOM holds
 * dozens of cards while only a handful are ever on screen. A renderer per card
 * would blow past the browser's WebGL context limit, so this module keeps a
 * small pool of canvases and lends them to whichever cards are currently
 * intersecting. A lent canvas is appended to the card, which means it inherits
 * that card's entrance, drag and inertia transforms with no per-frame
 * measuring.
 *
 * One shared IntersectionObserver drives lending, and one shared
 * requestAnimationFrame loop drives every lent renderer. The renderers are
 * never start()ed individually: a single loop keeps the draw order
 * deterministic and means an off-screen carousel, which lends nothing, costs
 * nothing.
 */

/**
 * Cap on concurrent GL contexts, which is the real constraint here. Browsers
 * allow roughly 16 per page and silently kill the oldest beyond that, and the
 * homepage TV screen owns one of them. Eight covers the 4 cards visible at
 * 1280px and the ~7 at 2560px. Above that (a 4K viewport shows about 10) the
 * outermost cards keep their untouched photo, which is a better failure than
 * evicting a context another surface is mid-draw on.
 */
const MAX_SLOTS = 8;

/** Attach a little before a card scrolls in so it is never seen resolving. */
const ROOT_MARGIN = "0px 200px 0px 200px";

interface Slot {
  canvas: HTMLCanvasElement;
  renderer: TapeRenderer;
  /** The card currently borrowing this slot, or null when free. */
  host: HTMLElement | null;
  source: HTMLImageElement | null;
  /** Where the ramp is heading: 1 while hovered, 0 otherwise. */
  hoverTarget: 0 | 1;
  /** Eased ramp position. */
  hoverAmount: number;
  /** Monotonic counter used to evict the least recently lent slot. */
  lentAt: number;
  /**
   * Whether the source has been hidden behind the canvas yet. Deferred until a
   * frame has actually drawn from a decoded source, so a slow image or a dead
   * renderer leaves the real photo showing rather than a blank card.
   */
  sourceHidden: boolean;
}

const slots: Slot[] = [];
const lent = new Map<HTMLElement, Slot>();
/** Cards registered with the observer, and the image each one textures. */
const registered = new Map<HTMLElement, HTMLImageElement>();

let observer: IntersectionObserver | null = null;
let raf = 0;
let lastFrame = 0;
let lentCounter = 0;
let unavailable = false;
let visibilityBound = false;

function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function createSlot(): Slot | null {
  if (unavailable || typeof document === "undefined") return null;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.dataset.tapeStage = "";
  canvas.style.position = "absolute";
  canvas.style.inset = "0";
  canvas.style.width = "100%";
  canvas.style.height = "100%";
  canvas.style.pointerEvents = "none";

  const renderer = createTapeRenderer(canvas, {
    source: null,
    params: { ...TAPE_PRESETS.screenAmbient },
    maxHeight: 360,
    // A GPU-process crash or driver reset kills the context for good; there is
    // no webglcontextrestored recovery. Retire just this slot and let its card
    // fall back to the untouched photo. The other slots have their own
    // contexts and are unaffected, so the pool keeps working at reduced size.
    onContextLost: () => retireSlot(slot),
  });
  if (!renderer) {
    // WebGL2 is missing outright, not merely this canvas failing, so stop
    // trying: every card falls back to its photo.
    unavailable = true;
    return null;
  }

  const slot: Slot = {
    canvas,
    renderer,
    host: null,
    source: null,
    hoverTarget: 0,
    hoverAmount: 0,
    lentAt: 0,
    sourceHidden: false,
  };
  slots.push(slot);
  return slot;
}

function retireSlot(slot: Slot) {
  reclaim(slot);
  const i = slots.indexOf(slot);
  if (i !== -1) slots.splice(i, 1);
}

/** Take a slot back from its card, restoring the card to its plain photo. */
function reclaim(slot: Slot) {
  if (slot.source && slot.sourceHidden) slot.source.style.opacity = "1";
  if (slot.host) lent.delete(slot.host);
  slot.canvas.remove();
  slot.host = null;
  slot.source = null;
  slot.hoverTarget = 0;
  slot.hoverAmount = 0;
  slot.sourceHidden = false;
}

/**
 * A free slot, or the least recently lent one that is not hovered. Returns
 * null when every slot is hovered, which cannot happen with a single pointer
 * but is the honest answer rather than stealing a canvas mid-hover.
 */
function takeSlot(): Slot | null {
  const free = slots.find((s) => s.host === null);
  if (free) return free;

  if (slots.length < MAX_SLOTS) return createSlot();

  let oldest: Slot | null = null;
  for (const slot of slots) {
    if (slot.hoverTarget === 1) continue;
    if (!oldest || slot.lentAt < oldest.lentAt) oldest = slot;
  }
  if (oldest) reclaim(oldest);
  return oldest;
}

function lendTo(host: HTMLElement, source: HTMLImageElement) {
  if (unavailable || lent.has(host)) return;

  const slot = takeSlot();
  if (!slot) return;

  slot.host = host;
  slot.source = source;
  slot.hoverTarget = 0;
  slot.hoverAmount = 0;
  slot.sourceHidden = false;
  slot.lentAt = ++lentCounter;
  lent.set(host, slot);
  host.appendChild(slot.canvas);

  const rect = host.getBoundingClientRect();
  slot.renderer.setParams({ ...TAPE_PRESETS.screenAmbient });
  slot.renderer.setSource(source);
  slot.renderer.resize(rect.width, rect.height);

  drawSlot(slot);
  if (!prefersReducedMotion()) startLoop();
}

/**
 * Draw one frame for a slot and, once that frame came from a decoded source,
 * hide the real image behind it.
 */
function drawSlot(slot: Slot) {
  const ready = slot.renderer.sourceReady();
  slot.renderer.renderOnce();
  if (ready && !slot.sourceHidden && slot.source) {
    slot.source.style.opacity = "0";
    slot.sourceHidden = true;
  }
}

function frame(now: number) {
  raf = 0;
  const dt = lastFrame === 0 ? 16 : Math.min(now - lastFrame, 100);
  lastFrame = now;

  let active = 0;
  for (const slot of slots) {
    if (!slot.host) continue;
    active++;

    slot.hoverAmount = advanceRamp(slot.hoverAmount, slot.hoverTarget, dt);
    slot.renderer.setParams(
      lerpTapeParams(
        TAPE_PRESETS.screenAmbient,
        TAPE_PRESETS.screen,
        easeTapeRamp(slot.hoverAmount),
      ),
    );
    drawSlot(slot);
  }

  if (active > 0) raf = requestAnimationFrame(frame);
  else lastFrame = 0;
}

function startLoop() {
  if (raf || document.visibilityState !== "visible") return;
  lastFrame = 0;
  raf = requestAnimationFrame(frame);
}

function stopLoop() {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
  lastFrame = 0;
}

function onVisibilityChange() {
  if (document.visibilityState === "visible") {
    if (lent.size > 0 && !prefersReducedMotion()) startLoop();
  } else {
    stopLoop();
  }
}

function getObserver(): IntersectionObserver | null {
  if (observer || typeof IntersectionObserver === "undefined") return observer;
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const host = entry.target as HTMLElement;
        const source = registered.get(host);
        if (!source) continue;
        if (entry.isIntersecting) lendTo(host, source);
        else {
          const slot = lent.get(host);
          if (slot) reclaim(slot);
        }
      }
      if (lent.size === 0) stopLoop();
    },
    { rootMargin: ROOT_MARGIN },
  );
  return observer;
}

/**
 * Build one renderer ahead of time so the first card to scroll in does not pay
 * the shader compile. Safe to call repeatedly.
 */
export function warmTapeStage(): void {
  if (unavailable || slots.length > 0) return;
  createSlot();
}

/**
 * Put a card under tape for as long as it is on screen. Returns the
 * unregister function; call it on unmount.
 */
export function registerCard(
  host: HTMLElement,
  source: HTMLImageElement,
): () => void {
  if (unavailable) return () => {};

  if (!visibilityBound && typeof document !== "undefined") {
    document.addEventListener("visibilitychange", onVisibilityChange);
    visibilityBound = true;
  }

  registered.set(host, source);
  getObserver()?.observe(host);

  return () => {
    registered.delete(host);
    observer?.unobserve(host);
    const slot = lent.get(host);
    if (slot) reclaim(slot);
    if (lent.size === 0) stopLoop();
  };
}

/** Start or reverse a card's ramp between the ambient and full-strength look. */
export function setTapeHover(host: HTMLElement, hovered: boolean): void {
  const slot = lent.get(host);
  if (!slot) return;
  slot.hoverTarget = hovered ? 1 : 0;
  // Reduced motion gets the destination, not the journey.
  if (prefersReducedMotion()) {
    slot.hoverAmount = slot.hoverTarget;
    slot.renderer.setParams(
      hovered ? { ...TAPE_PRESETS.screen } : { ...TAPE_PRESETS.screenAmbient },
    );
    drawSlot(slot);
    return;
  }
  startLoop();
}
