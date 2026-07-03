import { test, expect } from "@playwright/test";

// CWV "Good" thresholds per web.dev/vitals
const THRESHOLDS = {
  LCP: 2500, // ms — Largest Contentful Paint
  FCP: 1800, // ms — First Contentful Paint
  CLS: 0.1, // score — Cumulative Layout Shift
};

async function collectVitals(page: import("@playwright/test").Page) {
  await page.goto("/nl", { waitUntil: "load" });

  return page.evaluate(() => {
    return new Promise<{ lcp: number; fcp: number; cls: number }>((resolve) => {
      const result = { lcp: 0, fcp: 0, cls: 0 };

      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        if (entries.length) result.lcp = entries[entries.length - 1].startTime;
      }).observe({ type: "largest-contentful-paint", buffered: true });

      new PerformanceObserver((list) => {
        const fcp = list
          .getEntries()
          .find((e) => e.name === "first-contentful-paint");
        if (fcp) result.fcp = fcp.startTime;
      }).observe({ type: "paint", buffered: true });

      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const ls = entry as PerformanceEntry & {
            hadRecentInput: boolean;
            value: number;
          };
          if (!ls.hadRecentInput) result.cls += ls.value;
        }
      }).observe({ type: "layout-shift", buffered: true });

      // Give observers time to flush all buffered entries
      setTimeout(() => resolve(result), 1000);
    });
  });
}

test.describe("Core Web Vitals — homepage (/nl)", () => {
  test("LCP is within Good threshold (<2.5s)", async ({ page }) => {
    const { lcp } = await collectVitals(page);
    expect(
      lcp,
      "LCP was not observed (0ms) — check page content",
    ).toBeGreaterThan(0);
    expect(
      lcp,
      `LCP was ${lcp}ms (threshold: ${THRESHOLDS.LCP}ms)`,
    ).toBeLessThan(THRESHOLDS.LCP);
  });

  test("FCP is within Good threshold (<1.8s)", async ({ page }) => {
    const { fcp } = await collectVitals(page);
    expect(
      fcp,
      "FCP was not observed (0ms) — check page content",
    ).toBeGreaterThan(0);
    expect(
      fcp,
      `FCP was ${fcp}ms (threshold: ${THRESHOLDS.FCP}ms)`,
    ).toBeLessThan(THRESHOLDS.FCP);
  });

  test("CLS is within Good threshold (<0.1)", async ({ page }) => {
    const { cls } = await collectVitals(page);
    expect(
      cls,
      `CLS was ${cls.toFixed(3)} (threshold: ${THRESHOLDS.CLS})`,
    ).toBeLessThan(THRESHOLDS.CLS);
  });
});
