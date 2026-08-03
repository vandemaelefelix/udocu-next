/**
 * VHS tape effect. Verifies the effect is decorative, degrades gracefully,
 * and respects reduced motion.
 *
 * Requires a running dev/preview server (BASE_URL env or http://localhost:3000).
 */

import { test, expect, type Locator, type Page } from "@playwright/test";
import { coverUvTransform } from "@/components/vhs/tapeRenderer";
import { TAPE_PRESETS, lerpTapeParams } from "@/components/vhs/presets";
import { TAPE_RAMP_MS, advanceRamp, easeTapeRamp } from "@/components/vhs/ramp";

/**
 * Neutralises everything that composites over the tape canvas so a screenshot
 * diff measures the WebGL loop and nothing else.
 *
 * Suppresses all CSS animations and transitions via universal selector override,
 * plus suppresses Next's dev-mode nextjs-portal (shadow DOM, unreachable by
 * universal selector). These may include grain animation from NoiseOverlay,
 * or other CSS animations that might exist on the page.
 *
 * Our canvas is driven by requestAnimationFrame and WebGL, not CSS animation,
 * so suppressing CSS animation does not affect what these tests measure.
 */
async function isolateCanvas(page: Page) {
  await page.addStyleTag({
    content: `*, *::before, *::after { animation: none !important; transition: none !important; }
              nextjs-portal { display: none !important; }`,
  });
}

/**
 * Page-side helpers, injected into evaluate() calls as a source string because
 * a Playwright evaluate body cannot close over module scope.
 *
 * `readTapeFrame` reads a tape canvas's GL drawing buffer. It reads the buffer
 * rather than screenshotting because neither toDataURL nor drawImage is
 * reliable on a WebGL canvas created without preserveDrawingBuffer, and the
 * buffer is cleared once a frame has been presented to the compositor. Our
 * requestAnimationFrame callback can land before the renderer's own draw for
 * that frame and read a cleared buffer, so it polls frames until one has
 * content and throws loudly if none ever does.
 *
 * It reports two measures:
 *  - `ringOpaqueBlack`: the fraction of the outermost 2px ring that is opaque
 *    black. The barrel warp pushes that ring outside the source rect, so if
 *    out-of-frame samples were painted opaque black this would be ~1.
 *  - `edgeSplit`: mean |d/dx R - d/dx B| across the frame, a measure of how far
 *    the shader's RGB split is pushed. The gradient form matters: plain mean
 *    |R-B| is swamped by the photo's own chroma and moves only 2% across the
 *    whole hover ramp, whereas this moves about 38% (measured: 11.0 ambient
 *    against 15.2 hovered) and is stable to +/-0.02 between frames.
 */
const TAPE_FRAME_HELPERS = `
  function tapeMeasure(gl, w, h, px) {
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
    // Subsampled by 2 on both axes. The metric is a mean, so this changes
    // nothing statistically, and it keeps a sample cheap enough that a frame
    // series is not dominated by the cost of measuring it.
    let lit = 0, litN = 0, splitSum = 0, splitN = 0;
    for (let y = 0; y < h; y += 2) {
      for (let x = 2; x < w - 2; x += 2) {
        const i = (y * w + x) * 4;
        litN++;
        if (px[i + 3] > 200 && px[i] + px[i + 1] + px[i + 2] > 90) lit++;
        const l = (y * w + x - 1) * 4;
        const r = (y * w + x + 1) * 4;
        splitSum += Math.abs((px[r] - px[l]) - (px[r + 2] - px[l + 2]));
        splitN++;
      }
    }
    // The ring is scanned exactly, but it is only the perimeter, so it is
    // cheap: the top and bottom bands in full, then the side bands.
    const band = 2;
    let ringTotal = 0, ringBlack = 0;
    const tally = (x, y) => {
      const i = (y * w + x) * 4;
      ringTotal++;
      if (px[i + 3] > 200 && px[i] + px[i + 1] + px[i + 2] < 8) ringBlack++;
    };
    for (let y = 0; y < Math.min(band, h); y++)
      for (let x = 0; x < w; x++) tally(x, y);
    for (let y = Math.max(band, h - band); y < h; y++)
      for (let x = 0; x < w; x++) tally(x, y);
    for (let y = band; y < h - band; y++) {
      for (let x = 0; x < Math.min(band, w); x++) tally(x, y);
      for (let x = Math.max(band, w - band); x < w; x++) tally(x, y);
    }
    return {
      hasContent: litN > 0 && lit > litN * 0.5,
      ringOpaqueBlack: ringTotal > 0 ? ringBlack / ringTotal : 0,
      edgeSplit: splitN > 0 ? splitSum / splitN : 0,
      at: performance.now(),
    };
  }
  function tapeNextFrame(gl, w, h, px) {
    return new Promise((resolve) =>
      requestAnimationFrame(() => resolve(tapeMeasure(gl, w, h, px))),
    );
  }
  async function readTapeFrame(el) {
    const gl = el.getContext("webgl2");
    if (!gl) throw new Error("no webgl2 context on the tape canvas");
    const w = el.width, h = el.height;
    const px = new Uint8Array(w * h * 4);
    for (let attempt = 0; attempt < 30; attempt++) {
      const m = await tapeNextFrame(gl, w, h, px);
      if (m.hasContent) return m;
    }
    throw new Error("never read a drawn frame from the tape canvas");
  }
  /**
   * Samples edgeSplit over a window of frames, stamping each with the time it
   * was taken. Callers assert on elapsed time rather than sample count,
   * because measuring costs enough that samples are spaced wider than
   * display frames.
   */
  async function tapeRampSeries(el, ms) {
    const gl = el.getContext("webgl2");
    const w = el.width, h = el.height;
    const px = new Uint8Array(w * h * 4);
    const started = performance.now();
    const out = [];
    while (performance.now() - started < ms) {
      const m = await tapeNextFrame(gl, w, h, px);
      if (m.hasContent) out.push({ split: m.edgeSplit, t: m.at - started });
    }
    return out;
  }
`;

