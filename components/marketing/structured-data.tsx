import { siteConfig } from "@/lib/site";

/**
 * JSON-LD structured data for Google rich results.
 * Renders Organization, SoftwareApplication, and FAQPage schemas.
 * `faqs` should match the FAQ section content one-to-one.
 */
export function StructuredData({ faqs }: { faqs: { q: string; a: string }[] }) {
  const graph = [
    {
      "@type": "Organization",
      "@id": `${siteConfig.url}/#organization`,
      name: siteConfig.legalName,
      url: siteConfig.url,
      logo: `${siteConfig.url}/favicon.ico`,
      email: siteConfig.contactEmail,
      sameAs: [siteConfig.social.linkedin],
    },
    {
      "@type": "WebSite",
      "@id": `${siteConfig.url}/#website`,
      url: siteConfig.url,
      name: siteConfig.name,
      description: siteConfig.shortDescription,
      publisher: { "@id": `${siteConfig.url}/#organization` },
    },
    {
      "@type": "SoftwareApplication",
      name: siteConfig.name,
      applicationCategory: "HealthApplication",
      operatingSystem: "Web",
      description: siteConfig.description,
      url: siteConfig.url,
      offers: [
        {
          "@type": "Offer",
          name: "Starter",
          price: "0",
          priceCurrency: "INR",
          description: "Free for solo practices, up to 3 doctors.",
        },
        {
          "@type": "Offer",
          name: "Professional",
          price: "2999",
          priceCurrency: "INR",
          description: "For growing clinics with unlimited doctors.",
        },
      ],
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.8",
        ratingCount: "120",
      },
    },
    {
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  ];

  const json = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return (
    <script
      type="application/ld+json"
      // Controlled, static content — safe to inline.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
