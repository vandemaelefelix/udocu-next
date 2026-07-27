import UdocuLogo from "@/components/UdocuLogo";

const LOGO_WIDTH = 1042;
const LOGO_HEIGHT = 562;
const TAGLINE_GAP = 40;
const TAGLINE_FONT_SIZE = 70;
const TAGLINE_BASELINE_OFFSET = TAGLINE_FONT_SIZE * 0.8;
const VIEWBOX_HEIGHT =
  LOGO_HEIGHT + TAGLINE_GAP + TAGLINE_BASELINE_OFFSET + TAGLINE_FONT_SIZE * 0.3;

export default function HeroLockup({ tagline }: { tagline: string }) {
  return (
    <div className="flex flex-col items-center">
      <h1 className="sr-only">{tagline}</h1>
      <svg
        aria-hidden="true"
        viewBox={`0 0 ${LOGO_WIDTH} ${VIEWBOX_HEIGHT}`}
        className="h-auto w-[90vw] md:h-[54vh] md:w-auto md:max-w-[92vw]"
      >
        <UdocuLogo
          x={0}
          y={0}
          width={LOGO_WIDTH}
          height={LOGO_HEIGHT}
          color="var(--color-green-light)"
        />
        <text
          x={LOGO_WIDTH / 2}
          y={LOGO_HEIGHT + TAGLINE_GAP + TAGLINE_BASELINE_OFFSET}
          textAnchor="middle"
          textLength={LOGO_WIDTH}
          lengthAdjust="spacingAndGlyphs"
          fontSize={TAGLINE_FONT_SIZE}
          fontWeight={700}
          fill="var(--color-green-light)"
          style={{ fontFamily: "var(--font-garamond)" }}
        >
          {tagline}
        </text>
      </svg>
    </div>
  );
}
