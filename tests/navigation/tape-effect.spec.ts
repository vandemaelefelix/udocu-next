/**
 * VHS tape effect. Verifies the effect is decorative, degrades gracefully,
 * and respects reduced motion.
 *
 * Requires a running dev/preview server (BASE_URL env or http://localhost:3000).
 */

import { test, expect, type Page } from "@playwright/test";

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
  test("hovering a card tapes it, leaving restores it", async ({ page }) => {
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

    const stage = page.locator("canvas[data-tape-stage]");
    await expect(stage).toHaveCount(0);

    await card.hover();
    await expect(stage).toHaveCount(1);
    await expect(stage).toHaveAttribute("aria-hidden", "true");
    // The stage is inside the hovered card, so it inherits its transforms.
    expect(await card.locator("canvas[data-tape-stage]").count()).toBe(1);

    // The card's own image keeps its alt text regardless.
    await expect(card.locator("img")).toHaveAttribute("alt", /.*/);

    await page.mouse.move(0, 0);
    await expect(stage).toHaveCount(0);
    await expect(card.locator("img")).toHaveCSS("opacity", "1");
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
  }) => {
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
    await expect(page.locator("canvas[data-tape-stage]")).toHaveCount(1);

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
