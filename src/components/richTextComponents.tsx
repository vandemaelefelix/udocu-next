import type { JSXMapSerializer } from "@prismicio/react";
import { PrismicNextLink } from "@prismicio/next";
import YouTubeEmbed, { extractYouTubeId } from "@/components/YouTubeEmbed";

/**
 * Detail pages each run their own colour pair (red, blue, ...), so inline links
 * lean on `currentColor` (underline + hover opacity) instead of a fixed token.
 */
const linkClassName =
  "underline underline-offset-4 transition-opacity hover:opacity-70 focus-visible:opacity-70 focus-visible:outline-none";

/**
 * Shared serializers for Prismic rich-text bodies.
 *
 * Two things the defaults get wrong here:
 *
 * - Tailwind's preflight resets anchors to `color: inherit` /
 *   `text-decoration: inherit`, so a hyperlink an editor adds in Prismic
 *   renders as plain body copy: it works, but nothing marks it as a link.
 * - The default `embed` serializer dumps the provider's oEmbed HTML through
 *   `dangerouslySetInnerHTML`. YouTube's oEmbed ships a hardcoded 200x113
 *   iframe, so a video pasted in the body came out thumbnail-sized. We build
 *   the iframe ourselves instead, in a responsive 16:9 box and against
 *   youtube-nocookie, which also keeps unsanitised third-party HTML out of the
 *   page. Providers we don't render natively degrade to a plain link.
 */
export const richTextComponents: JSXMapSerializer = {
  hyperlink: ({ node, children, key }) => (
    <PrismicNextLink key={key} field={node.data} className={linkClassName}>
      {children}
    </PrismicNextLink>
  ),

  embed: ({ node, key }) => {
    const { embed_url: url, title } = node.oembed;
    if (!url) return null;

    if (extractYouTubeId(url)) {
      return (
        <div key={key} className="relative aspect-video w-full overflow-hidden">
          <YouTubeEmbed url={url} title={title ?? undefined} />
        </div>
      );
    }

    return (
      <p key={key}>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className={linkClassName}
        >
          {title || url}
        </a>
      </p>
    );
  },
};
