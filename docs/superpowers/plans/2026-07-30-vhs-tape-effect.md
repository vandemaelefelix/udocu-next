# VHS Tape Effect Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a self-authored WebGL2 VHS tape effect to four specific surfaces (homepage TV screen, `/about` player while paused, work carousel cards on desktop hover, and the 404 page) without degrading performance or accessibility.

**Architecture:** A framework-free WebGL2 renderer (`tapeRenderer.ts`) textures an existing `<img>` or `<video>` element, or nothing at all, and draws the tape artifacts to an overlay canvas. A thin React wrapper (`TapeSurface.tsx`) handles mounting, crossfading, and gating on visibility / reduced motion / WebGL availability. The work carousel is a special case: one shared pre-warmed canvas is re-parented into the hovered card so a single GL context serves every card.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS v4, WebGL2 (no new dependencies), Playwright for verification.

**Spec:** `docs/superpowers/specs/2026-07-30-vhs-tape-effect-design.md`

## Global Constraints

- **No new npm dependencies.** The shader is written in this repo; nothing is vendored from canvasui.dev.
- **No em dashes** in any file content, comment, commit message, or doc. Use a period, comma, colon, or restructure.
- **Use Tailwind theme tokens** from `src/app/globals.css` (`@theme inline`) instead of hardcoded colour values. Shader uniform numbers in `presets.ts` are exempt: they are not design tokens.
- **`@/*` path alias** maps to `./src/*`. Use it for all imports.
- **TypeScript strict mode.** `npm run tsc` must pass with zero errors after every task.
- **`npm run lint` must pass** after every task. Husky + lint-staged run `eslint --fix` and `prettier --write` on commit.
- **Every canvas is decorative:** `aria-hidden="true"` and `pointer-events: none`, always. The real `<img>`/`<video>` stays in the DOM and in the accessibility tree.
- **Hide sources with `opacity` only.** Never `display: none` or `visibility: hidden` on a `<video>`; that can halt frame delivery, and we need frames as texture input.
- **`prefers-reduced-motion: reduce`** renders exactly one frame, then stops the loop.
- **No copy is added,** so `messages/nl.json` is never modified.
- **Playwright tests need a running server.** `playwright.config.ts` starts `npm run dev` automatically with `reuseExistingServer: true`, or set `BASE_URL`. Test dir is `./tests`.
- **Tests assume WebGL2 in the test browser.** Playwright's bundled Chromium and WebKit both provide it. If a `toHaveCSS("opacity", "1")` assertion on a tape canvas fails everywhere at once, confirm WebGL2 is actually available (`page.evaluate(() => !!document.createElement("canvas").getContext("webgl2"))`) before assuming the shader is broken.

---

### Task 1: WebGL2 renderer and presets

The core. Everything else consumes this. No React in these files.

**Files:**
- Create: `src/components/vhs/tapeRenderer.ts`
- Create: `src/components/vhs/presets.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  ```ts
  export interface TapeParams {
    speed: number; wave: number; jitter: number; aberration: number;
    scanlines: number; grain: number; switching: number; switchingHeight: number;
    barrel: number; vignette: number; saturation: number; exposure: number;
  }
  export type TapeSource = HTMLImageElement | HTMLVideoElement | null;
  export interface TapeRenderer {
    setParams(next: Partial<TapeParams>): void;
    setSource(next: TapeSource): void;
    start(): void;
    stop(): void;
    renderOnce(): void;
    resize(cssWidth: number, cssHeight: number): void;
    destroy(): void;
  }
  export function createTapeRenderer(
    canvas: HTMLCanvasElement,
    opts: { source: TapeSource; params: TapeParams; maxHeight?: number },
  ): TapeRenderer | null;
  // presets.ts
  export type TapePresetName = "tvScreen" | "poster" | "hover" | "noSignal";
  export const TAPE_PRESETS: Record<TapePresetName, TapeParams>;
  ```

- [ ] **Step 1: Create `src/components/vhs/presets.ts`**

```ts
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
    speed: 0.5, wave: 0.3, jitter: 0.12, aberration: 1.0,
    scanlines: 0.18, grain: 0.08, switching: 0.03, switchingHeight: 0.02,
    barrel: 0, vignette: 0.15, saturation: 0.9, exposure: 1.0,
  },
  // The /about poster while paused. An invitation, not content, so stronger.
  poster: {
    speed: 0.5, wave: 0.6, jitter: 0.2, aberration: 1.6,
    scanlines: 0.2, grain: 0.12, switching: 0.06, switchingHeight: 0.03,
    barrel: 0.1, vignette: 0.2, saturation: 0.95, exposure: 1.0,
  },
  // Work carousel hover. Transient, so it can afford to be punchy.
  hover: {
    speed: 0.7, wave: 0.5, jitter: 0.3, aberration: 2.0,
    scanlines: 0.15, grain: 0.1, switching: 0.08, switchingHeight: 0.03,
    barrel: 0.08, vignette: 0.1, saturation: 0.95, exposure: 1.05,
  },
  // 404. No content texture at all: a dead channel.
  noSignal: {
    speed: 1.0, wave: 0.8, jitter: 0.5, aberration: 2.5,
    scanlines: 0.3, grain: 0.55, switching: 0.4, switchingHeight: 0.06,
    barrel: 0.15, vignette: 0.35, saturation: 0.6, exposure: 1.0,
  },
};
```

- [ ] **Step 2: Create `src/components/vhs/tapeRenderer.ts` with the shaders**

Write the file starting with the types and the two shader sources. `vUv` is flipped on Y so `t=0` is the image's top row, matching how `texImage2D` uploads DOM elements.

```ts
export interface TapeParams {
  /** Overall artifact animation rate. */
  speed: number;
  /** Slow horizontal tape undulation. */
  wave: number;
  /** Fine per-line horizontal jitter. */
  jitter: number;
  /** RGB channel misalignment, in output pixels. */
  aberration: number;
  /** CRT scanline overlay strength. */
  scanlines: number;
  /** Animated static grain. */
  grain: number;
  /** Head-switching noise strength at the bottom of the frame. */
  switching: number;
  /** Height of the head-switching band, as a fraction of the frame. */
  switchingHeight: number;
  /** Tube curvature. 0 disables it. */
  barrel: number;
  /** Corner darkening. */
  vignette: number;
  /** 1 keeps source colours, 0 is greyscale. */
  saturation: number;
  /** Final brightness multiplier. */
  exposure: number;
}

