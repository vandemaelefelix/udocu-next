"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          textAlign: "center",
          fontFamily:
            '"EB Garamond", Garamond, "Times New Roman", Times, serif',
          margin: 0,
          background: "#fff",
          color: "#111",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(64px, 12vw, 120px)",
            fontWeight: 900,
            lineHeight: 1,
            margin: "0 0 1rem",
          }}
        >
          500
        </h1>
        <p
          style={{ fontSize: "1.5rem", fontWeight: 600, margin: "0 0 0.5rem" }}
        >
          Something went wrong
        </p>
        <p style={{ fontSize: "1.125rem", opacity: 0.7, margin: "0 0 2rem" }}>
          An unexpected error occurred. Please try again.
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            background: "transparent",
            border: 0,
            font: "inherit",
            fontSize: "0.875rem",
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            textDecoration: "underline",
            textUnderlineOffset: "0.25rem",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
