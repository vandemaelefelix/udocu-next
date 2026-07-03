import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const isDev = process.env.NODE_ENV !== "production";

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
  `script-src 'self' 'unsafe-inline' https://eu-assets.i.posthog.com${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: blob: https://images.prismic.io https://res.cloudinary.com https://i.ytimg.com https://eu.i.posthog.com https://eu-assets.i.posthog.com",
  "media-src 'self' blob: https://res.cloudinary.com",
  "frame-src https://www.youtube-nocookie.com",
  // PostHog analytics: eu.i.posthog.com (events/flags) and eu-assets.i.posthog.com (config).
  "connect-src 'self' https://images.prismic.io https://res.cloudinary.com https://*.prismic.io https://eu.i.posthog.com https://eu-assets.i.posthog.com",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "upgrade-insecure-requests",
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
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
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
