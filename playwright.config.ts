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
        // Disable cache for accurate CWV measurements
        bypassCSP: false,
      },
    },
  ],
});
