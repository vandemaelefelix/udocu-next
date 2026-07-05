"use client";

import { useEffect, useRef } from "react";
import { useScrollColor } from "@/context/ScrollColorContext";

export default function ThemeColorSync() {
  const { chromeColor } = useScrollColor();
  // Tracks the tag *this component* last inserted, so later swaps never
  // touch the React/Next-rendered static `viewport.themeColor` tag (see
  // below) — only ever our own.
  const ownMetaRef = useRef<HTMLMetaElement | null>(null);

  useEffect(() => {
    document.documentElement.style.backgroundColor = chromeColor;
    document.body.style.backgroundColor = chromeColor;

    // Remove and re-insert instead of mutating `content` — Safari requires a
    // fresh tag to repaint the browser chrome; mutation is silently ignored.
    //
    // Only remove a tag *we* previously inserted — never the static
    // `meta[name="theme-color"]` tag Next renders from `viewport.themeColor`
    // in the root layout. That tag is tracked by a React fiber; deleting it
    // via a raw DOM call orphans the fiber and crashes React on the next
    // client-side navigation ("Cannot read properties of null (reading
    // 'removeChild')") because React later tries to reconcile a node that's
    // no longer attached. Prepending our tag makes browsers prefer it for
    // chrome painting (first `meta[name="theme-color"]` wins) while Next's
    // stays inert and untouched.
    ownMetaRef.current?.remove();
    const meta = document.createElement("meta");
    meta.name = "theme-color";
    meta.content = chromeColor;
    document.head.prepend(meta);
    ownMetaRef.current = meta;
  }, [chromeColor]);

  return null;
}
