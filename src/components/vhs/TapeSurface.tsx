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
  children,
  className,
  fadeMs = 220,
  maxHeight = 480,
  style,
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
    // Do not call apply() here: IntersectionObserver always fires once
    // asynchronously with the initial state right after observe(), and it
    // already runs apply(). Calling it again here would draw a second,
    // differently-timed frame, which breaks the reduced-motion contract of
    // "exactly one frame" (renderOnce() reads a fresh timestamp every call).

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
