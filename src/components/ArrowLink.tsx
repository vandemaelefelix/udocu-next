import Link from "next/link";
import { type ReactNode, type ElementType, type MouseEvent } from "react";
import GlitchText from "@/components/GlitchText";

interface ArrowLinkProps {
  href: string;
  children: ReactNode;
  direction?: "forward" | "back";
  className?: string;
  external?: boolean;
  onClick?: (e: MouseEvent<HTMLAnchorElement>) => void;
  /** Overrides the accessible name — use when multiple links share visible text (e.g. "LEES MEER") so screen readers can tell them apart. */
  ariaLabel?: string;
}

export default function ArrowLink({
  href,
  children,
  direction = "forward",
  className = "font-helvetica text-[16px] font-medium uppercase leading-5 transition-opacity hover:opacity-70",
  external = false,
  onClick,
  ariaLabel,
}: ArrowLinkProps) {
  const isBack = direction === "back";
  const arrow = isBack ? "←" : "→";
  const hoverClass = isBack
    ? "group-hover:-translate-x-1"
    : "group-hover:translate-x-1";

  const content = isBack ? (
    <>
      <span
        aria-hidden="true"
        className={`inline-block transition-transform duration-200 ${hoverClass}`}
      >
        {arrow}
      </span>
      {children}
    </>
  ) : (
    <>
      {children}{" "}
      <span
        aria-hidden="true"
        className={`inline-block transition-transform duration-200 ${hoverClass}`}
      >
        {arrow}
      </span>
    </>
  );

  const Tag: ElementType = external ? "a" : Link;
  const linkProps = { href, onClick, "aria-label": ariaLabel };

  return (
    <Tag {...linkProps} className={`group ${className}`}>
      <GlitchText className="inline-flex items-center gap-2">
        {content}
      </GlitchText>
    </Tag>
  );
}