interface TapeFrame {
  ringOpaqueBlack: number;
  edgeSplit: number;
}

async function sampleTapeCanvas(canvas: Locator): Promise<TapeFrame> {
  return canvas.evaluate(
    (el, helpers) =>
      new Function("el", `${helpers}; return readTapeFrame(el);`)(
        el,
      ) as Promise<TapeFrame>,
    TAPE_FRAME_HELPERS,
  );
}

interface RampSeries {
  ambient: number;
  rising: Array<{ split: number; t: number }>;
}

/**
 * Asserts a ramp both arrived and took its time getting there.
 *
 * Assertions are on elapsed milliseconds, not on sample index: a sample costs
 * enough that recorded frames are spaced wider than display frames, so a
 * frame-count threshold silently depends on machine speed. It failed
 * intermittently on exactly that.
 */
function assertRampedSmoothly(ramp: RampSeries) {
  expect(ramp.rising.length).toBeGreaterThan(5);

  const full = Math.max(...ramp.rising.map((s) => s.split));
  // screenAmbient's aberration is 0.6 against screen's 4.0, so the split has to
  // climb substantially.
  expect(full).toBeGreaterThan(ramp.ambient * 1.2);

  // Smooth, not a jump. A cubic-eased 220ms ramp crosses its midpoint at about
  // 110ms; requiring 50ms leaves generous headroom while still failing an
  // instant switch, which would cross within the first frame.
  const half = ramp.ambient + (full - ramp.ambient) / 2;
  const crossed = ramp.rising.find((s) => s.split >= half);
  expect(crossed).toBeDefined();
  expect(crossed!.t).toBeGreaterThan(50);
  expect(crossed!.t).toBeLessThan(TAPE_RAMP_MS * 3);
}

/**
 * Pure texture-mapping maths, exercised without a browser.
 *
 * The shader used to stretch the whole source rect onto the whole canvas,
 * which distorted every surface whose aspect ratio differed from its source.
 * Every element the effect covers is `object-fit: cover`, so the shader has
 * to crop the same way.
 */