export type TapeSource = HTMLImageElement | HTMLVideoElement | null;

export interface TapeRenderer {
  setParams(next: Partial<TapeParams>): void;
  setSource(next: TapeSource): void;
  start(): void;
  stop(): void;
  /** Draw a single frame without starting the loop. Used for reduced motion. */
  renderOnce(): void;
  resize(cssWidth: number, cssHeight: number): void;
  destroy(): void;
}

const VERT = `#version 300 es
layout(location = 0) in vec2 aPos;
out vec2 vUv;
void main() {
  // Flip Y so t=0 is the source element's top row.
  vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
  gl_Position = vec4(aPos, 0.0, 1.0);
}`;

const FRAG = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 outColor;

uniform sampler2D uTex;
uniform float uHasTex;
uniform vec2  uRes;
uniform float uTime;
uniform float uWave;
uniform float uJitter;
uniform float uAberration;
uniform float uScanlines;
uniform float uGrain;
uniform float uSwitching;
uniform float uSwitchHeight;
uniform float uBarrel;
uniform float uVignette;
uniform float uSaturation;
uniform float uExposure;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(89.44, 19.36))) * 22189.22);
}

void main() {
  vec2 uv = vUv;

  // Tube curvature.
  if (uBarrel > 0.0) {
    vec2 c = uv * 2.0 - 1.0;
    c *= 1.0 + uBarrel * 0.25 * dot(c, c);
    uv = c * 0.5 + 0.5;
  }

  float line = uv.y * uRes.y;

  // Slow tape wave: two low-frequency components beating against each other.
  float wave = sin(uv.y * 3.0 + uTime * 0.6) * 0.5
             + sin(uv.y * 11.0 - uTime * 0.35) * 0.5;
  uv.x += wave * uWave * 0.006;

  // Per-line jitter, stepped in time so it reads as tape rather than noise.
  float jn = hash(vec2(floor(line), floor(uTime * 24.0))) * 2.0 - 1.0;
  uv.x += jn * uJitter * 0.0025;

  // Head-switching band along the bottom edge.
  float band = smoothstep(0.0, uSwitchHeight, uSwitchHeight - (1.0 - uv.y));
  float sn = hash(vec2(line * 1.7, floor(uTime * 30.0)));
  uv.x += band * uSwitching * (sn - 0.5) * 0.25;

  // Everything outside the frame after warping reads as bezel.
  float inside = step(0.0, uv.x) * step(uv.x, 1.0)
               * step(0.0, uv.y) * step(uv.y, 1.0);

  vec3 col;
  float alpha;
  if (uHasTex > 0.5) {
    float ab = uAberration / max(uRes.x, 1.0);
    col = vec3(
      texture(uTex, uv + vec2(ab, 0.0)).r,
      texture(uTex, uv).g,
      texture(uTex, uv - vec2(ab, 0.0)).b
    );
    alpha = texture(uTex, uv).a;
  } else {
    // No content: a dead channel, opaque so it reads as a lit but empty tube.
    col = vec3(0.0);
    alpha = 1.0;
  }

  // AC beat rolling down the frame.
  col *= 1.0 + 0.05 * sin(uv.y * 6.2831853 - uTime * 1.7);

  // Animated grain.
  col += (hash(uv * uRes + vec2(uTime * 91.7, uTime * 47.3)) - 0.5) * uGrain;

  // Scanlines.
  col *= 1.0 - uScanlines * (0.5 + 0.5 * sin(line * 3.14159265));

  // Head-switch static is bright, not just displaced.
  float staticAmt = clamp(band * uSwitching * 3.0, 0.0, 1.0);
  col = mix(col, vec3(sn), staticAmt);
  alpha = max(alpha, staticAmt);

  // Vignette, measured on the unwarped coordinate so it stays centred.
  vec2 vd = (vUv - 0.5) * vec2(uRes.x / max(uRes.y, 1.0), 1.0);
  col *= 1.0 - uVignette * smoothstep(0.4, 1.1, length(vd));

  col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, uSaturation);
  col *= uExposure;

  col *= inside;
  if (uBarrel > 0.0) alpha = 1.0;

  outColor = vec4(col, alpha);
}`;
```

