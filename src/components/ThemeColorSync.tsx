"use client";

import { useEffect } from "react";
import { useScrollColor } from "@/context/ScrollColorContext";

export default function ThemeColorSync() {
  const { chromeColor } = useScrollColor();

  useEffect(() => {
    document.documentElement.style.backgroundColor = chromeColor;
    document.body.style.backgroundColor = chromeColor;

    // Remove and re-insert instead of mutating `content` — Safari requires a
    // fresh tag to repaint the browser chrome; mutation is silently ignored.
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((m) => m.remove());
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = chromeColor;
    document.head.appendChild(meta);
  }, [chromeColor]);

  return null;
}