test.describe("cover-fit texture mapping", () => {
  test("crops a wide source horizontally, matching object-fit: cover", () => {
    // The homepage TV: a 640x360 video behind a ~1.195:1 screen aperture.
    const fit = coverUvTransform(640, 360, 306, 256);

    expect(fit.scaleX).toBeCloseTo(306 / 256 / (640 / 360), 4);
    expect(fit.scaleY).toBe(1);
    expect(fit.offsetX).toBeCloseTo((1 - fit.scaleX) / 2, 4);
    expect(fit.offsetY).toBe(0);
  });

  test("crops a tall source vertically", () => {
    const fit = coverUvTransform(1080, 1920, 1280, 720);

    expect(fit.scaleX).toBe(1);
    expect(fit.scaleY).toBeCloseTo(1080 / 1920 / (1280 / 720), 4);
    expect(fit.offsetX).toBe(0);
    expect(fit.offsetY).toBeCloseTo((1 - fit.scaleY) / 2, 4);
  });

  test("is the identity when the aspect ratios already agree", () => {
    expect(coverUvTransform(1920, 1080, 640, 360)).toEqual({
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,
    });
  });

  test("keeps the sampled window inside the texture for any aspect pair", () => {
    const sizes = [16, 90, 256, 360, 640, 1080, 1920];
    for (const sw of sizes) {
      for (const sh of sizes) {
        for (const dw of sizes) {
          for (const dh of sizes) {
            const fit = coverUvTransform(sw, sh, dw, dh);
            expect(fit.offsetX).toBeGreaterThanOrEqual(0);
            expect(fit.offsetY).toBeGreaterThanOrEqual(0);
            expect(fit.offsetX + fit.scaleX).toBeLessThanOrEqual(1 + 1e-9);
            expect(fit.offsetY + fit.scaleY).toBeLessThanOrEqual(1 + 1e-9);
          }
        }
      }
    }
  });

  test("falls back to the identity for a source that has not decoded yet", () => {
    // A <video> reports 0x0 until metadata arrives, and an <img> until it
    // loads. Dividing by that would produce NaN uniforms and a blank frame.
    const undecoded: Array<[number, number, number, number]> = [
      [0, 0, 320, 240],
      [640, 0, 320, 240],
      [640, 360, 0, 240],
      [640, 360, 320, 0],
    ];
    for (const [sw, sh, dw, dh] of undecoded) {
      expect(coverUvTransform(sw, sh, dw, dh)).toEqual({
        scaleX: 1,
        scaleY: 1,
        offsetX: 0,
        offsetY: 0,
      });
    }
  });
});

/**
 * The hover ramp, exercised without a browser. This is the whole "smoothly"
 * mechanism for the carousel: the pool eases a number from 0 to 1 and asks for
 * the param set at that point.
 */
test.describe("tape param interpolation", () => {
  const { screenAmbient: lo, screen: hi } = TAPE_PRESETS;

  test("returns each endpoint exactly", () => {
    expect(lerpTapeParams(lo, hi, 0)).toEqual(lo);
    expect(lerpTapeParams(lo, hi, 1)).toEqual(hi);
  });

  test("clamps outside [0,1] rather than extrapolating", () => {
    expect(lerpTapeParams(lo, hi, -3)).toEqual(lo);
    expect(lerpTapeParams(lo, hi, 4)).toEqual(hi);
  });

  test("puts the midpoint halfway along every param", () => {
    const mid = lerpTapeParams(lo, hi, 0.5);
    for (const key of Object.keys(lo) as Array<keyof typeof lo>) {
      expect(mid[key]).toBeCloseTo((lo[key] + hi[key]) / 2, 6);
    }
  });

  test("interpolates every param, leaving none frozen", () => {
    // Guards against a param added to TapeParams but forgotten by the ramp,
    // which would silently stick at its ambient value on hover.
    const mid = lerpTapeParams(lo, hi, 0.5);
    expect(Object.keys(mid).sort()).toEqual(Object.keys(hi).sort());
    const differing = (Object.keys(lo) as Array<keyof typeof lo>).filter(
      (k) => lo[k] !== hi[k],
    );
    expect(differing.length).toBeGreaterThan(0);
    for (const key of differing) {
      expect(mid[key]).not.toBe(lo[key]);
      expect(mid[key]).not.toBe(hi[key]);
    }
  });

  test("advances toward a target without overshooting it", () => {
    // A frame's worth of a 220ms ramp. Kept under the 100ms delta clamp
    // asserted in the next test.
    expect(advanceRamp(0, 1, TAPE_RAMP_MS / 4)).toBeCloseTo(0.25, 6);
    expect(advanceRamp(0.25, 1, 16)).toBeCloseTo(0.25 + 16 / TAPE_RAMP_MS, 6);
    // Landing exactly on the target matters: the carousel pool and TapeSurface
    // both stop their loop on `amount === target`, so an overshoot that never
    // equals the target would spin forever.
    expect(advanceRamp(0.9, 1, TAPE_RAMP_MS)).toBe(1);
    expect(advanceRamp(0.1, 0, TAPE_RAMP_MS)).toBe(0);
    expect(advanceRamp(1, 1, 16)).toBe(1);
  });

  test("caps a long frame so a stalled tab cannot skip the ramp", () => {
    // A backgrounded tab or a slow paint can hand over a multi-second delta.
    expect(advanceRamp(0, 1, 60_000)).toBeCloseTo(100 / TAPE_RAMP_MS, 6);
    expect(advanceRamp(0, 1, -5)).toBe(0);
  });

  test("eases in and out, clamped at both ends", () => {
    expect(easeTapeRamp(0)).toBe(0);
    expect(easeTapeRamp(1)).toBe(1);
    expect(easeTapeRamp(0.5)).toBeCloseTo(0.5, 6);
    expect(easeTapeRamp(-1)).toBe(0);
    expect(easeTapeRamp(2)).toBe(1);
    // Slow at the start, which is what makes the ramp read as a ramp.
    expect(easeTapeRamp(0.25)).toBeLessThan(0.25);
    expect(easeTapeRamp(0.75)).toBeGreaterThan(0.75);
  });

  test("holds the clock and the scanline frequency steady across the ramp", () => {
    // Sweeping speed makes the animation jump mid-ramp; sweeping a frequency
    // beats and aliases. Both must be equal in the two presets.
    expect(lo.speed).toBe(hi.speed);
    expect(lo.scanlineLines).toBe(hi.scanlineLines);
  });
});

