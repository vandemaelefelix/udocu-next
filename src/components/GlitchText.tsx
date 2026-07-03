"use client";

import { useId, useEffect, useRef } from "react";

interface GlitchTextProps {
  children: React.ReactNode;
  className?: string;
}

export default function GlitchText({ children, className }: GlitchTextProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const filterId = `glitch-${uid}`;
  const animId = `glitch-anim-${uid}`;
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const focusTarget = el.closest("a, button, [tabindex]") ?? el;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    function trigger() {
      if (reduceMotion.matches) return;
      (
        document.getElementById(animId) as SVGAnimateElement | null
      )?.beginElement();
    }
    function onFocusIn() {
      if (!focusTarget.matches(":focus-visible")) return;
      trigger();
    }
    el.addEventListener("mouseenter", trigger);
    focusTarget.addEventListener("focusin", onFocusIn);
    return () => {
      el.removeEventListener("mouseenter", trigger);
      focusTarget.removeEventListener("focusin", onFocusIn);
    };
  }, [animId]);

  return (
    <>
      <svg
        aria-hidden="true"
        focusable="false"
        style={{
          position: "absolute",
          width: 0,
          height: 0,
          overflow: "hidden",
        }}
      >
        <defs>
          <filter
            id={filterId}
            x="-20%"
            y="-10%"
            width="140%"
            height="120%"
            colorInterpolationFilters="sRGB"
          >
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.04 0.45"
              numOctaves="1"
              seed="3"
              result="noise"
            />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              xChannelSelector="R"
              yChannelSelector="G"
            >
              <animate
                id={animId}
                attributeName="scale"
                values="0;14;3;10;0"
                dur="0.45s"
                begin="indefinite"
              />
            </feDisplacementMap>
          </filter>
        </defs>
      </svg>
      <span
        ref={ref}
        className={["glitch-text", className].filter(Boolean).join(" ")}
        style={{ filter: `url(#${filterId})` }}
      >
        {children}
      </span>
    </>
  );
}
