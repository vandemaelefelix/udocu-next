import noiseTexture from "@/assets/images/noise.jpg";

export default function NoiseOverlay() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed z-[9999] noise-overlay"
      style={{
        backgroundImage: `url(${noiseTexture.src})`,
        backgroundRepeat: "repeat",
        width: "300%",
        height: "300%",
        top: "-110%",
        left: "-50%",
        opacity: 0.1,
        willChange: "transform",
      }}
    />
  );
}