test.describe("404 no-signal backdrop", () => {
  test("renders a decorative canvas that animates", async ({ page }) => {
    await page.goto("/this-route-does-not-exist", { waitUntil: "load" });

    await isolateCanvas(page);

    const canvas = page.locator("canvas[data-tape-canvas]");
    await expect(canvas).toHaveCount(1);
    await expect(canvas).toHaveAttribute("aria-hidden", "true");

    // Decorative: it must never intercept pointer events.
    await expect(canvas).toHaveCSS("pointer-events", "none");

    // The 404 copy stays reachable above the backdrop.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    // Two captures 250ms apart must differ, proving the loop runs and the
    // shader produces non-uniform output.
    const a = await canvas.screenshot();
    await page.waitForTimeout(250);
    const b = await canvas.screenshot();
    expect(Buffer.compare(a, b)).not.toBe(0);
  });

  test("renders a single static frame under reduced motion", async ({
    browser,
  }) => {
    const context = await browser.newContext({ reducedMotion: "reduce" });
    const page = await context.newPage();
    await page.goto("/this-route-does-not-exist", { waitUntil: "load" });

    await isolateCanvas(page);

    const canvas = page.locator("canvas[data-tape-canvas]");
    await expect(canvas).toHaveCount(1);

    const a = await canvas.screenshot();
    await page.waitForTimeout(600);
    const b = await canvas.screenshot();
    expect(Buffer.compare(a, b)).toBe(0);

    await context.close();
  });

  test("degrades to untouched content when WebGL2 is unavailable", async ({
    browser,
  }) => {
    const context = await browser.newContext();
    await context.addInitScript(() => {
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (
        this: HTMLCanvasElement,
        id: string,
        ...rest: unknown[]
      ) {
        if (id === "webgl2") return null;
        return (
          original as (this: HTMLCanvasElement, ...a: unknown[]) => unknown
        ).call(this, id, ...rest);
      } as typeof HTMLCanvasElement.prototype.getContext;
    });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));

    await page.goto("/this-route-does-not-exist", { waitUntil: "load" });

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(errors).toEqual([]);

    await context.close();
  });

  test("returns a genuine 404 status for a bad URL", async ({ page }) => {
    const response = await page.goto("/this-route-does-not-exist", {
      waitUntil: "load",
    });

    // The real 404 status depends on [locale]/[...rest]/page.tsx's
    // generateStaticParams() (empty) plus dynamicParams = false resolving
    // this route at build time, which only happens against a production
    // build; `next dev` always resolves routes at request time and returns a
    // soft 200 by design. `x-nextjs-prerender` is only set once a route has
    // actually been statically prerendered, so use it to detect which
    // environment this run is against instead of asserting something false.
    const isStaticBuild = response?.headers()["x-nextjs-prerender"] != null;
    test.skip(
      !isStaticBuild,
      "requires a production build; next dev resolves this route dynamically and returns 200 by design",
    );

    expect(response?.status()).toBe(404);
  });
});

