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
    {
      name: "navigation-desktop",
      testMatch: "tests/navigation/**/*.spec.ts",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 1280, height: 800 },
        bypassCSP: false,
      },
    },
    {
      name: "navigation-mobile",
      testMatch: "tests/navigation/**/*.spec.ts",
      use: {
        ...devices["Pixel 5"],
        bypassCSP: false,
      },
    },
    {
      // WebKit (Safari engine) — closest automated proxy for iOS Safari.
      name: "navigation-webkit",
      testMatch: "tests/navigation/**/*.spec.ts",
      use: {
        ...devices["iPhone 12"],
        bypassCSP: false,
      },
    },
    {
      // Desktop WebKit (Safari engine) — the desktop AC target.
      name: "navigation-webkit-desktop",
      testMatch: "tests/navigation/**/*.spec.ts",
      use: {
        ...devices["Desktop Safari"],
        viewport: { width: 1280, height: 800 },
        bypassCSP: false,
      },
    },
  ],
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
      },
});
