"use client";

import { createContext, useContext, useState } from "react";

// Bordeaux bg / purple text — must never default to green (green is text-only).
const DEFAULT_BG = "rgb(62, 2, 2)";
const DEFAULT_TEXT = "rgb(180, 150, 214)";
// Olive — hero chrome colour, shown before JS hydrates (must match viewport.themeColor in layout.tsx).
const DEFAULT_CHROME = "#686121";

interface ScrollColorContextValue {
  bgColor: string;
  textColor: string;
  chromeColor: string;
  setColors: (bg: string, text: string, chrome: string) => void;
}

export const ScrollColorContext = createContext<ScrollColorContextValue>({
  bgColor: DEFAULT_BG,
  textColor: DEFAULT_TEXT,
  chromeColor: DEFAULT_CHROME,
  setColors: () => {},
});

export function ScrollColorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [bgColor, setBgColor] = useState(DEFAULT_BG);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT);
  const [chromeColor, setChromeColor] = useState(DEFAULT_CHROME);

  function setColors(bg: string, text: string, chrome: string) {
    setBgColor(bg);
    setTextColor(text);
    setChromeColor(chrome);
  }

  return (
    <ScrollColorContext.Provider
      value={{ bgColor, textColor, chromeColor, setColors }}
    >
      {children}
    </ScrollColorContext.Provider>
  );
}

export function useScrollColor() {
  return useContext(ScrollColorContext);
}
