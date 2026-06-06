/**
 * Central site configuration — single source of truth for brand identity,
 * URLs, navigation, and marketing copy. Update here and it propagates to
 * the marketing site, SEO metadata, sitemap, robots, and structured data.
 */

const rawUrl =
  process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://medisync.app";

export const siteConfig = {
  name: "MediSync",
  legalName: "MediSync",
  // Short, human positioning — not a keyword soup.
  tagline: "Speak the consult. The paperwork writes itself.",
  description:
    "MediSync is the voice-first clinic operating system. Doctors dictate the prescription and the visit summary out loud; reception handles registration and billing; admins run every clinic from one place. Built for single practices and multi-clinic groups.",
  shortDescription:
    "Voice-first clinic management for prescriptions, patient records, billing, and multi-clinic teams.",
  url: rawUrl,
  ogImage: `${rawUrl}/og.png`,
  locale: "en_IN",
  // Used in JSON-LD and the footer.
  contactEmail: "hello@medisync.app",
  social: {
    twitter: "@medisync",
    linkedin: "https://www.linkedin.com/company/medisync",
  },
  // SEO keywords (kept tight and relevant — quality over quantity).
  keywords: [
    "voice prescription software",
    "AI clinic management software",
    "EMR software India",
    "multi-clinic management software",
    "voice to prescription",
    "clinic billing software",
    "doctor dictation software",
    "patient management system",
    "OPD management software",
    "electronic medical records",
  ],
} as const;

/** Primary marketing navigation (anchors within the homepage). */
export const marketingNav = [
  { label: "Features", href: "#features" },
  { label: "How it works", href: "#how-it-works" },
  { label: "For your team", href: "#teams" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
] as const;

/** Footer link groups. */
export const footerNav = {
  Product: [
    { label: "Features", href: "#features" },
    { label: "How it works", href: "#how-it-works" },
    { label: "Pricing", href: "#pricing" },
    { label: "Sign in", href: "/login" },
  ],
  Company: [
    { label: "About", href: "#teams" },
    { label: "Contact", href: `mailto:${siteConfig.contactEmail}` },
    { label: "Start free", href: "/signup" },
  ],
  Legal: [
    { label: "Privacy", href: "/privacy" },
    { label: "Terms", href: "/terms" },
    { label: "Data security", href: "#faq" },
  ],
} as const;
