"use client";

import { useEffect } from "react";
import { useScrollColor } from "@/context/ScrollColorContext";

export default function ThemeColorSync() {
  const { bgColor } = useScrollColor();

  useEffect(() => {
    document.documentElement.style.backgroundColor = bgColor;
    document.body.style.backgroundColor = bgColor;
    document
      .querySelectorAll('meta[name="theme-color"]')
      .forEach((meta) => meta.setAttribute("content", bgColor));
  }, [bgColor]);

  return null;
}
