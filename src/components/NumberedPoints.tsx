interface NumberedPointsProps {
  /** Point bodies in order. Paragraphs within a point are separated by "\n\n". */
  points: string[];
}

/**
 * Renders the werkwijze points as a numbered list. The visible numerals are
 * Posterman display type and are aria-hidden: role="list" is added explicitly
 * because list-none strips the implicit list role in Safari, so without it
 * VoiceOver would announce no ordinal information at all.
 */
export default function NumberedPoints({ points }: NumberedPointsProps) {
  return (
    <ol role="list" className="list-none space-y-10 md:space-y-14">
      {points.map((point, index) => (
        <li key={index} className="md:grid md:grid-cols-[5rem_1fr] md:gap-8">
          <span
            aria-hidden="true"
            className="mb-2 block font-posterman text-[40px] font-black leading-none opacity-70 md:mb-0 md:text-[64px]"
          >
            {index + 1}
          </span>
          <div className="space-y-4">
            {point.split("\n\n").map((paragraph, i) => (
              <p key={i}>{paragraph}</p>
            ))}
          </div>
        </li>
      ))}
    </ol>
  );
}