- [ ] **Step 3: Append the renderer implementation to `tapeRenderer.ts`**

```ts
const UNIFORM_NAMES = [
  "uTex", "uHasTex", "uRes", "uTime", "uWave", "uJitter", "uAberration",
  "uScanlines", "uGrain", "uSwitching", "uSwitchHeight", "uBarrel",
  "uVignette", "uSaturation", "uExposure",
] as const;

type UniformMap = Record<
  (typeof UNIFORM_NAMES)[number],
  WebGLUniformLocation | null
>;

function compile(
  gl: WebGL2RenderingContext,
  type: number,
  src: string,
): WebGLShader | null {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[tape] shader compile failed:", gl.getShaderInfoLog(sh));
    }
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function isVideo(src: TapeSource): src is HTMLVideoElement {
  return src !== null && src instanceof HTMLVideoElement;
}

/**
 * Creates a tape renderer drawing to `canvas`, texturing `opts.source`.
 * Returns null when WebGL2 is unavailable or the program fails to build, in
 * which case the caller must render its content untouched.
 */
export function createTapeRenderer(
  canvas: HTMLCanvasElement,
  opts: { source: TapeSource; params: TapeParams; maxHeight?: number },
): TapeRenderer | null {
  const gl = canvas.getContext("webgl2", {
    alpha: true,
    depth: false,
    stencil: false,
    antialias: false,
    premultipliedAlpha: false,
  });
  if (!gl || gl.isContextLost()) return null;

  const vs = compile(gl, gl.VERTEX_SHADER, VERT);
  const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
  const program = vs && fs ? gl.createProgram() : null;
  if (!vs || !fs || !program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[tape] link failed:", gl.getProgramInfoLog(program));
    }
    gl.deleteProgram(program);
    return null;
  }
  gl.useProgram(program);

  const u = {} as UniformMap;
  for (const name of UNIFORM_NAMES) {
    u[name] = gl.getUniformLocation(program, name);
  }

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(u.uTex, 0);

  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(
    gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA,
    gl.ONE, gl.ONE_MINUS_SRC_ALPHA,
  );

  const maxHeight = opts.maxHeight ?? 480;
  let params: TapeParams = { ...opts.params };
  let source: TapeSource = opts.source;
  let uploaded = false;
  let running = false;
  let raf = 0;
  let startedAt = 0;
  let destroyed = false;

  function sourceReady(): boolean {
    if (!source) return false;
    if (isVideo(source)) return source.readyState >= 2;
    return source.complete && source.naturalWidth > 0;
  }

  function uploadTexture() {
    if (!source || !sourceReady()) return;
    // A still image only needs uploading once; video needs every frame.
    if (uploaded && !isVideo(source)) return;
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.pixelStorei(gl!.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl!.texImage2D(
      gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, source,
    );
    uploaded = true;
  }

  function resize(cssWidth: number, cssHeight: number) {
    // Deliberately DPR-independent and capped. Real VHS is 240 to 480 lines,
    // so a low internal buffer is both cheaper and more authentic.
    const h = Math.max(1, Math.min(Math.round(cssHeight), maxHeight));
    const scale = cssHeight > 0 ? h / cssHeight : 1;
    const w = Math.max(1, Math.round(cssWidth * scale));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  }

  function draw(nowMs: number) {
    if (destroyed) return;
    if (startedAt === 0) startedAt = nowMs;
    const t = ((nowMs - startedAt) / 1000) * params.speed;

    uploadTexture();

    gl!.viewport(0, 0, canvas.width, canvas.height);
    gl!.clearColor(0, 0, 0, 0);
    gl!.clear(gl!.COLOR_BUFFER_BIT);

    gl!.useProgram(program);
    gl!.bindVertexArray(vao);
    gl!.activeTexture(gl!.TEXTURE0);
    gl!.bindTexture(gl!.TEXTURE_2D, tex);

    gl!.uniform1f(u.uHasTex, source && uploaded ? 1 : 0);
    gl!.uniform2f(u.uRes, canvas.width, canvas.height);
    gl!.uniform1f(u.uTime, t);
    gl!.uniform1f(u.uWave, params.wave);
    gl!.uniform1f(u.uJitter, params.jitter);
    gl!.uniform1f(u.uAberration, params.aberration);
    gl!.uniform1f(u.uScanlines, params.scanlines);
    gl!.uniform1f(u.uGrain, params.grain);
    gl!.uniform1f(u.uSwitching, params.switching);
    gl!.uniform1f(u.uSwitchHeight, params.switchingHeight);
    gl!.uniform1f(u.uBarrel, params.barrel);
    gl!.uniform1f(u.uVignette, params.vignette);
    gl!.uniform1f(u.uSaturation, params.saturation);
    gl!.uniform1f(u.uExposure, params.exposure);

    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
  }

  function loop(now: number) {
    if (!running) return;
    draw(now);
    raf = requestAnimationFrame(loop);
  }

  return {
    setParams(next) {
      params = { ...params, ...next };
    },
    setSource(next) {
      source = next;
      uploaded = false;
    },
    start() {
      if (running || destroyed) return;
      running = true;
      raf = requestAnimationFrame(loop);
    },
    stop() {
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    },
    renderOnce() {
      if (destroyed) return;
      draw(performance.now());
    },
    resize,
    destroy() {
      if (destroyed) return;
      this.stop();
      destroyed = true;
      gl!.deleteTexture(tex);
      gl!.deleteBuffer(quad);
      gl!.deleteVertexArray(vao);
      gl!.deleteProgram(program);
      gl!.getExtension("WEBGL_lose_context")?.loseContext();
    },
  };
}
```

