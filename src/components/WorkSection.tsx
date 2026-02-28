"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";

const ITEMS = [
  { id: 1, color: "#c4956a" },
  { id: 2, color: "#8a7d6b" },
  { id: 3, color: "#6b8a7d" },
  { id: 4, color: "#917d6b" },
  { id: 5, color: "#6b7d8a" },
  { id: 6, color: "#8a6b7d" },
  { id: 7, color: "#7d8a6b" },
  { id: 8, color: "#6b8a80" },
  { id: 9, color: "#9a8b6a" },
  { id: 10, color: "#6a7b9a" },
];

const ITEM_W = 350;
const ITEM_H = ITEM_W;
const GAP = 24;
const STRIDE = ITEM_W + GAP;
const N = ITEMS.length;

// Curve: exponential — flat/high on left, steeply descending on right
const CURVE_MAX = 130; // overall curve intensity (px)
const CURVE_SPAN = 850; // horizontal scale (px)
// When the curve straightens, items settle here (≈ left-edge height at full curve)
// so the left side never dips back down to center.
const STRAIGHT_Y = CURVE_MAX * (Math.exp(-0.85) - 1); // ≈ -74px above center

const SECTION_VH = 170; // total scroll height of section
const ENTRY_END = 0.5; // fraction of scroll where entry animation completes

export default function WorkSection() {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileCarousel />;
  }

  return <DesktopCarousel />;
}

/* ─── Mobile: horizontal scroll-snap carousel ─── */

const MOBILE_ITEM_SIZE = 280;

function MobileCarousel() {
  return (
    <section id="work" className="flex h-screen flex-col justify-center">
      <div
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-[calc(50vw-140px)] py-8"
        style={{ scrollbarWidth: "none", WebkitOverflowScrolling: "touch" }}
      >
        {ITEMS.map((item) => (
          <div
            key={item.id}
            className="shrink-0 snap-center"
            style={{
              width: MOBILE_ITEM_SIZE,
              height: MOBILE_ITEM_SIZE,
              borderRadius: 6,
              backgroundColor: item.color,
            }}
          />
        ))}
      </div>
    </section>
  );
}

/* ─── Desktop: curve scroll animation with drag ─── */

function DesktopCarousel() {
  const sectionRef = useRef<HTMLElement>(null);
  const [scrollProg, setScrollProg] = useState(0);
  const offsetRef = useRef(0);
  const [offset, setOffset] = useState(0);
  const [vw, setVw] = useState(1440);

  const drag = useRef({ on: false, x: 0, v: 0, t: 0 });
  const rafRef = useRef(0);

  // Track viewport width
  useEffect(() => {
    const update = () => setVw(window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Section scroll progress: 0 when section top hits viewport, 1 when fully scrolled
  useEffect(() => {
    const tick = () => {
      const el = sectionRef.current;
      if (!el) return;
      const top = el.getBoundingClientRect().top;
      const scrollable = el.offsetHeight - window.innerHeight;
      setScrollProg(
        scrollable > 0 ? Math.max(0, Math.min(1, -top / scrollable)) : 0,
      );
    };
    window.addEventListener("scroll", tick, { passive: true });
    tick();
    return () => window.removeEventListener("scroll", tick);
  }, []);

  // Entry: linear 0→1 over first ENTRY_END fraction of scroll
  const entryRaw = Math.min(1, scrollProg / ENTRY_END);

  // Curve straightens after entry completes — linear so scroll maps 1:1 to visual change
  const curveP = Math.max(0, (scrollProg - ENTRY_END) / (1 - ENTRY_END));
  const curve = CURVE_MAX * (1 - curveP);

  // Pointer drag
  const onDown = useCallback((e: React.PointerEvent) => {
    cancelAnimationFrame(rafRef.current);
    drag.current = { on: true, x: e.clientX, v: 0, t: performance.now() };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const onMove = useCallback((e: React.PointerEvent) => {
    const d = drag.current;
    if (!d.on) return;
    const now = performance.now();
    const dx = e.clientX - d.x;
    d.v = (dx / Math.max(1, now - d.t)) * 16;
    d.x = e.clientX;
    d.t = now;
    offsetRef.current += dx;
    setOffset(offsetRef.current);
  }, []);

  const onUp = useCallback(() => {
    const d = drag.current;
    if (!d.on) return;
    d.on = false;
    let v = d.v;
    const momentum = () => {
      v *= 0.93;
      if (Math.abs(v) < 0.4) return;
      offsetRef.current += v;
      setOffset(offsetRef.current);
      rafRef.current = requestAnimationFrame(momentum);
    };
    rafRef.current = requestAnimationFrame(momentum);
  }, []);

  // Horizontal wheel scroll
  useEffect(() => {
    const el = sectionRef.current?.querySelector(
      "[data-carousel]",
    ) as HTMLElement | null;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) * 2) {
        e.preventDefault();
        offsetRef.current -= e.deltaX;
        setOffset(offsetRef.current);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Visible slots: enough to cover viewport + buffer on each side
  const cx = vw / 2;
  const half = Math.ceil(vw / STRIDE) + 3;
  const baseSlot = Math.round(-offset / STRIDE);
  const slots = Array.from(
    { length: half * 2 + 1 },
    (_, i) => baseSlot - half + i,
  );

  return (
    <section ref={sectionRef} id="work" style={{ height: `${SECTION_VH}vh` }}>
      <div
        data-carousel
        className="sticky top-0 h-screen cursor-grab overflow-hidden select-none active:cursor-grabbing"
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}
        style={{ touchAction: "pan-y" }}
      >
        {slots.map((slot) => {
          const item = ITEMS[((slot % N) + N) % N];

          // X center of this item on screen
          const itemCx = cx + slot * STRIDE + offset;
          const dist = itemCx - cx;

          // Exponential curve: left items sit high, right items descend steeply.
          // As the curve straightens (curveP → 1), items settle at STRAIGHT_Y
          // instead of y=0 — so the left side stays elevated rather than dipping back.
          const curveFull = CURVE_MAX * (Math.exp(dist / CURVE_SPAN) - 1);
          const curveY =
            (curve / CURVE_MAX) * curveFull +
            (1 - curve / CURVE_MAX) * STRAIGHT_Y;

          // Entry stagger: leftmost items (negative dist) enter first
          // Map dist from [-vw/2 .. +vw] → staggerT [0 .. 1]
          const staggerT = Math.max(0, Math.min(1, (dist + vw * 0.5) / vw));
          const delay = staggerT * 0.58;
          const rawP =
            delay >= 1
              ? 0
              : Math.max(0, Math.min(1, (entryRaw - delay) / (1 - delay)));
          const itemEntry = rawP;

          const entryY = (1 - itemEntry) * 130;
          const opacity = itemEntry;

          return (
            <div
              key={slot}
              style={{
                position: "absolute",
                left: itemCx - ITEM_W / 2,
                top: `calc(50% - ${ITEM_H / 2}px + ${curveY + entryY}px)`,
                width: ITEM_W,
                height: ITEM_H,
                borderRadius: 6,
                backgroundColor: item.color,
                opacity,
                willChange: "transform, opacity",
                pointerEvents: "none",
              }}
            />
          );
        })}
      </div>
    </section>
  );
}
