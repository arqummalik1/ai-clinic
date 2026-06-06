import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/site";

export const alt = `${siteConfig.name} — voice-first clinic management`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Brand hex values mirror the design tokens in globals.css (brand-600/800).
export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background: "linear-gradient(135deg, #2748c8 0%, #1b3a8f 60%, #16306f 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "72px",
              height: "72px",
              borderRadius: "18px",
              background: "rgba(255,255,255,0.16)",
              fontSize: "44px",
              fontWeight: 700,
            }}
          >
            M
          </div>
          <div style={{ fontSize: "40px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            {siteConfig.name}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div
            style={{
              fontSize: "76px",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: "920px",
            }}
          >
            Speak the consult. The paperwork writes itself.
          </div>
          <div style={{ fontSize: "32px", color: "rgba(255,255,255,0.82)", maxWidth: "880px" }}>
            Voice prescriptions, billing, patient records, and multi-clinic teams in one platform.
          </div>
        </div>

        <div style={{ display: "flex", gap: "16px", fontSize: "26px", color: "rgba(255,255,255,0.9)" }}>
          <span>Voice prescriptions</span>
          <span>·</span>
          <span>Multi-clinic</span>
          <span>·</span>
          <span>Front-desk billing</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