test.describe("homepage TV screen", () => {
  test("the TV screen is taped and the video stays accessible", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "load" });

    // The video (and therefore the TapeSurface) is gated behind an
    // IntersectionObserver on the About section, so it does not exist until that
    // section approaches the viewport. Scroll to the section itself, which is
    // server-rendered, then wait for the surface to mount.
    await page.locator("#about").scrollIntoViewIfNeeded();

    const screen = page.locator("#about [data-tape-surface]");
    await expect(screen).toHaveCount(1, { timeout: 15000 });

    // The real video element is still in the DOM, so the mute toggle and
    // audio keep working.
    await expect(screen.locator("video")).toHaveCount(1);

    const canvas = screen.locator("canvas[data-tape-canvas]");
    await expect(canvas).toHaveAttribute("aria-hidden", "true");
    await expect(canvas).toHaveCSS("pointer-events", "none");

    // The above only proves the canvas exists with the right attributes; it
    // says nothing about whether the WebGL loop is actually drawing this
    // content-textured surface. isolateCanvas neutralises CSS animation so a
    // screenshot diff can only be explained by the canvas's own draw loop.
    await isolateCanvas(page);
    await expect(canvas).toHaveCSS("opacity", "1");
    const a = await canvas.screenshot();
    await page.waitForTimeout(250);
    const b = await canvas.screenshot();
    expect(Buffer.compare(a, b)).not.toBe(0);
  });

  test("hovering the screen ramps the tape up instead of scaling it", async ({
    page,
    viewport,
  }) => {
    test.skip(
      (viewport?.width ?? 0) < 768,
      "the hover ramp is gated on a mouse pointer, which the mobile projects do not emulate",
    );
    await page.goto("/", { waitUntil: "load" });
    await page.locator("#about").scrollIntoViewIfNeeded();

    const surface = page.locator("#about [data-tape-surface]");
    await expect(surface).toHaveCount(1, { timeout: 15000 });
    const canvas = surface.locator("canvas[data-tape-canvas]");
    await expect(canvas).toHaveCSS("opacity", "1");
    await page.waitForTimeout(600);

    // Same in-page frame series as the carousel ramp test, for the same
    // reason: a hover driven from the test costs more than the ramp lasts.
    // Scoped to the screen cutout link, since the section also has a "read
    // more" link pointing at /about further down.
    const ramp = await page
      .locator("#about a[href='/about']:has([data-tape-surface])")
      .evaluate(
        (link, helpers) =>
          new Function(
            "link",
            `${helpers};
          return (async () => {
            const el = link.querySelector("canvas[data-tape-canvas]");
            if (!el) throw new Error("TV screen has no tape canvas");
            const settling = await tapeRampSeries(el, 400);
            const ambient = settling[settling.length - 1].split;
            link.dispatchEvent(new PointerEvent("pointerover", {
              pointerType: "mouse", bubbles: true, composed: true,
            }));
            const rising = await tapeRampSeries(el, 600);
            const transform = getComputedStyle(
              link.querySelector("[data-tape-surface]") ?? link,
            ).transform;
            return { ambient, rising, transform };
          })();`,
          )(link) as Promise<{
            ambient: number;
            rising: Array<{ split: number; t: number }>;
            transform: string;
          }>,
        TAPE_FRAME_HELPERS,
      );

    assertRampedSmoothly({ ambient: ramp.ambient, rising: ramp.rising });

    // The old hover treatment was a group-hover scale on the surface wrapper.
    // The shader ramp replaced it, so nothing may scale the screen any more.
    expect(
      ramp.transform === "none" ||
        ramp.transform === "matrix(1, 0, 0, 1, 0, 0)",
    ).toBe(true);
  });

  test("no gradient overlays on the TV screen (shader replaced CSS effects)", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "load" });

    // Scroll the About section into view to trigger TapeSurface mount
    await page.locator("#about").scrollIntoViewIfNeeded();
    await page
      .locator("#about [data-tape-surface]")
      .waitFor({ state: "attached" });

    // Check computed styles of candidate overlay elements in the TV screen area.
    // The old CSS overlays (scanlines, vignette, RGB stripe) were divs with
    // inline gradient styles. They are now handled by the shader via uniforms.
    // This guard uses computed style rather than string selectors, so it catches
    // the visual effect whether it is inlined, in a CSS class, or reformatted.
    // Scope: check all absolutely positioned divs inside the videoContainerRef
    // (the TV screen cutout area). Overlays would be siblings of the video/surface
    // or nested within the screen area, all covered by this scope.
    const gradientLayers = await page.evaluate(() => {
      const about = document.getElementById("about");
      // A missing #about means the About section failed to render at all
      // (this project has already shipped that bug once, from a missing
      // .env.local). Throw rather than return 0, so a non-rendering page
      // fails this test loudly instead of passing vacuously.
      if (!about)
        throw new Error("#about is missing: About section did not render");
      // Find the Link containing the TV screen cutout area.
      // Check all divs within and around it for gradient backgrounds.
      const screenLink = about.querySelector("a[href='/about']");
      if (!screenLink) {
        throw new Error(
          "a[href='/about'] is missing inside #about: TV screen link did not render",
        );
      }
      // Check all divs in the Link's parent (videoContainerRef).
      // This covers both children of the Link and siblings that might be overlays.
      const videoContainer = screenLink.parentElement;
      if (!videoContainer) {
        throw new Error(
          "a[href='/about'] has no parentElement: TV screen link is detached from the DOM",
        );
      }
      const divs = videoContainer.querySelectorAll("div");
      let count = 0;
      divs.forEach((div) => {
        if (window.getComputedStyle(div).backgroundImage.includes("gradient")) {
          count++;
        }
      });
      return count;
    });
    expect(gradientLayers).toBe(0);
  });
});

