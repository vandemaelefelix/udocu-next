"use client";

import { type ReactNode } from "react";
import ArrowLink from "@/components/ArrowLink";
import { useBackNavigation } from "@/hooks/useBackNavigation";

interface DetailBackLinkProps {
  href: string;
  children: ReactNode;
  className?: string;
}

/**
 * Standalone "back" link for use directly inside a Server Component (e.g.
 * the work detail page's desktop-only back link, which lives outside
 * `DetailNav`). A Server Component can't pass a click handler as a prop, so
 * this tiny client wrapper attaches the shared `useBackNavigation` handler
 * (history-back-with-fixed-hash-fallback) to an `ArrowLink`.
 */
export default function DetailBackLink({
  href,
  children,
  className,
}: DetailBackLinkProps) {
  const handleBack = useBackNavigation();

  return (
    <ArrowLink
      href={href}
      direction="back"
      onClick={handleBack}
      className={className}
    >
      {children}
    </ArrowLink>
  );
}
