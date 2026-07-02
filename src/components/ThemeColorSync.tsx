"use client";

import { useEffect } from "react";
import { useScrollColor } from "@/context/ScrollColorContext";

export default function ThemeColorSync() {
  const { bgColor } = useScrollColor();

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", bgColor);
  }, [bgColor]);

  return null;
}