test.describe("/about player", () => {
  test("is taped while paused and clears once playing", async ({ page }) => {
    await page.goto("/about", { waitUntil: "load" });

    const surface = page.locator("[data-tape-surface]").first();
    const canvas = surface.locator("canvas[data-tape-canvas]");
    await surface.scrollIntoViewIfNeeded();

    // Paused: the tape canvas is showing.
    await expect(canvas).toHaveCSS("opacity", "1");

    // Start playback through the player's own control.
    await page.locator("video").evaluate((el: HTMLVideoElement) => el.play());

    // Playing: the effect has faded out and the footage is clean.
    await expect(canvas).toHaveCSS("opacity", "0");
    const paused = await page
      .locator("video")
      .evaluate((el: HTMLVideoElement) => el.paused);
    expect(paused).toBe(false);
  });

  test("the paused overlay does not block the player's controls", async ({
    page,
  }) => {
    await page.goto("/about", { waitUntil: "load" });

    const surface = page.locator("[data-tape-surface]").first();
    await surface.waitFor({ state: "attached" });

    // Verify the surface has pointer-events-none, so it does not intercept clicks.
    // This assertion guards against someone removing the pointer-events-none class.
    const pointerEvents = await surface.evaluate(
      (el) => window.getComputedStyle(el).pointerEvents,
    );
    expect(pointerEvents).toBe("none");

    // A real click on the play button, not video.play(). If the overlay were
    // blocking pointer events, Playwright's actionability check would fail.
    // This double-verifies that the overlay allows clicks through to the player controls.
    await page.getByRole("button", { name: "Play video" }).click();

    // Verify the video is now playing
    await expect
      .poll(() =>
        page.locator("video").evaluate((el: HTMLVideoElement) => el.paused),
      )
      .toBe(false);
  });
});

