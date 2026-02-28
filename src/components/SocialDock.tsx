"use client";

import { useEffect, useState } from "react";
import {
  FacebookIcon,
  InstagramIcon,
  YouTubeIcon,
} from "@/components/SocialIcons";

export default function SocialDock() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const about = document.getElementById("about");
    if (!about) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(about);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className="fixed right-8 bottom-6 z-50 hidden gap-4 transition-opacity duration-500 md:flex"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <a
        href="https://facebook.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Facebook"
      >
        <FacebookIcon className="h-5 w-5 transition-opacity hover:opacity-70" />
      </a>
      <a
        href="https://instagram.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Instagram"
      >
        <InstagramIcon className="h-5 w-5 transition-opacity hover:opacity-70" />
      </a>
      <a
        href="https://youtube.com"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="YouTube"
      >
        <YouTubeIcon className="h-5 w-5 transition-opacity hover:opacity-70" />
      </a>
    </div>
  );
}
