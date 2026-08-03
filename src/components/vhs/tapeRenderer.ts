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
  /**
   * Scanline count across the full frame height, independent of the
   * internal buffer resolution (real VHS is roughly 240 to 480 lines).
   * Tying this to `uRes.y` instead, as an earlier version did, makes the
   * period 1 buffer pixel: fine at large buffer sizes, but at a small
   * buffer (e.g. the homepage TV screen) that pattern aliases into flat
   * grey once the canvas is upscaled by CSS.
   */
  scanlineLines: number;
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
  /** Whether the current source has decoded enough to be worth uploading. */
  sourceReady(): boolean;
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
// Maps a [0,1] output coordinate into the source, cropping to the same
// centred window CSS object-fit: cover would pick. Without it the full source
// rect stretched onto the full canvas, distorting every surface whose aspect
// ratio differs from its source. See coverUvTransform.
uniform vec2  uUvScale;
uniform vec2  uUvOffset;
uniform float uTime;
uniform float uWave;
uniform float uJitter;
uniform float uAberration;
uniform float uScanlines;
uniform float uScanlineLines;
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

/** Output coordinate to source coordinate, cover-cropped. */
vec2 srcUv(vec2 p) {
  return p * uUvScale + uUvOffset;
}

void main() {
  vec2 uv = vUv;

  // Tube curvature, overscanned.
  //
  // The warp pushes samples outward by up to 1.0 + uBarrel * 0.5, reached at
  // the corners, so every pixel on the outermost ring of the output landed
  // outside the source rect. Those pixels used to be zeroed and forced
  // opaque, which drew a hard black frame around every curved surface.
  // Dividing by the corner factor pulls the whole warped range back inside
  // the frame: the same bulge, but no out-of-frame region to paint.
  if (uBarrel > 0.0) {
    vec2 c = uv * 2.0 - 1.0;
    float k = uBarrel * 0.25;
    c *= (1.0 + k * dot(c, c)) / (1.0 + 2.0 * k);
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

  // No out-of-frame masking. The barrel warp above is overscanned, and the
  // wave, jitter and head-switch displacements only ever push a hair past the
  // edge, where CLAMP_TO_EDGE smears the edge pixel. Smear is both closer to
  // what tape does and preferable to the black slivers a mask produced.
  vec3 col;
  float alpha;
  if (uHasTex > 0.5) {
    float ab = uAberration / max(uRes.x, 1.0);
    col = vec3(
      texture(uTex, srcUv(uv + vec2(ab, 0.0))).r,
      texture(uTex, srcUv(uv)).g,
      texture(uTex, srcUv(uv - vec2(ab, 0.0))).b
    );
    alpha = texture(uTex, srcUv(uv)).a;
  } else {
    // No content: a dead channel, opaque so it reads as a lit but empty tube.
    col = vec3(0.0);
    alpha = 1.0;
  }

  // AC beat rolling down the frame.
  col *= 1.0 + 0.05 * sin(uv.y * 6.2831853 - uTime * 1.7);

  // Animated grain.
  col += (hash(uv * uRes + vec2(uTime * 91.7, uTime * 47.3)) - 0.5) * uGrain;

  // Scanlines. Frequency is fixed per uScanlineLines rather than derived
  // from uRes.y, so the pattern reads the same whether the buffer behind it
  // is tiny (homepage TV) or large (the /about poster).
  float scanLine = uv.y * uScanlineLines;
  col *= 1.0 - uScanlines * (0.5 + 0.5 * sin(scanLine * 3.14159265));

  // Head-switch static is bright, not just displaced.
  float staticAmt = clamp(band * uSwitching * 3.0, 0.0, 1.0);
  col = mix(col, vec3(sn), staticAmt);
  alpha = max(alpha, staticAmt);

  // Vignette, measured on the unwarped coordinate so it stays centred.
  vec2 vd = (vUv - 0.5) * vec2(uRes.x / max(uRes.y, 1.0), 1.0);
  col *= 1.0 - uVignette * smoothstep(0.4, 1.1, length(vd));

  col = mix(vec3(dot(col, vec3(0.299, 0.587, 0.114))), col, uSaturation);
  col *= uExposure;

  outColor = vec4(col, alpha);
}`;

const UNIFORM_NAMES = [
  "uTex",
  "uHasTex",
  "uRes",
  "uUvScale",
  "uUvOffset",
  "uTime",
  "uWave",
  "uJitter",
  "uAberration",
  "uScanlines",
  "uScanlineLines",
  "uGrain",
  "uSwitching",
  "uSwitchHeight",
  "uBarrel",
  "uVignette",
  "uSaturation",
  "uExposure",
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

export interface CoverUvTransform {
  scaleX: number;
  scaleY: number;
  offsetX: number;
  offsetY: number;
}

const IDENTITY_UV: CoverUvTransform = {
  scaleX: 1,
  scaleY: 1,
  offsetX: 0,
  offsetY: 0,
};

/**
 * Replicates CSS `object-fit: cover` in texture space: the largest centred
 * crop of the source that matches the destination's aspect ratio, expressed as
 * the scale and offset that map a [0,1] destination coordinate into it.
 *
 * The effect always covers an element that is itself `object-fit: cover`, so
 * without this the shader distorted anything whose source aspect ratio
 * differed from its box. The homepage TV was the worst case: a 16:9 video
 * squeezed to 67% of its width by a roughly 1.2:1 screen aperture.
 *
 * Returns the identity for any non-positive dimension, which is what a
 * <video> reports before metadata arrives and an <img> before it loads.
 */
export function coverUvTransform(
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number,
): CoverUvTransform {
  if (srcW <= 0 || srcH <= 0 || dstW <= 0 || dstH <= 0) return IDENTITY_UV;

  const srcAspect = srcW / srcH;
  const dstAspect = dstW / dstH;
  if (srcAspect > dstAspect) {
    // Source is wider than the box: crop the sides.
    const scaleX = dstAspect / srcAspect;
    return { scaleX, scaleY: 1, offsetX: (1 - scaleX) / 2, offsetY: 0 };
  }
  // Source is taller than the box (or matches): crop top and bottom.
  const scaleY = srcAspect / dstAspect;
  return { scaleX: 1, scaleY, offsetX: 0, offsetY: (1 - scaleY) / 2 };
}

/**
 * Creates a tape renderer drawing to `canvas`, texturing `opts.source`.
 * Returns null when WebGL2 is unavailable or the program fails to build, in
 * which case the caller must render its content untouched.
 */
export function createTapeRenderer(
  canvas: HTMLCanvasElement,
  opts: {
    source: TapeSource;
    params: TapeParams;
    maxHeight?: number;
    /**
     * Called when the GL context is lost (GPU process crash, driver reset,
     * mobile Safari reclaiming memory in a backgrounded tab). GL calls become
     * no-ops after this fires, so the caller must stop treating the canvas as
     * live: stop showing it and let the real element fade back in. We do not
     * call preventDefault() on the underlying event and do not implement
     * webglcontextrestored recovery, so this loss is permanent for the life
     * of this renderer; graceful degradation, not recovery, is the contract.
     */
    onContextLost?: () => void;
  },
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
    gl.SRC_ALPHA,
    gl.ONE_MINUS_SRC_ALPHA,
    gl.ONE,
    gl.ONE_MINUS_SRC_ALPHA,
  );

  const maxHeight = opts.maxHeight ?? 480;
  let params: TapeParams = { ...opts.params };
  let source: TapeSource = opts.source;
  let uploaded = false;
  let running = false;
  let raf = 0;
  let startedAt = 0;
  let destroyed = false;

  function handleContextLost() {
    // Deliberately not calling preventDefault(): we do not implement
    // webglcontextrestored recovery, so the context loss stays permanent for
    // this renderer's lifetime. Letting the default proceed is correct.
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    opts.onContextLost?.();
  }
  canvas.addEventListener("webglcontextlost", handleContextLost);

  function sourceReady(): boolean {
    if (!source) return false;
    if (isVideo(source)) return source.readyState >= 2;
    return source.complete && source.naturalWidth > 0;
  }

  /**
   * The source's intrinsic pixel size, which is what texImage2D uploads. The
   * element's CSS box is irrelevant here: a `fill` next/image or a
   * `h-full w-full` video is laid out at the box size but still textures at
   * its own resolution.
   */
  function sourceSize(): { w: number; h: number } | null {
    if (!source) return null;
    if (isVideo(source)) {
      return source.videoWidth > 0
        ? { w: source.videoWidth, h: source.videoHeight }
        : null;
    }
    return source.naturalWidth > 0
      ? { w: source.naturalWidth, h: source.naturalHeight }
      : null;
  }

  function uploadTexture() {
    if (!source || !sourceReady()) return;
    // A still image only needs uploading once; video needs every frame.
    if (uploaded && !isVideo(source)) return;
    gl!.bindTexture(gl!.TEXTURE_2D, tex);
    gl!.pixelStorei(gl!.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl!.texImage2D(
      gl!.TEXTURE_2D,
      0,
      gl!.RGBA,
      gl!.RGBA,
      gl!.UNSIGNED_BYTE,
      source,
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

    const size = sourceSize();
    const fit = size
      ? coverUvTransform(size.w, size.h, canvas.width, canvas.height)
      : IDENTITY_UV;
    gl!.uniform2f(u.uUvScale, fit.scaleX, fit.scaleY);
    gl!.uniform2f(u.uUvOffset, fit.offsetX, fit.offsetY);

    gl!.uniform1f(u.uTime, t);
    gl!.uniform1f(u.uWave, params.wave);
    gl!.uniform1f(u.uJitter, params.jitter);
    gl!.uniform1f(u.uAberration, params.aberration);
    gl!.uniform1f(u.uScanlines, params.scanlines);
    gl!.uniform1f(u.uScanlineLines, params.scanlineLines);
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
    sourceReady,
    resize,
    destroy() {
      if (destroyed) return;
      this.stop();
      destroyed = true;
      canvas.removeEventListener("webglcontextlost", handleContextLost);
      // Deliberately not calling WEBGL_lose_context's loseContext() here.
      // Under React StrictMode, the dev double-mount's cleanup would poison
      // the context, and the remount's getContext("webgl2") would return
      // that same lost context, killing the effect in `next dev` while it
      // worked fine in production. Deleting the GL resources below is
      // sufficient; the browser reclaims the context once the canvas is
      // unreachable.
      gl!.deleteTexture(tex);
      gl!.deleteBuffer(quad);
      gl!.deleteVertexArray(vao);
      gl!.deleteProgram(program);
    },
  };
}