test.describe("work carousel hover", () => {
  /**
   * Only the desktop carousel has tape wiring, and it only renders above
   * useIsMobile's 767px breakpoint, so a test that hovers a card has nothing
   * to hover in the mobile-viewport projects. Skip rather than fail there.
   * The tests below that build their own context with an explicit viewport are
   * viewport-independent and do not need this.
   */
  const requireDesktopCarousel = (viewport: { width: number } | null) =>
    test.skip(
      (viewport?.width ?? 0) < 768,
      "the desktop carousel does not render below useIsMobile's 767px breakpoint",
    );

  test("every card on screen wears the ambient tape, unhovered", async ({
    page,
    viewport,
  }) => {
    requireDesktopCarousel(viewport);
    await page.goto("/", { waitUntil: "load" });

    // The carousel repeats items for the infinite-loop illusion and starts
    // centred on the canonical (non-duplicate) copy, so a bare `.first()`
    // resolves to a duplicate that sits off-screen with no scrollable
    // ancestor to bring it into view (see navigation.spec.ts AC2c for the
    // same carousel quirk). Scope to a canonical, on-screen item instead.
    const card = page
      .locator("a:not([aria-hidden]) [data-carousel-item]")
      .first();
    await card.scrollIntoViewIfNeeded();
    // Let the entrance animation and idle pre-warm settle.
    await page.waitForTimeout(1200);

    // Nothing is hovered: the tape is ambient, on every card the pool lent a
    // canvas to, and each of those cards has exactly one.
    await page.mouse.move(0, 0);
    const stage = page.locator("canvas[data-tape-stage]");
    const lent = await stage.count();
    expect(lent).toBeGreaterThanOrEqual(3);
    // MAX_SLOTS in carouselTapeStage.ts. Exceeding it means the GL context cap
    // is no longer being respected.
    expect(lent).toBeLessThanOrEqual(8);

    await expect(stage.first()).toHaveAttribute("aria-hidden", "true");
    await expect(card.locator("canvas[data-tape-stage]")).toHaveCount(1);

    // The card's own image keeps its alt text regardless.
    await expect(card.locator("img")).toHaveAttribute("alt", /.*/);

    // Every taped card hides its image behind the canvas, and only once a
    // frame has drawn. A card showing a canvas over a visible image would
    // double-expose; a card showing neither would be blank.
    const mismatched = await page.evaluate(
      () =>
        [...document.querySelectorAll("canvas[data-tape-stage]")].filter(
          (c) => {
            const img = c.parentElement?.querySelector("img");
            return !img || getComputedStyle(img).opacity !== "0";
          },
        ).length,
    );
    expect(mismatched).toBe(0);
  });

  test("hovering ramps a card up smoothly, and leaving ramps it back", async ({
    page,
    viewport,
  }) => {
    requireDesktopCarousel(viewport);
    await page.goto("/", { waitUntil: "load" });

    const card = page
      .locator("a:not([aria-hidden]) [data-carousel-item]")
      .first();
    await card.scrollIntoViewIfNeeded();
    await page.mouse.move(0, 0);
    await page.waitForTimeout(1200);
    await expect(card.locator("canvas[data-tape-stage]")).toHaveCount(1);

    // The hover is dispatched and then sampled from inside the page. Driving it
    // from the test would prove nothing about smoothness: card.hover() plus one
    // round trip already costs more than the 220ms ramp, so every sample would
    // read full strength no matter what the easing did (measured while writing
    // this test).
    const ramp = await card.evaluate(
      (host, helpers) =>
        new Function(
          "host",
          `${helpers};
          return (async () => {
            const el = host.querySelector("canvas[data-tape-stage]");
            if (!el) throw new Error("card has no tape stage");
            const settling = await tapeRampSeries(el, 400);
            const ambient = settling[settling.length - 1].split;
            // React binds onPointerEnter through pointerover delegation, so
            // this is the same path a real cursor takes.
            host.dispatchEvent(new PointerEvent("pointerover", {
              pointerType: "mouse", bubbles: true, composed: true,
            }));
            const rising = await tapeRampSeries(el, 600);
            host.dispatchEvent(new PointerEvent("pointerout", {
              pointerType: "mouse", bubbles: true, composed: true,
            }));
            const falling = await tapeRampSeries(el, 600);
            return { ambient, rising, falling };
          })();`,
        )(host) as Promise<{
          ambient: number;
          rising: Array<{ split: number; t: number }>;
          falling: Array<{ split: number; t: number }>;
        }>,
      TAPE_FRAME_HELPERS,
    );

    assertRampedSmoothly(ramp);
  });

  test("draws no black frame around the hovered card", async ({
    page,
    viewport,
  }) => {
    requireDesktopCarousel(viewport);
    await page.goto("/", { waitUntil: "load" });

    const card = page
      .locator("a:not([aria-hidden]) [data-carousel-item]")
      .first();
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);
    await card.hover();

    const canvas = card.locator("canvas[data-tape-stage]");
    await expect(canvas).toHaveCount(1);
    await page.waitForTimeout(600);

    const { ringOpaqueBlack } = await sampleTapeCanvas(canvas);
    expect(ringOpaqueBlack).toBeLessThan(0.2);
  });

  test("the mobile carousel has no tape wiring at all", async ({ browser }) => {
    // At this width useIsMobile() renders MobileWorkSection, which never had
    // any tape wiring, so this does not exercise the touch/pointer guards
    // themselves (see the desktop-width touch test below for that). It just
    // documents that the mobile carousel stays untouched.
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "load" });
    await page.waitForTimeout(1200);
    await expect(page.locator("canvas[data-tape-stage]")).toHaveCount(0);
    await context.close();
  });

  test("a touch pointer on the desktop carousel creates no stage", async ({
    browser,
  }) => {
    // Desktop width so DesktopWorkSection renders (useIsMobile is max-width:
    // 767px), but with touch emulation so (hover: hover) and (pointer: fine)
    // both fail and pointer events arrive with pointerType "touch". This
    // exercises the guards themselves rather than a component that has no
    // tape wiring at all.
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      hasTouch: true,
      isMobile: true,
    });
    const page = await context.newPage();
    await page.goto("/", { waitUntil: "load" });

    const card = page
      .locator("a:not([aria-hidden]) [data-carousel-item]")
      .first();
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);

    // Not card.tap(): a Playwright/Chromium tap's touchend also fires a
    // pointerleave, which releases the stage regardless of the pointerType
    // guard, so it would pass even with the guard removed (verified by
    // hand). Real touch devices are not guaranteed to behave that well.
    // iOS Safari's well-known "sticky hover" can leave a touch pointer
    // logically "over" an element with no matching leave. Dispatching
    // pointerover directly, with no matching pointerleave, isolates exactly
    // what the guard is responsible for.
    await card.evaluate((el) => {
      el.dispatchEvent(
        new PointerEvent("pointerover", {
          pointerType: "touch",
          bubbles: true,
          composed: true,
        }),
      );
    });
    await expect(page.locator("canvas[data-tape-stage]")).toHaveCount(0);

    await context.close();
  });

  test("unmounting a hovered card stops the render loop, not just the DOM node", async ({
    page,
    viewport,
  }) => {
    requireDesktopCarousel(viewport);
    // A DOM query cannot prove this. WorkSection lives on the home route's
    // page.tsx, not a persistent layout, so a client-side route change
    // unmounts the whole subtree and physically removes the canvas from the
    // document regardless of whether releaseTapeStage ever ran. What a DOM
    // query cannot see is whether the requestAnimationFrame loop is still
    // calling draw() against that now-detached canvas for the rest of the
    // page session. Count real GPU draws instead, and isolate the count on
    // a route with no tape wiring of its own (/blog), so any draws recorded
    // there can only be the leaked carousel renderer.
    await page.addInitScript(() => {
      const w = window as unknown as { __draws: number };
      w.__draws = 0;
      const proto = WebGL2RenderingContext.prototype;
      const original = proto.drawArrays;
      proto.drawArrays = function (
        this: WebGL2RenderingContext,
        ...args: Parameters<typeof original>
      ) {
        w.__draws++;
        return original.apply(this, args);
      };
    });

    await page.goto("/", { waitUntil: "load" });

    const card = page
      .locator("a:not([aria-hidden]) [data-carousel-item]")
      .first();
    await card.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1200);

    await card.hover();
    await expect(card.locator("canvas[data-tape-stage]")).toHaveCount(1);

    // Confirm the loop is actually running before relying on it as a signal.
    const beforeNav = await page.evaluate(
      () => (window as unknown as { __draws: number }).__draws,
    );
    await page.waitForTimeout(300);
    const stillHovering = await page.evaluate(
      () => (window as unknown as { __draws: number }).__draws,
    );
    expect(stillHovering).toBeGreaterThan(beforeNav);

    // Navigate away via a real next/link click (StickyNav's desktop "blog"
    // item), not a full reload: a reload would reset window.__draws and
    // make the test vacuous in a different way. The pointer is left sitting
    // over the card (no hover/leave over the link itself), so only the
    // CarouselItem's unmount cleanup can stop the loop here.
    await page
      .locator('nav a[href="/blog"]')
      .first()
      .evaluate((el) => (el as HTMLAnchorElement).click());
    await expect(page).toHaveURL(/\/blog\/?$/);

    // /blog has no tape wiring of its own: confirm there is nothing here
    // that could contribute draws of its own before trusting the counter.
    await expect(page.locator("canvas[data-tape-canvas]")).toHaveCount(0);
    await expect(page.locator("canvas[data-tape-stage]")).toHaveCount(0);

    const afterNav = await page.evaluate(
      () => (window as unknown as { __draws: number }).__draws,
    );
    await page.waitForTimeout(500);
    const settled = await page.evaluate(
      () => (window as unknown as { __draws: number }).__draws,
    );
    expect(settled).toBe(afterNav);
  });
});

