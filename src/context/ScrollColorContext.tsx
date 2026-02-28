"use client";

import { createContext, useContext, useState } from "react";

const DEFAULT_BG = "rgb(62, 2, 2)";
const DEFAULT_TEXT = "rgb(196, 181, 253)";

interface ScrollColorContextValue {
  bgColor: string;
  textColor: string;
  setColors: (bg: string, text: string) => void;
}

export const ScrollColorContext = createContext<ScrollColorContextValue>({
  bgColor: DEFAULT_BG,
  textColor: DEFAULT_TEXT,
  setColors: () => {},
});

export function ScrollColorProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [bgColor, setBgColor] = useState(DEFAULT_BG);
  const [textColor, setTextColor] = useState(DEFAULT_TEXT);

  function setColors(bg: string, text: string) {
    setBgColor(bg);
    setTextColor(text);
  }

  return (
    <ScrollColorContext.Provider value={{ bgColor, textColor, setColors }}>
      {children}
    </ScrollColorContext.Provider>
  );
}

export function useScrollColor() {
  return useContext(ScrollColorContext);
}
