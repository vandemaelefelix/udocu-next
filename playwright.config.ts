import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  retries: 1,
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
  },
  projects: [
    {
      name: "performance",
      testMatch: "tests/performance/**/*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        // Enforce CSP as in production; do not bypass security headers
        bypassCSP: false,
      },
    },
    {
      name: "scroll-colors-desktop",
      testMatch: "tests/scroll-colors/**/*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        bypassCSP: false,
      },
    },
    {
      name: "scroll-colors-mobile",
      testMatch: "tests/scroll-colors/**/*.spec.ts",
      use: {
        ...devices["Pixel 5"],
        bypassCSP: false,
      },
    },
    {
      // Real WebKit (Safari engine) — closest automated proxy for iOS Safari.
      // TC18–TC20 (native browser-chrome bar colour) still require a real device
      // or Xcode Simulator; everything else runs here.
      name: "scroll-colors-webkit",
      testMatch: "tests/scroll-colors/**/*.spec.ts",
      use: {
        ...devices["iPhone 12"],
        bypassCSP: false,
      },
    },
  ],
});