test.describe("sitewide NoiseOverlay", () => {
  test("freezes the grain animation under reduced motion but keeps it visible", async ({
    browser,
  }) => {
    // Under reduced motion, the overlay grain texture must remain visible for
    // character, but its animation must stop so it does not defeat the tape
    // effect's own reduced-motion behaviour (or any other animation guard).
    const reducedMotionContext = await browser.newContext({
      reducedMotion: "reduce",
    });
    const reducedMotionPage = await reducedMotionContext.newPage();
    await reducedMotionPage.goto("/", { waitUntil: "load" });

    // Locate the NoiseOverlay by its CSS class
    const noiseOverlay = reducedMotionPage.locator(".noise-overlay").first();

    // Assert the overlay exists and is visible
    await expect(noiseOverlay).toHaveCount(1);
    const opacity = await noiseOverlay.evaluate((el) => {
      return window.getComputedStyle(el).opacity;
    });
    expect(parseFloat(opacity)).toBeGreaterThan(0);

    // Assert the animation is frozen (none)
    const animationName = await noiseOverlay.evaluate((el) => {
      return window.getComputedStyle(el).animationName;
    });
    expect(animationName).toBe("none");

    await reducedMotionContext.close();

    // Verify the animation is active in normal context (A/B proof)
    const normalContext = await browser.newContext();
    const normalPage = await normalContext.newPage();
    await normalPage.goto("/", { waitUntil: "load" });

    const normalOverlay = normalPage.locator(".noise-overlay").first();
    const normalAnimationName = await normalOverlay.evaluate((el) => {
      return window.getComputedStyle(el).animationName;
    });
    expect(normalAnimationName).toBe("grain");

    await normalContext.close();
  });
});
