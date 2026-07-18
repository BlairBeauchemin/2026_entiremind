import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // /u/* already carries X-Robots-Tag: noindex via next.config; listed
      // here too so crawlers skip the tokenized links entirely.
      disallow: ["/dashboard", "/onboarding", "/auth", "/api/", "/u/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
