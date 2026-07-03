/** @type {import('@lhci/cli').LighthouseRcConfig} */
module.exports = {
  ci: {
    collect: {
      url: [
        process.env.LHCI_BASE_URL
          ? `${process.env.LHCI_BASE_URL}/nl`
          : "https://udocu-next.vercel.app/nl",
        process.env.LHCI_BASE_URL
          ? `${process.env.LHCI_BASE_URL}/en`
          : "https://udocu-next.vercel.app/en",
        process.env.LHCI_BASE_URL
          ? `${process.env.LHCI_BASE_URL}/nl/work`
          : "https://udocu-next.vercel.app/nl/work",
        process.env.LHCI_BASE_URL
          ? `${process.env.LHCI_BASE_URL}/nl/contact`
          : "https://udocu-next.vercel.app/nl/contact",
      ],
      numberOfRuns: 3,
      settings: {
        // Desktop preset — no CPU/network throttling
        preset: "desktop",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["warn", { minScore: 0.85 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["warn", { minScore: 0.9 }],
        "categories:seo": ["warn", { minScore: 0.9 }],
        "first-contentful-paint": ["warn", { maxNumericValue: 2000 }],
        "largest-contentful-paint": ["warn", { maxNumericValue: 3000 }],
        "cumulative-layout-shift": ["warn", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["warn", { maxNumericValue: 300 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