- [ ] **Step 4: Verify it type-checks and lints**

Run: `npm run tsc && npm run lint`
Expected: both pass with zero errors. There is no runtime test yet; Task 2 provides the first one, because a renderer needs a mounted canvas to be observable.

- [ ] **Step 5: Commit**

```bash
git add src/components/vhs/tapeRenderer.ts src/components/vhs/presets.ts
git commit -m "feat: add self-authored WebGL2 tape renderer and per-surface presets"
```

---

### Task 2: TapeSurface wrapper, proven on the 404 page

`TapeSurface` needs a real consumer to be testable, and the 404 is the simplest one: no texture, no source element, no interaction. Building both together gives the first end-to-end test.

**Files:**
- Create: `src/components/vhs/TapeSurface.tsx`
- Modify: `src/app/[locale]/not-found.tsx`
- Test: `tests/navigation/tape-effect.spec.ts`

**Interfaces:**
- Consumes: `createTapeRenderer`, `TapeParams`, `TapeSource` from `@/components/vhs/tapeRenderer`; `TAPE_PRESETS` from `@/components/vhs/presets`.
- Produces:
  ```ts
  interface TapeSurfaceProps {
    active: boolean;
    params: TapeParams;
    children?: React.ReactNode;
    className?: string;
    /** Crossfade duration in ms. Default 220. */
    fadeMs?: number;
    /** Internal render buffer height cap. Default 480. */
    maxHeight?: number;
  }
  export default function TapeSurface(props: TapeSurfaceProps): React.ReactElement;
  ```

- [ ] **Step 1: Write the failing test**

Create `tests/navigation/tape-effect.spec.ts`:

```ts
/**
 * VHS tape effect. Verifies the effect is decorative, degrades gracefully,
 * and respects reduced motion.
 *
 * Requires a running dev/preview server (BASE_URL env or http://localhost:3000).
 */

import { test, expect } from "@playwright/test";

test.describe("404 no-signal backdrop", () => {
  test("renders a decorative canvas that animates", async ({ page }) => {
    await page.goto("/this-route-does-not-exist", { waitUntil: "load" });

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
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright test tests/navigation/tape-effect.spec.ts --project=navigation-desktop`
Expected: FAIL. The first two tests fail on `toHaveCount(1)` because no `canvas[data-tape-canvas]` exists yet. The third test may already pass, which is fine: it is a regression guard.

- [ ] **Step 3: Create `src/components/vhs/TapeSurface.tsx`**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  createTapeRenderer,
  type TapeParams,
  type TapeRenderer,
  type TapeSource,
} from "./tapeRenderer";

interface TapeSurfaceProps {
  /** Whether the tape treatment is showing. Crossfades both ways. */
  active: boolean;
  params: TapeParams;
  /**
   * The real element to texture, normally an <img> or <video>. Omit for a
   * source-less surface (the 404 no-signal backdrop).
   */
  children?: React.ReactNode;
  className?: string;
  /** Crossfade duration in ms. */
  fadeMs?: number;
  /** Internal render buffer height cap. */
  maxHeight?: number;
}

/**
 * Overlays a WebGL tape effect on its children.
 *
 * The children stay in the DOM and in the accessibility tree at all times, so
 * alt text, SEO, next/image loading, video controls and audio are untouched.
 * When active they fade to opacity 0 and the canvas fades in. We use opacity
 * rather than display/visibility because hiding a <video> outright can stop
 * frame delivery in some browsers, and we need those frames as texture input.
 *
 * If WebGL2 is unavailable, createTapeRenderer returns null and the children
 * render completely untouched.
 */
export default function TapeSurface({
  active,
  params,
  children,
  className,
  fadeMs = 220,
  maxHeight = 480,
}: TapeSurfaceProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TapeRenderer | null>(null);
  const [ready, setReady] = useState(false);

  // Build the renderer once the canvas is mounted.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const source =
      (wrapper.querySelector("img, video") as TapeSource | null) ?? null;

    const renderer = createTapeRenderer(canvas, {
      source,
      params,
      maxHeight,
    });
    if (!renderer) return;
    rendererRef.current = renderer;
    setReady(true);

    const sync = () => {
      const rect = wrapper.getBoundingClientRect();
      renderer.resize(rect.width, rect.height);
    };
    sync();

    const ro = new ResizeObserver(sync);
    ro.observe(wrapper);

    return () => {
      ro.disconnect();
      renderer.destroy();
      rendererRef.current = null;
      setReady(false);
    };
    // params is applied separately below so changing a dial does not rebuild
    // the GL context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [maxHeight]);

  useEffect(() => {
    rendererRef.current?.setParams(params);
  }, [params]);

  // Run the loop only when active, on screen, and the tab is visible.
  // Under reduced motion, draw exactly one frame and never loop.
  useEffect(() => {
    const renderer = rendererRef.current;
    const wrapper = wrapperRef.current;
    if (!renderer || !wrapper || !ready) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let onScreen = true;

    const apply = () => {
      const shouldRun =
        active && onScreen && document.visibilityState === "visible";
      if (!shouldRun) {
        renderer.stop();
        return;
      }
      if (reduce.matches) {
        renderer.stop();
        renderer.renderOnce();
        return;
      }
      renderer.start();
    };

    const io = new IntersectionObserver((entries) => {
      onScreen = entries.some((e) => e.isIntersecting);
      apply();
    });
    io.observe(wrapper);

    document.addEventListener("visibilitychange", apply);
    reduce.addEventListener("change", apply);
    apply();

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", apply);
      reduce.removeEventListener("change", apply);
      renderer.stop();
    };
  }, [active, ready]);

  const showCanvas = ready && active;

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{ position: "relative" }}
      data-tape-surface=""
    >
      <div
        style={{
          transition: `opacity ${fadeMs}ms ease`,
          opacity: showCanvas ? 0 : 1,
        }}
      >
        {children}
      </div>
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        data-tape-canvas=""
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          transition: `opacity ${fadeMs}ms ease`,
          opacity: showCanvas ? 1 : 0,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Wire the 404 page**

