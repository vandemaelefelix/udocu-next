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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
