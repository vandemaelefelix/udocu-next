# VHS tape effect on selected surfaces

## Context

The documentary's visual identity leans on old TVs and worn tape. The site already gestures at this in three places: a global film-grain overlay (`NoiseOverlay`), an on-hover SVG displacement glitch (`GlitchText`), and, most directly, `AboutSection`, which composites the About video into the screen cutout of a photographed old TV (`tvFrameOverlay`, 1856x2304) and stacks three static CSS overlays on it (3px scanlines, a vignette, and an RGB phosphor stripe at 10% opacity).

The trigger for this work was [canvasui.dev's VHS component](https://canvasui.dev/docs/components/vhs). Two findings from reading its source shaped this design:

1. **It cannot be used as shipped.** It textures live DOM via `drawElementImage()` on a `<canvas layoutsubtree>`, using the experimental **html-in-canvas** API. That API is Chrome-only, behind `#enable-experimental-web-platform-features`. Its `supportsHtmlInCanvas()` detection is real, and the unsupported path leaves the content texture as a 1x1 transparent pixel while still running the shader. So Safari, Firefox and default Chrome get a faint dark grain-and-scanline wash and none of the warping, chroma bleed or barrel curvature. That is roughly what `NoiseOverlay` already provides.
2. **Its licence makes vendoring awkward here.** Canvas UI is MIT + Commons Clause: free in any commercial or personal app, but "the only restriction is reselling or redistributing the components themselves, whether alone, in a bundle, or as a port." `udocu-next` is a **public** repo, so committing its shader source verbatim sits closer to redistribution than we want to decide unilaterally.

Both problems dissolve together. We need a different architecture regardless (textures sourced from `<img>`/`<video>` elements rather than captured DOM), which works in every browser in our browserslist. The individual artifacts are also textbook shader idioms (sine displacement for tape wave, RGB channel offset for chroma bleed, `sin(uv.y * height)` scanlines, hash noise for grain, radial remap for barrel). So we write our own GLSL, using the Canvas UI component only as a reference list of *which* artifacts to include.

The effect is deliberately **not** global. It appears on four surfaces, three of which are transient or small.

## Decisions

1. **Own the shader.** Write our own GLSL and WebGL2 renderer. No dependency added, no third-party source committed, no licence question. Consequence: the look will not be pixel-identical to the Canvas UI demo.

2. **Texture source is an element, never the DOM.** `HTMLImageElement`, `HTMLVideoElement`, or `null` (artifacts only, no content). All our sources are same-origin, since `/videos/*` is local and Prismic images pass through Next's `/_next/image` optimizer, so textures are never tainted and no `crossOrigin` handling is needed. `YouTubeEmbed` iframes on work/blog detail pages are cross-origin and therefore permanently out of scope.

3. **Split renderer from React.** `tapeRenderer.ts` is framework-free and owns the GL context, program, uniforms, texture upload and frame loop. `TapeSurface.tsx` is a thin `"use client"` wrapper. This keeps the GL code testable and out of React's lifecycle.

4. **`createTapeRenderer` returns `null` when WebGL2 is unavailable**, and `TapeSurface` then renders its children completely untouched. No half-effect, no dark grain smear. This is the graceful-degradation contract, and it is the explicit fix for the failure mode that makes the original component unusable.

5. **Internal render resolution is capped** (~480px tall generally; the TV screen buffer ~256px wide), DPR ignored deliberately, with CSS upscaling the result. This is the largest performance lever *and* it is more authentic, since real VHS is roughly 240-480 lines. Rendering a tape effect at full retina resolution would be both slower and wronger.

6. **The real element always stays in the DOM and in the accessibility tree.** When the effect is active the source element goes to `opacity: 0` and the canvas fades in; the canvas is `aria-hidden="true"` and `pointer-events: none`. `alt` text, SEO, `next/image` loading, video controls and audio are all untouched. Nothing about the effect is load-bearing.

7. **`opacity`, never `display: none` or `visibility: hidden`,** for hiding the source. `display: none` on a `<video>` can halt frame delivery in some browsers, and we need those frames as texture input. Both directions crossfade, so hover-off and the `/about` play transition are not hard cuts.

8. **On the homepage TV the shader replaces the three CSS overlays** rather than stacking on them. Scanlines, vignette and chroma become uniforms. The CSS overlays are static; motion (tape wave, head-switch roll, AC beat, animated grain) is the one thing they cannot do and the entire reason to use a shader on that surface. Net effect: fewer DOM nodes.

9. **`prefers-reduced-motion: reduce` renders exactly one static frame, then stops the loop.** The grade, scanlines and chroma survive; all motion stops. This matches the gate `GlitchText` already uses.

10. **The carousel uses one shared, pre-warmed canvas re-parented into the hovered card.** Because the canvas becomes a *child* of the card's motion div, it inherits that card's entrance and inertia transforms for free: no per-frame `getBoundingClientRect`, no lag during drift. One GL context serves the whole carousel regardless of how many duplicated infinite-loop copies exist.

### Per-surface behaviour

| Surface | Trigger | Source | Preset |
|---|---|---|---|
| Homepage TV screen (`AboutSection`) | always on | the autoplaying `<video>` | `tvScreen` |
| `/about` player (`VideoPlayer`) | while paused; clears on play | the poster `<img>` | `poster` |
| Work carousel card | desktop hover only | that card's `<img>` | `hover` |
| 404 (`not-found.tsx`) | always on | none | `noSignal` |

- **Homepage TV**: `barrel: 0`, because the photographed TV already supplies the curvature. `group-hover:scale-105` moves from the video onto the `TapeSurface` wrapper so canvas and video scale together. `AboutSection`'s mute toggle uses `querySelector("video")` and keeps working, since the video stays in the DOM.
- **`/about` player**: the ambient homepage clip autoplays, so an idle-only treatment would never show there; the lean-in `/about` player is the surface where degrading the footage would be a real cost, hence clearing on play. `VideoPlayer` keeps `isPlaying` private and its API is **not** widened: a new client component `TapedVideo.tsx` composes it and derives state from the video element's own `play`/`pause`/`ended` events. Because `preload="none"` means no video frames exist while paused, we texture the **poster** as a real `<img>` and fade the whole treatment out on play. The effect never touches video decode.
- **Work carousel**: gated on `(hover: hover) and (pointer: fine)`, so touch devices see clean images and pay no GPU cost. Context and program pre-warm on `requestIdleCallback` once the carousel first enters the viewport, so the first hover has no shader-compile stall. The hovered card's `<img>` goes `opacity: 0` while taped.
- **404**: `fixed inset-0 -z-10`, no children, no texture. A no-signal backdrop *behind* the existing type, so nothing warps the text.

### Presets

Plain uniform numbers in `presets.ts` (not Tailwind theme tokens, since these are shader uniforms rather than design tokens). All overridable via props so they can be tuned without touching the shader.

| | tvScreen | poster | hover | noSignal |
|---|---|---|---|---|
| wave | 0.30 | 0.60 | 0.50 | 0.80 |
| jitter | 0.12 | 0.20 | 0.30 | 0.50 |
| aberration | 1.0 | 1.6 | 2.0 | 2.5 |
| scanlines | 0.18 | 0.20 | 0.15 | 0.30 |
| grain | 0.08 | 0.12 | 0.10 | 0.55 |
| switching | 0.03 | 0.06 | 0.08 | 0.40 |
| barrel | 0 | 0.10 | 0.08 | 0.15 |
| vignette | 0.15 | 0.20 | 0.10 | 0.35 |
| saturation | 0.90 | 0.95 | 0.95 | 0.60 |

These are starting values, tuned empirically after first render.

## Changes

- `src/components/vhs/tapeRenderer.ts` (new): GLSL + WebGL2 renderer. Exports `createTapeRenderer(canvas, { source, params }): TapeRenderer | null` and the `TapeParams` / `TapeSource` types. Instance exposes `setParams`, `setSource`, `start`, `stop`, `resize`, `destroy`.
- `src/components/vhs/TapeSurface.tsx` (new): `"use client"`. Renders a `relative` wrapper with children plus an absolutely-positioned `aria-hidden` canvas. Props: `active`, `params`, optional `fadeMs`. Locates its source via `wrapper.querySelector("img, video")`, the pattern `AboutSection` already uses. Handles the `IntersectionObserver` / `document.hidden` / reduced-motion gating.
- `src/components/vhs/presets.ts` (new): the four presets above.
- `src/components/vhs/carouselTapeStage.ts` (new): module-level shared canvas + context with `acquire(hostEl, source, params)` / `release(hostEl)` and idle pre-warming.
- `src/components/TapedVideo.tsx` (new): `"use client"`. Composes `VideoPlayer` + `AboutVideo` + poster `TapeSurface`, deriving active state from video events.
- `src/components/AboutSection.tsx`: wrap `AboutVideo` (~line 166) in `TapeSurface`; **delete** the three CSS overlay divs (~lines 183-205); move `group-hover:scale-105` onto the wrapper.
- `src/components/WorkSection.tsx`: desktop carousel item gains `pointerenter`/`pointerleave` handlers driving `carouselTapeStage`. Mobile carousel untouched.
- `src/app/[locale]/about/page.tsx`: swap the `media={<VideoPlayer>…</VideoPlayer>}` block for `<TapedVideo />`. Stays a server component.
- `src/app/[locale]/not-found.tsx`: add the full-bleed no-signal `TapeSurface` behind the existing content.
- `src/components/VideoPlayer.tsx`, `src/components/AboutVideo.tsx`, `src/components/NoiseOverlay.tsx`, `src/components/GlitchText.tsx`: unchanged.
- No copy added, so no `messages/*.json` changes.

## Testing

- **Performance is a blocker, not a footnote.** Existing `npm run test:perf` and `npm run lhci` must still pass with the homepage TV shader running. A regression there blocks the change.
- Playwright navigation test: on `/about`, after clicking play, the tape canvas is faded out and the video is playing.
- Playwright a11y assertions: carousel images retain their `alt`; every tape canvas is `aria-hidden="true"`.
- Reduced-motion test: with `prefers-reduced-motion: reduce`, the canvas is byte-identical across two frames captured a second apart (proves the loop stopped).
- Degradation check: with WebGL2 stubbed unavailable, surfaces render their children untouched and nothing throws.
- Visual verification via a throwaway Playwright script across a spread of viewports, then tune the preset numbers.
- `npm run lint` and `npm run tsc` must pass.

## Out of scope

- Applying the effect to `YouTubeEmbed` videos on work/blog detail pages. Cross-origin iframes cannot be textured, ever.
- The mobile work carousel, and the work detail page hero image (`DetailPage`'s optional `Image`). Both were considered and deliberately declined.
- Changes to `NoiseOverlay`'s global grain or `GlitchText`'s hover glitch. They coexist with this; reconciling the three treatments into one system is separate work.
- Any viewer-facing toggle for the effect.
