"use client";

import { useEffect, useState } from "react";

/**
 * Returns the id of the section whose box straddles the viewport centre.
 *
 * Sections can mount late (`next/dynamic`) or have their DOM nodes replaced
 * during hydration, which detaches the nodes an IntersectionObserver was
 * attached to and silently stops it from ever firing again. To stay correct we
 * re-attach the observer whenever the set of live section nodes changes
 * identity — but not on unrelated DOM churn (e.g. GlitchText swapping text),
 * so the observer isn't needlessly rebuilt.
 */
export function useActiveSection(ids: readonly string[]): string | null {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let observed: (HTMLElement | null)[] = [];

    const currentNodes = () => ids.map((id) => document.getElementById(id));

    const sameAsObserved = (nodes: (HTMLElement | null)[]) =>
      nodes.length === observed.length &&
      nodes.every((node, i) => node === observed[i]);

    const attach = () => {
      const nodes = currentNodes();
      observer?.disconnect();
      observed = nodes;
      observer = new IntersectionObserver(
        (entries) => {
          const visible = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
          if (visible.length > 0) setActive(visible[0].target.id);
        },
        // Active band = centre 10% of the viewport, matching the AC's
        // "straddles the viewport centre" definition.
        { rootMargin: "-45% 0px -45% 0px", threshold: [0, 0.25, 0.5, 1] },
      );
      nodes.forEach((node) => node && observer!.observe(node));
    };

    attach();

    // Re-attach only when a tracked section node actually appears/changes
    // identity. rAF-debounced so a burst of mutations rebuilds at most once
    // per frame; the identity check skips rebuilds for unrelated mutations.
    let raf = 0;
    const mutations = new MutationObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        if (!sameAsObserved(currentNodes())) attach();
      });
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(raf);
      mutations.disconnect();
      observer?.disconnect();
    };
  }, [ids]);

  return active;
}
