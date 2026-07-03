"use client";

import { useReportWebVitals } from "next/web-vitals";
import posthog from "posthog-js";

export function WebVitals() {
  useReportWebVitals((metric) => {
    posthog.capture("web_vitals", {
      metric_name: metric.name,
      // CLS × 1000 so all metrics are stored as integers; compare against 100 (Good) / 250 (Needs Improvement)
      value: Math.round(
        metric.name === "CLS" ? metric.value * 1000 : metric.value,
      ),
      rating: metric.rating,
      id: metric.id,
    });
  });

  return null;
}
