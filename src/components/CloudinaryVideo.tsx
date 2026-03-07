"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedVideo } from "@cloudinary/react";

const cloudName = (process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "").trim();
const videoPublicId = (
  process.env.NEXT_PUBLIC_CLOUDINARY_VIDEO_ID ?? ""
).trim();

interface CloudinaryVideoProps {
  className?: string;
  style?: React.CSSProperties;
  muted?: boolean;
  showMuteToggle?: boolean;
}

export default function CloudinaryVideo({
  className = "h-full w-full object-cover",
  style,
  muted = true,
  showMuteToggle = false,
}: CloudinaryVideoProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(muted);

  const cld = useMemo(
    () =>
      cloudName
        ? new Cloudinary({
            cloud: { cloudName },
            url: { secure: true },
          })
        : null,
    [],
  );

  const video = useMemo(
    () =>
      cld && videoPublicId
        ? cld.video(videoPublicId).quality("auto").format("auto")
        : null,
    [cld],
  );

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const videoEl = containerRef.current?.querySelector("video");
    if (videoEl) {
      videoEl.muted = !videoEl.muted;
      setIsMuted(videoEl.muted);
    }
  }, []);

  if (!video) return null;

  if (!showMuteToggle) {
    return (
      <AdvancedVideo
        cldVid={video}
        autoPlay
        loop
        muted={muted}
        playsInline
        className={className}
        style={style}
      />
    );
  }

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <AdvancedVideo
        cldVid={video}
        autoPlay
        loop
        muted={muted}
        playsInline
        className={className}
        style={style}
      />
      <button
        type="button"
        onClick={toggleMute}
        className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
        aria-label={isMuted ? "Unmute" : "Mute"}
      >
        {isMuted ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <line x1="23" y1="9" x2="17" y2="15" />
            <line x1="17" y1="9" x2="23" y2="15" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <path d="M11 5L6 9H2v6h4l5 4V5z" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
          </svg>
        )}
      </button>
    </div>
  );
}
