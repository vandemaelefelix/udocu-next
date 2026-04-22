"use client";

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from "react";
import VolumeIcon from "@/components/icons/VolumeIcon";

interface VideoPlayerProps {
  /** The <video> or <AdvancedVideo> element to render */
  children: ReactNode;
  className?: string;
}

/**
 * Reusable custom video-player wrapper.
 *
 * Wraps any child that ultimately renders an HTML `<video>` element and adds:
 * - No autoplay — the video starts paused with a large centered play button.
 * - Custom controls (play/pause, mute/unmute, progress scrubber) that appear
 *   while the video is playing or on hover.
 *
 * Colours inherit `currentColor` so the controls match the page's text colour.
 */
export default function VideoPlayer({
  children,
  className = "",
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showControls, setShowControls] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const hideTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── helpers ───────────────────────────────────────────────────────
  const getVideo = useCallback(
    () => containerRef.current?.querySelector("video") ?? null,
    [],
  );

  // ─── play / pause ─────────────────────────────────────────────────
  const play = useCallback(() => {
    const v = getVideo();
    if (!v) return;

    // On first play, disable the autoPlay/loop attributes the
    // CloudinaryVideo component may have set, unmute, and restart.
    if (!hasStarted) {
      v.autoplay = false;
      v.loop = false;
      v.currentTime = 0;
      v.muted = false;
      setIsMuted(false);
      setHasStarted(true);
    }

    v.play();
  }, [getVideo, hasStarted]);

  const pause = useCallback(() => {
    getVideo()?.pause();
  }, [getVideo]);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  // ─── mute / unmute ────────────────────────────────────────────────
  const toggleMute = useCallback(
    (e: ReactMouseEvent) => {
      e.stopPropagation();
      const v = getVideo();
      if (!v) return;
      v.muted = !v.muted;
      setIsMuted(v.muted);
    },
    [getVideo],
  );

  // ─── progress tracking ────────────────────────────────────────────
  useEffect(() => {
    const v = getVideo();
    if (!v) return;

    // Ensure the video starts paused & muted
    v.pause();
    v.muted = true;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onTimeUpdate = () => {
      if (v.duration) setProgress(v.currentTime / v.duration);
    };

    v.addEventListener("play", onPlay);
    v.addEventListener("pause", onPause);
    v.addEventListener("ended", onEnded);
    v.addEventListener("timeupdate", onTimeUpdate);

    return () => {
      v.removeEventListener("play", onPlay);
      v.removeEventListener("pause", onPause);
      v.removeEventListener("ended", onEnded);
      v.removeEventListener("timeupdate", onTimeUpdate);
    };
  }, [getVideo]);

  // ─── scrubber drag ────────────────────────────────────────────────
  const seek = useCallback(
    (clientX: number) => {
      const bar = progressBarRef.current;
      const v = getVideo();
      if (!bar || !v || !v.duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (clientX - rect.left) / rect.width),
      );
      v.currentTime = ratio * v.duration;
      setProgress(ratio);
    },
    [getVideo],
  );

  const onProgressDown = useCallback(
    (e: ReactMouseEvent) => {
      e.stopPropagation();
      setIsDragging(true);
      seek(e.clientX);
    },
    [seek],
  );

  useEffect(() => {
    if (!isDragging) return;

    const onMove = (e: globalThis.MouseEvent) => seek(e.clientX);
    const onUp = () => setIsDragging(false);

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isDragging, seek]);

  // ─── auto-hide controls ───────────────────────────────────────────
  const scheduleHide = useCallback(() => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => {
      if (!isDragging) setShowControls(false);
    }, 2500);
  }, [isDragging]);

  const onMouseMove = useCallback(() => {
    if (isPlaying) {
      setShowControls(true);
      scheduleHide();
    }
  }, [isPlaying, scheduleHide]);

  const onMouseLeave = useCallback(() => {
    if (isPlaying && !isDragging) setShowControls(false);
  }, [isPlaying, isDragging]);

  // Show controls on hover while playing, or always when paused after first play
  const controlsVisible =
    (isPlaying && showControls) || (hasStarted && !isPlaying);

  // ─── render ───────────────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={`relative cursor-pointer select-none overflow-hidden ${className}`}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      onClick={togglePlay}
    >
      {/* Video child */}
      {children}

      {/* ── Large centered play button (shown only before first play) ── */}
      {!hasStarted && (
        <button
          type="button"
          aria-label="Play video"
          className="absolute inset-0 z-10 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            play();
          }}
        >
          <svg
            viewBox="0 0 100 100"
            className="h-24 w-24 drop-shadow-lg md:h-32 md:w-32"
          >
            <polygon
              points="30,15 30,85 82,50"
              fill="currentColor"
              fillOpacity={0.55}
            />
          </svg>
        </button>
      )}

      {/* ── Bottom controls bar (shown when playing + hovering) ── */}
      <div
        className={`absolute inset-x-0 bottom-0 z-20 flex items-end gap-4 px-4 pb-4 pt-16 transition-opacity duration-300 ${
          controlsVisible
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0"
        }`}
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 100%)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Play / Pause */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          aria-label={isPlaying ? "Pause" : "Play"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-current transition-colors hover:bg-white/10"
        >
          {isPlaying ? (
            /* Pause icon */
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            /* Play icon */
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5 translate-x-[1px]"
              fill="currentColor"
            >
              <polygon points="8,4 20,12 8,20" />
            </svg>
          )}
        </button>

        {/* Mute / Unmute */}
        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute" : "Mute"}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-current transition-colors hover:bg-white/10"
        >
          <VolumeIcon muted={isMuted} className="h-5 w-5" />
        </button>

        {/* Progress bar */}
        <div
          ref={progressBarRef}
          className="relative flex h-10 flex-1 cursor-pointer items-center"
          onMouseDown={onProgressDown}
        >
          {/* Track background */}
          <div className="h-[2px] w-full rounded-full bg-current opacity-40" />

          {/* Track fill */}
          <div
            className="absolute left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-current"
            style={{ width: `${progress * 100}%` }}
          />

          {/* Scrubber handle */}
          <div
            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-current shadow-md"
            style={{ left: `${progress * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
