"use client";

import { useEffect, useRef, useState } from "react";
import {
  createTapeRenderer,
  type TapeParams,
  type TapeRenderer,
  type TapeSource,
} from "./tapeRenderer";
import { lerpTapeParams } from "./presets";
import { advanceRamp, easeTapeRamp } from "./ramp";

interface TapeSurfaceProps {
  /** Whether the tape treatment is showing. Crossfades both ways. */
  active: boolean;
  /** The resting look. */
  params: TapeParams;
  /**
   * The look to ramp toward while `hovered`. Omit for a surface with a single
   * fixed look, in which case `hovered` is ignored.
   */
  hoverParams?: TapeParams;
  hovered?: boolean;
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
  /**
   * Extra inline styles for the wrapper, merged after the default
   * `position: relative` so callers can override it (e.g. a fixed
   * full-bleed backdrop).
   */
  style?: React.CSSProperties;
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
  hoverParams,
  hovered = false,
  children,
  className,
  fadeMs = 220,
  maxHeight = 480,
  style,
}: TapeSurfaceProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rendererRef = useRef<TapeRenderer | null>(null);
  const sourceRef = useRef<TapeSource>(null);
  const [ready, setReady] = useState(false);

  // Build the renderer once the canvas is mounted.
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const source =
      (wrapper.querySelector("img, video") as TapeSource | null) ?? null;
    sourceRef.current = source;

    const renderer = createTapeRenderer(canvas, {
      source,
      params,
      maxHeight,
      // A GPU-process crash or driver reset (routine on mobile under memory
      // pressure) leaves GL calls as no-ops and the canvas transparent, with
      // no automatic signal to React. Without this, `showCanvas` would stay
      // true forever and the real content would never fade back in.
      onContextLost: () => setReady(false),
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

  // Sole writer of params, so nothing fights the ramp.
  //
  // The ramp runs on its own requestAnimationFrame rather than through React
  // state: easing through state would re-render this component, and the video
  // subtree under it, on every frame of every hover.
  const rampRef = useRef(0);
  useEffect(() => {
    const renderer = rendererRef.current;
    if (!renderer) return;

    if (!hoverParams) {
      renderer.setParams(params);
      return;
    }

    const target = hovered ? 1 : 0;
    const apply = () =>
      renderer.setParams(
        lerpTapeParams(params, hoverParams, easeTapeRamp(rampRef.current)),
      );

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // The destination, not the journey. renderOnce covers the case where the
      // draw loop is stopped, which under reduced motion it always is.
      rampRef.current = target;
      apply();
      renderer.renderOnce();
      return;
    }

    let raf = 0;
    let last = 0;
    const step = (now: number) => {
      const dt = last === 0 ? 16 : now - last;
      last = now;
      rampRef.current = advanceRamp(rampRef.current, target, dt);
      apply();
      if (rampRef.current !== target) raf = requestAnimationFrame(step);
      else raf = 0;
    };
    raf = requestAnimationFrame(step);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [params, hoverParams, hovered, ready]);

  // Run the loop only when active, on screen, and the tab is visible.
  // Under reduced motion, draw exactly one frame and never loop.
  useEffect(() => {
    const renderer = rendererRef.current;
    const wrapper = wrapperRef.current;
    if (!renderer || !wrapper || !ready) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let onScreen = true;

    // Reduced motion draws exactly one frame and never loops, so if that
    // frame lands before the source has decoded anything (readyState < 2 for
    // a fresh <video>, or a not-yet-loaded <img>), it draws the shader's
    // no-content branch and that empty frame is permanent: nothing ever
    // triggers a repaint. Wait for the source's own readiness event instead.
    let pendingSourceCleanup: (() => void) | null = null;
    const clearPendingSourceListener = () => {
      pendingSourceCleanup?.();
      pendingSourceCleanup = null;
    };

    const apply = () => {
      const shouldRun =
        active && onScreen && document.visibilityState === "visible";
      if (!shouldRun) {
        clearPendingSourceListener();
        renderer.stop();
        return;
      }
      if (reduce.matches) {
        renderer.stop();
        if (renderer.sourceReady()) {
          clearPendingSourceListener();
          renderer.renderOnce();
          return;
        }
        if (pendingSourceCleanup) {
          // Already waiting on a readiness event from an earlier apply();
          // nothing more to do until it fires.
          return;
        }
        const source = sourceRef.current;
        if (!source) {
          // Source-less surface (the 404 backdrop): nothing to wait for.
          renderer.renderOnce();
          return;
        }
        const eventName =
          source instanceof HTMLVideoElement ? "loadeddata" : "load";
        const onSourceReady = () => {
          clearPendingSourceListener();
          renderer.renderOnce();
        };
        source.addEventListener(eventName, onSourceReady, { once: true });
        pendingSourceCleanup = () =>
          source.removeEventListener(eventName, onSourceReady);
        return;
      }
      clearPendingSourceListener();
      renderer.start();
    };

    const io = new IntersectionObserver((entries) => {
      onScreen = entries.some((e) => e.isIntersecting);
      apply();
    });
    io.observe(wrapper);

    document.addEventListener("visibilitychange", apply);
    reduce.addEventListener("change", apply);
    // Do not call apply() here: IntersectionObserver always fires once
    // asynchronously with the initial state right after observe(), and it
    // already runs apply(). Calling it again here would draw a second,
    // differently-timed frame, which breaks the reduced-motion contract of
    // "exactly one frame" (renderOnce() reads a fresh timestamp every call).

    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", apply);
      reduce.removeEventListener("change", apply);
      clearPendingSourceListener();
      renderer.stop();
    };
  }, [active, ready]);

  const showCanvas = ready && active;

  return (
    <div
      ref={wrapperRef}
      className={className}
      style={{ position: "relative", ...style }}
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
