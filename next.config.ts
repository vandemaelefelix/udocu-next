import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isDev = process.env.NODE_ENV !== "production";
// Vercel preview deployments inject a live-feedback toolbar (vercel.live).
// NODE_ENV is "production" on preview builds, so we need a separate check.
const isVercelPreview = process.env.VERCEL_ENV === "preview";
// True only when actually deployed on Vercel (prod or preview), where TLS is
// always terminated for us. Vercel sets this for every build and runtime,
// including previews; NODE_ENV alone cannot tell "deployed" apart from
// "`next build && next start` on a developer's machine".
const isVercelDeployment = process.env.VERCEL === "1";

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  // 'unsafe-inline' is required for Next.js streaming runtime scripts and the
  // inline JSON-LD blocks in the locale layout. Tighten with a per-request
  // nonce via middleware once that refactor lands.
  // 'unsafe-eval' is added in development only — React's dev runtime uses eval()
  // for debugging features; it is never used in production builds.
  // https://eu-assets.i.posthog.com serves the PostHog analytics bundle (config.js).
  // https://va.vercel-scripts.com serves the Vercel Speed Insights script.
  `script-src 'self' 'unsafe-inline' https://eu-assets.i.posthog.com https://va.vercel-scripts.com${isDev || isVercelPreview ? " https://vercel.live" : ""}${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://images.prismic.io https://i.ytimg.com https://eu.i.posthog.com https://eu-assets.i.posthog.com",
  "media-src 'self' blob:",
  `frame-src https://www.youtube-nocookie.com${isDev || isVercelPreview ? " https://vercel.live" : ""}`,
  // PostHog analytics: eu.i.posthog.com (events/decide), eu-assets.i.posthog.com (config bundle),
  // eu.posthog.com (feature flags /decide endpoint).
  `connect-src 'self' https://images.prismic.io https://*.prismic.io https://eu.i.posthog.com https://eu-assets.i.posthog.com https://eu.posthog.com${isDev || isVercelPreview ? " https://vercel.live wss://ws-us3.pusher.com" : ""}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  // Force http→https, but only on Vercel, where every request already
  // arrives over TLS, so this is a safe no-op there. On a plain HTTP server
  // (next dev, or `next build && next start` on a developer's machine) this
  // directive breaks WebKit/Safari: unlike Chromium, WebKit does not exempt
  // localhost from it, so it upgrades every subresource request (JS chunks,
  // images, fonts) to https, they fail TLS, and the page never hydrates.
  // Gating on NODE_ENV alone used to miss the local-production-build case
  // (`next start`, NODE_ENV=production, no TLS) and silently broke the tape
  // effect under WebKit whenever it was tested against such a build.
  ...(isVercelDeployment ? ["upgrade-insecure-requests"] : []),
].join("; ");

const permissionsPolicy = [
  "accelerometer=()",
  "autoplay=(self)",
  "camera=()",
  "display-capture=()",
  "encrypted-media=()",
  "fullscreen=(self)",
  "geolocation=()",
  "gyroscope=()",
  "magnetometer=()",
  "microphone=()",
  "midi=()",
  "payment=()",
  // Allow the embedded YouTube (no-cookie) player to use picture-in-picture.
  'picture-in-picture=(self "https://www.youtube-nocookie.com")',
  "publickey-credentials-get=()",
  "screen-wake-lock=()",
  "sync-xhr=()",
  "usb=()",
  "xr-spatial-tracking=()",
].join(", ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // HSTS forces https. Emit it in production only — on localhost the browser
  // pins it and then upgrades http→https for every port, breaking this and
  // other local dev servers (and WebKit hydration in particular).
  ...(isDev
    ? []
    : [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
      ]),
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: permissionsPolicy },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  trailingSlash: false,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.prismic.io",
      },
    ],
    // Prismic images are served through imgix and bypass this optimizer (see
    // prismicImageLoader / PrismicNextImage), so this config only governs the
    // handful of local static images. Keeping the settings tight limits how
    // many optimized variants Vercel writes to its durable cache.
    //
    // Hold optimized variants for 31 days so repeat traffic reuses them instead
    // of re-optimizing (and re-writing to cache) the same image. This is the
    // main lever against Image Cache Writes churn.
    minimumCacheTTL: 2678400,
    // A single modern format — enabling AVIF alongside WebP would double the
    // number of variants (and cache writes) generated per image.
    formats: ["image/webp"],
    // Trim the largest breakpoints (2048/3840) that our layouts never request;
    // each retained width is one more variant that can be generated per image.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [128, 256, 384],
  },
  experimental: {
    optimizePackageImports: ["motion"],
  },
  headers: async () => [
    {
      source: "/:path*",
      headers: securityHeaders,
    },
    {
      // Self-hosted videos + posters are content-stable (their bytes never
      // change under a given filename), so let the browser cache them for a
      // year. This means a page refresh reuses the already-downloaded file
      // instead of re-fetching it — the key lever for keeping video traffic
      // down. If a video's content ever changes, ship it under a new filename
      // (e.g. about.v2.mp4) so cached browsers pick it up.
      source: "/videos/:path*",
      headers: [
        {
          key: "Cache-Control",
          value: "public, max-age=31536000, immutable",
        },
      ],
    },
    {
      source: "/api/preview",
      headers: [{ key: "X-Robots-Tag", value: "noindex" }],
    },
    {
      source: "/api/exit-preview",
      headers: [{ key: "X-Robots-Tag", value: "noindex" }],
    },
    {
      source: "/slice-simulator",
      headers: [{ key: "X-Robots-Tag", value: "noindex" }],
    },
  ],
};

export default withNextIntl(nextConfig);
