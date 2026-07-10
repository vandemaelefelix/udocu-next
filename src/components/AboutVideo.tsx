"use client";

interface AboutVideoProps {
  /** Video source. Defaults to the full-quality About video. */
  src?: string;
  /** Poster frame shown before the video loads / plays. */
  poster?: string;
  className?: string;
  style?: React.CSSProperties;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  /**
   * How much to preload. Use "none" for click-to-play surfaces so the file
   * only downloads when the viewer actually starts it.
   */
  preload?: "none" | "metadata" | "auto";
}

/**
 * Self-hosted About video (served from `/public/videos`, delivered via the
 * Vercel CDN). Drop-in replacement for the former Cloudinary-backed video:
 * renders a plain `<video>` so the surrounding `VideoPlayer` custom controls
 * and the AboutSection mute toggle keep working via `querySelector("video")`.
 */
export default function AboutVideo({
  src = "/videos/about.mp4",
  poster,
  className = "h-full w-full object-cover",
  style,
  autoPlay = false,
  loop = false,
  muted = true,
  preload = "metadata",
}: AboutVideoProps) {
  return (
    <video
      src={src}
      poster={poster}
      autoPlay={autoPlay}
      loop={loop}
      muted={muted}
      playsInline
      preload={preload}
      className={className}
      style={style}
    />
  );
}
