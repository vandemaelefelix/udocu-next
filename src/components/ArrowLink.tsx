import Link from "next/link";
import { type ReactNode, type ElementType } from "react";

interface ArrowLinkProps {
  href: string;
  children: ReactNode;
  direction?: "forward" | "back";
  className?: string;
  external?: boolean;
}

export default function ArrowLink({
  href,
  children,
  direction = "forward",
  className = "font-helvetica text-[16px] font-medium uppercase leading-5 transition-opacity hover:opacity-70",
  external = false,
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
  const linkProps = external ? { href } : { href };

  return (
    <Tag
      {...linkProps}
      className={`group inline-flex items-center gap-2 ${className}`}
    >
      {content}
    </Tag>
  );
}
