"use client";

import { socialLinks } from "@/config/social";
import {
  FacebookIcon,
  InstagramIcon,
  YouTubeIcon,
} from "@/components/SocialIcons";
import { type SVGProps, type ReactNode } from "react";
import { usePostHog } from "posthog-js/react";

const iconMap: Record<string, (props: SVGProps<SVGSVGElement>) => ReactNode> = {
  Facebook: FacebookIcon,
  Instagram: InstagramIcon,
  YouTube: YouTubeIcon,
};

interface SocialLinksProps {
  className?: string;
  iconClassName?: string;
  iconSize?: number;
}

export default function SocialLinks({
  className = "flex gap-4",
  iconClassName = "h-5 w-5 transition-opacity hover:opacity-70",
  iconSize,
}: SocialLinksProps) {
  const posthog = usePostHog();

  return (
    <div className={className}>
      {socialLinks.map(({ platform, url }) => {
        const Icon = iconMap[platform];
        if (!Icon) return null;

        return (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={platform}
            className="transition-opacity hover:opacity-70 focus-visible:opacity-70 focus-visible:outline-none"
            onClick={() => posthog.capture("social_link_clicked", { platform })}
          >
            <Icon
              className={iconSize ? undefined : iconClassName}
              {...(iconSize ? { width: iconSize, height: iconSize } : {})}
            />
          </a>
        );
      })}
    </div>
  );
}