Modify `src/app/[locale]/not-found.tsx`. Add the import and the backdrop as the first child of `<main>`. Keep everything else exactly as it is.

```tsx
import Link from "next/link";
import { useTranslations } from "next-intl";
import TapeSurface from "@/components/vhs/TapeSurface";
import { TAPE_PRESETS } from "@/components/vhs/presets";

export default function NotFound() {
  const t = useTranslations("notFound");

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      {/* Dead-channel backdrop. Sits behind the copy so nothing warps the text. */}
      <TapeSurface
        active
        params={TAPE_PRESETS.noSignal}
        className="pointer-events-none fixed inset-0 -z-10"
      />
      <h1 className="mb-4 font-posterman text-[72px] font-black leading-none md:text-[120px]">
        404
      </h1>
      <p className="mb-2 font-serif text-2xl font-semibold">{t("heading")}</p>
      <p className="mb-8 font-serif text-lg opacity-70">{t("description")}</p>
      <Link
        href="/"
        className="font-helvetica text-sm font-medium uppercase tracking-widest underline underline-offset-4 transition-opacity hover:opacity-70"
      >
        {t("backHome")}
      </Link>
    </main>
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx playwright test tests/navigation/tape-effect.spec.ts --project=navigation-desktop`
Expected: all three tests PASS.

If the "animates" test fails because both screenshots are identical black, the shader is producing nothing. Check the browser console for `[tape] shader compile failed` and fix the reported GLSL line before continuing. Do not proceed to Task 3 with a non-rendering shader.

- [ ] **Step 6: Verify types and lint**

