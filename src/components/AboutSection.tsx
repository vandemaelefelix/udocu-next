"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useIsMobile } from "@/hooks/useIsMobile";
import tvFrameOverlay from "@/assets/images/tv-frame-overlay.png";
import AboutVideo from "@/components/AboutVideo";
import VolumeIcon from "@/components/icons/VolumeIcon";
import ArrowLink from "@/components/ArrowLink";
import Link from "next/link";
import TapeSurface from "@/components/vhs/TapeSurface";
import { TAPE_PRESETS } from "@/components/vhs/presets";

export default function AboutSection() {
  const t = useTranslations("about");
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(true);
  const [isVideoVisible, setIsVideoVisible] = useState(false);
  // Drives the TV screen's tape ramp. Mouse pointers only, so a touch tap does
  // not leave the screen stuck at full strength with no matching leave.
  const [screenHovered, setScreenHovered] = useState(false);

  useEffect(() => {
    const el = videoContainerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVideoVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" }, // start loading 200px before it enters view
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const toggleMute = useCallback(() => {
    const videoEl = videoContainerRef.current?.querySelector("video");
    if (videoEl) {
      videoEl.muted = !videoEl.muted;
      setIsMuted(videoEl.muted);
    }
  }, []);

  // Direct scroll listener — bypasses Framer Motion's scroll tracking which
  // miscalculates the range when named offsets ("start start") are used
  // inside a positioned ancestor (ScrollBackground's relative div).
  useEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const inner = innerRef.current;
    if (!section || !sticky) return;

    if (isMobile) {
      sticky.style.opacity = "1";
      if (inner) inner.style.transform = "scale(1.6)";
      return;
    }

    let rafId: number;

    function update() {
      const vp = window.innerHeight;
      const rect = section!.getBoundingClientRect();
      const scrollRange = section!.offsetHeight - vp;
      if (scrollRange <= 0) return;
      // progress: 0 when section top = viewport top → 1 when section bottom = viewport bottom
      const progress = Math.max(0, Math.min(1, -rect.top / scrollRange));
      // TV holds at 100% while user reads About content, then crossfades with WhoAmI.
      // WhoAmI enters the viewport when About progress=0.333 (scrollY≈1350).
      // Starting the TV fade exactly there creates a simultaneous bilateral crossfade:
      // TV fades 100%→0% while portrait simultaneously builds 0%→100%, both over 900px.
      const holdEnd = 0.333; // scrollY≈1350: TV at 100%, WhoAmI just entering viewport
      const fadeEnd = 0.7; // scrollY≈1845: TV at 0%, portrait still building (58%)
      const rawT = Math.max(
        0,
        Math.min(1, (progress - holdEnd) / (fadeEnd - holdEnd)),
      );
      const tEased =
        rawT < 0.5
          ? 4 * rawT * rawT * rawT
          : 1 - Math.pow(-2 * rawT + 2, 3) / 2;
      const opacity = 1 - tEased;
      sticky!.style.opacity = String(opacity);
      if (inner) {
        const y = 5 - progress * 10; // 5% → -5% parallax pan
        const scale = 1.6 - 0.05 * tEased; // 1.6 → 1.55: subtle pull-back as TV exits
        inner!.style.transform = `translateY(${y}%) scale(${scale})`;
      }
    }

    function onScroll() {
      rafId = requestAnimationFrame(update);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    update();
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [isMobile]);

  return (
    <section
      ref={sectionRef}
      id="about"
      className={`flex min-h-screen flex-col text-red-light md:min-h-[250vh] md:flex-row`}
    >
      {/* Image with video playing inside the TV */}
      <div
        ref={stickyRef}
        className="relative h-[50vh] w-full shrink-0 overflow-hidden md:sticky md:top-0 md:z-10 md:h-screen md:w-3/5 md:self-start"
      >
        <div
          ref={innerRef}
          style={{ transform: "scale(1.6)" }}
          className="absolute inset-[-10%] origin-center overflow-hidden"
        >
          {/*
           * Single coordinate space: a div sized to the image's native
           * aspect ratio (1856×2304 ≈ 0.806:1), centered and scaled to
           * cover the container — just like object-cover, but everything
           * inside shares the same coordinates.
           */}
          <div
            ref={videoContainerRef}
            className="absolute"
            style={{
              /* native image aspect ratio */
              aspectRatio: "1856 / 2304",
              /* cover: fill the shorter axis, center the overflow */
              width: "auto",
              height: "auto",
              minWidth: "100%",
              minHeight: "100%",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
            }}
          >
            {/* Background image */}
            <Image
              src={tvFrameOverlay}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 767px) 100vw, 60vw"
            />

            {/* Video in the TV screen cutout */}
            <Link
              href="/about"
              aria-label={t("aboutLinkLabel")}
              className="absolute cursor-pointer overflow-hidden"
              style={{
                top: "37%",
                left: "37%",
                width: "23%",
                height: "15.5%",
              }}
              onPointerEnter={(e) => {
                if (e.pointerType !== "mouse") return;
                setScreenHovered(true);
              }}
              onPointerLeave={() => setScreenHovered(false)}
            >
              {isVideoVisible ? (
                <TapeSurface
                  active
                  /* Ramps from ambient to full strength on hover, the same
                     gesture the work carousel cards make. This replaced a
                     group-hover scale transform on this wrapper. */
                  params={TAPE_PRESETS.screenAmbient}
                  hoverParams={TAPE_PRESETS.screen}
                  hovered={screenHovered}
                  /* The screen preset's scanline count needs 360 lines to
                     resolve; below that the pattern aliases into flat grey. */
                  maxHeight={360}
                  className="absolute inset-0 h-full w-full"
                >
                  <AboutVideo
                    src="/videos/about-tv.v2.mp4"
                    poster="/videos/about-poster-tv.webp"
                    autoPlay
                    loop
                    preload="auto"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                </TapeSurface>
              ) : (
                <Image
                  src="/videos/about-poster-tv.webp"
                  alt=""
                  fill
                  className="object-cover"
                  sizes="(max-width: 767px) 40vw, 15vw"
                />
              )}
            </Link>

            {/* TV frame overlay on top */}
            <Image
              src={tvFrameOverlay}
              alt=""
              fill
              className="pointer-events-none"
              sizes="(max-width: 767px) 100vw, 60vw"
            />
          </div>
        </div>

        {/* Mute toggle at the bottom of the image */}
        <button
          type="button"
          onClick={toggleMute}
          className="absolute bottom-4 right-4 z-20 flex h-9 w-9 items-center cursor-pointer justify-center rounded-full bg-red-dark text-red-light transition-opacity hover:opacity-70"
          aria-label={isMuted ? "Unmute" : "Mute"}
        >
          <VolumeIcon muted={isMuted} className="h-4 w-4" />
        </button>
      </div>

      {/* Text content */}
      <div className="flex w-full flex-col px-6 py-12 md:h-screen md:w-2/5 md:px-12 md:py-24">
        <div className="md:mt-auto md:max-w-93">
          <h2 className="mb-10 whitespace-nowrap text-[40px] leading-12 md:text-[74px] md:leading-22">
            <span className="font-serif font-semibold">{t("titlePrefix")}</span>{" "}
            <span className="font-posterman font-black">
              {t("titleSuffix")}
            </span>
          </h2>
          <div className="space-y-6 font-serif text-[18px] font-normal leading-5.5 md:text-[20px]">
            <p>{t("paragraph1")}</p>
            <p>{t("paragraph2")}</p>
          </div>
          <div className="flex flex-col gap-4 md:gap-16 mt-8">
            <ArrowLink href="/about" ariaLabel={t("readMoreAriaLabel")}>
              {t("readMoreLink")}
            </ArrowLink>
            <ArrowLink href="#contact">{t("contactLink")}</ArrowLink>
          </div>
        </div>
      </div>
    </section>
  );
}
