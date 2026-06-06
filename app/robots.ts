import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        // Keep authenticated product surfaces and API routes out of the index.
        disallow: [
          "/api/",
          "/auth/",
          "/super-admin/",
          "/clinic-admin/",
          "/doctor/",
          "/reception/",
        ],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