Run: `npm run tsc && npm run lint`
Expected: both pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/vhs/TapeSurface.tsx "src/app/[locale]/not-found.tsx" tests/navigation/tape-effect.spec.ts
git commit -m "feat: add TapeSurface wrapper and 404 no-signal backdrop"
```

---

### Task 3: Homepage TV screen

Replace the three static CSS overlays with the shader. This is the surface where motion is the whole point, since the CSS overlays already do scanlines, vignette and chroma statically.

**Files:**
- Modify: `src/components/AboutSection.tsx` (the `AboutVideo` block around line 166, and the three overlay divs around lines 183-205)
- Test: `tests/navigation/tape-effect.spec.ts` (append)

**Interfaces:**
- Consumes: `TapeSurface` (default export) from `@/components/vhs/TapeSurface`; `TAPE_PRESETS` from `@/components/vhs/presets`.
- Produces: nothing consumed by later tasks.

- [ ] **Step 1: Write the failing test**

Append to `tests/navigation/tape-effect.spec.ts`:

```ts
test.describe("homepage TV screen", () => {
  test("the TV screen is taped and the video stays accessible", async ({
    page,
  }) => {
    await page.goto("/", { waitUntil: "load" });

    const screen = page.locator("[data-tape-surface]").first();
    await screen.scrollIntoViewIfNeeded();

    // The real video element is still in the DOM, so the mute toggle and
    // audio keep working.
    await expect(screen.locator("video")).toHaveCount(1);

    const canvas = screen.locator("canvas[data-tape-canvas]");
    await expect(canvas).toHaveAttribute("aria-hidden", "true");
    await expect(canvas).toHaveCSS("pointer-events", "none");
  });

  test("the old static CSS overlays are gone", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });
    // The repeating-linear-gradient scanline div is now a shader uniform.
    const legacy = page.locator(
      '[style*="repeating-linear-gradient(0deg, rgba(0,0,0,0.15)"]',
    );
    await expect(legacy).toHaveCount(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright test tests/navigation/tape-effect.spec.ts --project=navigation-desktop -g "homepage TV"`
Expected: FAIL. "the old static CSS overlays are gone" fails because the overlay div still exists.

- [ ] **Step 3: Wrap the video in `TapeSurface`**

In `src/components/AboutSection.tsx`, add these imports alongside the existing ones:

```tsx
import TapeSurface from "@/components/vhs/TapeSurface";
import { TAPE_PRESETS } from "@/components/vhs/presets";
```

Replace the `isVideoVisible ? (...) : (...)` block so the video branch is wrapped. Note that `group-hover:scale-105` moves off the video and onto the `TapeSurface` wrapper, so the canvas and the video scale together:

```tsx
{isVideoVisible ? (
  <TapeSurface
    active
    params={TAPE_PRESETS.tvScreen}
    /* Small screen area, so a small buffer is plenty. */
    maxHeight={256}
    className="absolute inset-0 h-full w-full transition-transform duration-300 group-hover:scale-105"
  >
    <AboutVideo
      src="/videos/about-tv.v2.mp4"
      poster="/videos/about-poster-tv.webp"
      autoPlay
      loop
      preload="auto"
      className="absolute inset-0 h-full w-full object-cover"
    />
  </TapeSurface>
) : (
  <Image
    src="/videos/about-poster-tv.webp"
    alt=""
    fill
    className="object-cover"
    sizes="(max-width: 767px) 40vw, 15vw"
  />
)}
```

- [ ] **Step 4: Delete the three CSS overlay divs**

Still in `src/components/AboutSection.tsx`, delete the entire `{/* CRT screen effect overlay */}` comment and the three sibling `<div aria-hidden="true" className="pointer-events-none absolute inset-0" ...>` elements that follow it (the `repeating-linear-gradient` scanlines, the `radial-gradient` vignette, and the `mix-blend-overlay` RGB stripe). The shader now supplies all three via the `scanlines`, `vignette` and `aberration` uniforms.

Leave the `{/* TV frame overlay on top */}` `<Image>` that follows them completely alone. That is the photographed TV bezel and it must still paint over the screen.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx playwright test tests/navigation/tape-effect.spec.ts --project=navigation-desktop`
Expected: all tests PASS, including the Task 2 ones.

- [ ] **Step 6: Verify types and lint**

Run: `npm run tsc && npm run lint`
Expected: both pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/AboutSection.tsx tests/navigation/tape-effect.spec.ts
git commit -m "feat: replace static CRT overlays with tape shader on homepage TV"
```

---

### Task 4: `/about` player, taped while paused

The homepage clip autoplays, so an idle-only treatment would never show there. The `/about` player is the lean-in watch where degrading the footage is a real cost, so the effect clears on play.

**Files:**
- Create: `src/components/TapedVideo.tsx`
- Modify: `src/app/[locale]/about/page.tsx` (the `media={...}` prop, around lines 40-47)
- Test: `tests/navigation/tape-effect.spec.ts` (append)

**Interfaces:**
- Consumes: `TapeSurface` from `@/components/vhs/TapeSurface`; `TAPE_PRESETS` from `@/components/vhs/presets`; existing `VideoPlayer` (default export, props `{ children: ReactNode; className?: string }`) and `AboutVideo` (default export) components.
- Produces: `export default function TapedVideo(): React.ReactElement` from `@/components/TapedVideo`.

- [ ] **Step 1: Write the failing test**

Append to `tests/navigation/tape-effect.spec.ts`:

```ts
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
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright test tests/navigation/tape-effect.spec.ts --project=navigation-desktop -g "/about player"`
Expected: FAIL. No `[data-tape-surface]` exists on `/about` yet.

- [ ] **Step 3: Create `src/components/TapedVideo.tsx`**

`VideoPlayer` keeps its `isPlaying` state private and we are deliberately not widening its API. Derive state from the video element's own events instead.

Because the video uses `preload="none"`, no video frames exist while paused, so we texture the **poster** as a real `<img>` rather than the video. The whole treatment fades out on play, so we never need a video texture at all and never touch decode.

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import AboutVideo from "@/components/AboutVideo";
import VideoPlayer from "@/components/VideoPlayer";
import TapeSurface from "@/components/vhs/TapeSurface";
import { TAPE_PRESETS } from "@/components/vhs/presets";

/**
 * The /about documentary player with a tape treatment on its paused state.
 *
 * The effect covers the poster while paused and clears the moment playback
 * starts, so the footage itself is never degraded. State is derived from the
 * video element's own play/pause/ended events, which leaves VideoPlayer's
 * API untouched.
 */
export default function TapedVideo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    const video = rootRef.current?.querySelector("video");
    if (!video) return;

    const onPlay = () => setPlaying(true);
    const onStop = () => setPlaying(false);

    video.addEventListener("play", onPlay);
    video.addEventListener("playing", onPlay);
    video.addEventListener("pause", onStop);
    video.addEventListener("ended", onStop);

    // Catch the case where playback already began before we attached.
    if (!video.paused) setPlaying(true);

    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("playing", onPlay);
      video.removeEventListener("pause", onStop);
      video.removeEventListener("ended", onStop);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative h-full w-full">
      <VideoPlayer className="h-full w-full">
        <AboutVideo
          src="/videos/about.v2.mp4"
          poster="/videos/about-poster.webp"
          preload="none"
          className="h-full w-full object-cover"
        />
      </VideoPlayer>

      {/*
       * The taped poster, layered over the player while paused. It is
       * pointer-events-none so the player's own controls stay clickable.
       */}
      <TapeSurface
        active={!playing}
        params={TAPE_PRESETS.poster}
        className="pointer-events-none absolute inset-0"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/videos/about-poster.webp"
          alt=""
          aria-hidden="true"
          className="h-full w-full object-cover"
        />
      </TapeSurface>
    </div>
  );
}
```

- [ ] **Step 4: Swap the `media` prop on the about page**

In `src/app/[locale]/about/page.tsx`, remove the `AboutVideo` and `VideoPlayer` imports (they now live in `TapedVideo`), add `import TapedVideo from "@/components/TapedVideo";`, and replace the whole `media={...}` value:

```tsx
media={<TapedVideo />}
```

The page stays a server component; `TapedVideo` carries its own `"use client"`.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx playwright test tests/navigation/tape-effect.spec.ts --project=navigation-desktop`
Expected: all tests PASS.

- [ ] **Step 6: Verify types and lint**

Run: `npm run tsc && npm run lint`
Expected: both pass.

- [ ] **Step 7: Commit**

```bash
git add src/components/TapedVideo.tsx "src/app/[locale]/about/page.tsx" tests/navigation/tape-effect.spec.ts
git commit -m "feat: tape the /about player poster and clear it on play"
```

---

### Task 5: Work carousel hover, on one shared canvas

The carousel duplicates its items for the infinite loop, so a `TapeSurface` per card would mean many GL contexts. Instead one pre-warmed canvas is re-parented into the hovered card. Because the canvas becomes a child of the card's motion div, it inherits that card's entrance and inertia transforms for free: no per-frame `getBoundingClientRect`, no lag during drift.

**Files:**
- Create: `src/components/vhs/carouselTapeStage.ts`
- Modify: `src/components/WorkSection.tsx` (the desktop `CarouselItem` component, around lines 513-537)
- Test: `tests/navigation/tape-effect.spec.ts` (append)

**Interfaces:**
- Consumes: `createTapeRenderer`, `TapeParams` from `./tapeRenderer`; `TAPE_PRESETS` from `./presets`.
- Produces:
  ```ts
  /** Build the context and compile the program ahead of first hover. */
  export function warmTapeStage(): void;
  /** Move the shared canvas into `host` and start texturing `source`. */
  export function acquireTapeStage(
    host: HTMLElement,
    source: HTMLImageElement,
    params: TapeParams,
  ): boolean;
  /** Release the stage if `host` currently owns it. */
  export function releaseTapeStage(host: HTMLElement): void;
  ```

- [ ] **Step 1: Write the failing test**

Append to `tests/navigation/tape-effect.spec.ts`:

```ts
test.describe("work carousel hover", () => {
  test("hovering a card tapes it, leaving restores it", async ({ page }) => {
    await page.goto("/", { waitUntil: "load" });

    const card = page.locator("[data-carousel-item]").first();
    await card.scrollIntoViewIfNeeded();
    // Let the entrance animation and idle pre-warm settle.
    await page.waitForTimeout(1200);

    const stage = page.locator("canvas[data-tape-stage]");
    await expect(stage).toHaveCount(0);

    await card.hover();
    await expect(stage).toHaveCount(1);
    await expect(stage).toHaveAttribute("aria-hidden", "true");
    // The stage is inside the hovered card, so it inherits its transforms.
    expect(
      await card.locator("canvas[data-tape-stage]").count(),
    ).toBe(1);

    // The card's own image keeps its alt text regardless.
    await expect(card.locator("img")).toHaveAttribute("alt", /.*/);

    await page.mouse.move(0, 0);
    await expect(stage).toHaveCount(0);
    await expect(card.locator("img")).toHaveCSS("opacity", "1");
  });

  test("touch devices get clean images and no stage", async ({ browser }) => {
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
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx playwright test tests/navigation/tape-effect.spec.ts --project=navigation-desktop -g "work carousel"`
Expected: FAIL. Hovering produces no `canvas[data-tape-stage]`.

- [ ] **Step 3: Create `src/components/vhs/carouselTapeStage.ts`**

```ts
import { createTapeRenderer, type TapeParams, type TapeRenderer } from "./tapeRenderer";
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
  const img = host.querySelector("img");
  if (img) img.style.opacity = "1";
  canvas.remove();
  owner = null;
}
```

- [ ] **Step 4: Wire the desktop carousel item**

In `src/components/WorkSection.tsx`, add the imports:

```tsx
import {
  acquireTapeStage,
  releaseTapeStage,
  warmTapeStage,
} from "@/components/vhs/carouselTapeStage";
import { TAPE_PRESETS } from "@/components/vhs/presets";
```

In the desktop `CarouselItem` component (the one rendering `data-carousel-item` and using `scope`), add a pre-warm effect and the two pointer handlers. Add this effect next to the existing ones:

```tsx
// Pre-warm the shared GL context once the carousel is on screen, so the
// first hover has no shader-compile stall. Desktop pointers only.
useEffect(() => {
  if (!isVisible) return;
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  const idle =
    window.requestIdleCallback?.(() => warmTapeStage()) ??
    window.setTimeout(() => warmTapeStage(), 400);
  return () => {
    if (window.cancelIdleCallback) window.cancelIdleCallback(idle as number);
    else window.clearTimeout(idle as number);
  };
}, [isVisible]);
```

Then put the handlers on the `motion.div` that carries `data-carousel-item`:

```tsx
onPointerEnter={(e) => {
  if (e.pointerType !== "mouse") return;
  const host = e.currentTarget as HTMLElement;
  const img = host.querySelector("img");
  if (img) acquireTapeStage(host, img, TAPE_PRESETS.hover);
}}
onPointerLeave={(e) => {
  releaseTapeStage(e.currentTarget as HTMLElement);
}}
```

The `motion.div` already has `className="... rounded-lg overflow-hidden ..."` and `style={{ y: combinedY }}`. Since the canvas is `position: absolute` and the div is not positioned, add `relative` to that `className` so the canvas is placed against the card rather than an ancestor.

Leave `MobileWorkSection` completely untouched. The `pointerType !== "mouse"` guard and the media query together keep touch devices clean.

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx playwright test tests/navigation/tape-effect.spec.ts --project=navigation-desktop`
Expected: all tests PASS.

- [ ] **Step 6: Verify types and lint**

Run: `npm run tsc && npm run lint`
Expected: both pass. If `requestIdleCallback` types are missing under strict mode, narrow with `(window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback` rather than adding a global declaration file.

- [ ] **Step 7: Commit**

```bash
git add src/components/vhs/carouselTapeStage.ts src/components/WorkSection.tsx tests/navigation/tape-effect.spec.ts
git commit -m "feat: tape work carousel cards on desktop hover via one shared canvas"
```

---

### Task 6: Performance verification and preset tuning

The spec makes performance a blocker, not a footnote. This task proves it and then tunes the look.

**Files:**
- Modify: `src/components/vhs/presets.ts` (tuned numbers only)
- Possibly modify: any surface's `maxHeight` if the budget demands it

**Interfaces:**
- Consumes: everything from Tasks 1 to 5.
- Produces: nothing.

- [ ] **Step 1: Run the full existing suite to check for regressions**

Run: `npm run test:perf`
Expected: PASS, within the existing `THRESHOLDS` in `tests/performance/vitals.spec.ts` (LCP 2500ms, FCP 1800ms, CLS 0.1).

If CLS regressed, the likely cause is `TapeSurface`'s wrapper div changing layout. Fix it by making the wrapper inherit the child's sizing rather than by relaxing the threshold. **Never loosen an existing threshold to make this pass.**

- [ ] **Step 2: Run the navigation suites**

Run: `npm run test:nav`
Expected: PASS. These run WebKit, which is the real check that the effect works outside Chrome, the exact failure mode that made the original component unusable.

- [ ] **Step 3: Run the scroll-colour suites**

Run: `npx playwright test --project=scroll-colors-desktop --project=scroll-colors-webkit`
Expected: PASS. The `AboutSection` edit touched a component involved in the scroll-colour system, so this guards against collateral damage.

- [ ] **Step 4: Run Lighthouse CI**

Run: `npm run lhci`
Expected: PASS against `lighthouserc.js`. If the performance score dropped, reduce `maxHeight` on the offending surface (the TV screen is already 256; the carousel stage is 360) before touching anything else.

- [ ] **Step 5: Visually tune the presets**

Write a throwaway Playwright script in the scratchpad (do not commit it) that screenshots each of the four surfaces at 1280x800 and at 390x844:

- `/` with the TV screen scrolled into view
- `/` with a carousel card hovered
- `/about` paused
- `/this-route-does-not-exist`

Review the screenshots and adjust `TAPE_PRESETS` numbers. Judgement calls, in order of likely need:
- The TV screen must stay legible behind the photographed bezel. If the video content is muddy, lower `grain` and `scanlines` before touching `exposure`.
- The 404 must read as a dead channel, not a black rectangle. If it looks flat, raise `grain` and `switching`.
- The hover state must be recognisable within the ~220ms crossfade. If it reads as a plain blur, raise `aberration` and `jitter`.
- If any surface shows hard black wedges in the corners, `barrel` is too high for that aspect ratio; reduce it.

- [ ] **Step 6: Re-run the full suite after tuning**

Run: `npm run test:perf && npm run test:nav && npx playwright test tests/navigation/tape-effect.spec.ts --project=navigation-desktop`
Expected: all PASS.

- [ ] **Step 7: Final type-check and lint**

Run: `npm run tsc && npm run lint`
Expected: both pass.

- [ ] **Step 8: Commit**

```bash
git add src/components/vhs/presets.ts
git commit -m "tune: adjust tape presets after visual and performance review"
```

---

## Verification Summary

Before declaring the feature done, all of these must have been run and passed, with output seen:

- [ ] `npm run tsc` (zero errors)
- [ ] `npm run lint` (zero errors)
- [ ] `npm run test:perf` (existing thresholds unchanged)
- [ ] `npm run test:nav` (includes WebKit, the cross-browser proof)
- [ ] `npx playwright test --project=scroll-colors-desktop --project=scroll-colors-webkit`
- [ ] `npm run lhci`
- [ ] `npx playwright test tests/navigation/tape-effect.spec.ts --project=navigation-desktop`
- [ ] `grep -rn "—" src/components/vhs src/components/TapedVideo.tsx` returns nothing (no em dashes)

## Out of Scope

- `YouTubeEmbed` videos on work and blog detail pages. Cross-origin iframes cannot be textured.
- The mobile work carousel and the `DetailPage` hero image. Both considered and declined.
- Any change to `NoiseOverlay` or `GlitchText`.
- Any viewer-facing toggle for the effect.
