import noiseTexture from "@/assets/images/noise-texture.png";

export default function NoiseOverlay() {
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999]"
      style={{
        backgroundImage: `url(${noiseTexture.src})`,
        backgroundRepeat: "repeat",
        opacity: 0.1,
        animation: "noise-shift 0.3s steps(4) infinite",
      }}
    />
  );
}
