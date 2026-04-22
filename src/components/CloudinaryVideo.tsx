"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import { Cloudinary } from "@cloudinary/url-gen";
import { AdvancedVideo } from "@cloudinary/react";
import VolumeIcon from "@/components/icons/VolumeIcon";

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
        <VolumeIcon muted={isMuted} className="h-4 w-4" />
      </button>
    </div>
  );
}
