"use client";

import { AlertTriangle } from "lucide-react";

/**
 * Top-level boundary that catches errors thrown in the root layout itself.
 * Must render its own <html>/<body> because it replaces the whole document.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "1rem",
            color: "#0f172a",
          }}
        >
          <AlertTriangle width={48} height={48} color="#dc2626" />
          <h1 style={{ fontSize: "1.25rem", fontWeight: 600, marginTop: "1rem" }}>
            The application hit an unexpected error
          </h1>
          <p style={{ color: "#64748b", marginTop: "0.5rem", maxWidth: 420 }}>
            Please try again. If the problem persists, contact support.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              background: "hsl(224 71% 56%)",
              color: "#fff",
              border: "none",
              borderRadius: "0.5rem",
              padding: "0.625rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
