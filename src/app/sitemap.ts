import type { MetadataRoute } from "next";
import { ARCHETYPES } from "@/lib/persona/types";
import { absoluteUrl } from "@/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return [
    { url: absoluteUrl("/"), lastModified: now, priority: 1 },
    { url: absoluteUrl("/quiz"), lastModified: now, priority: 0.9 },
    ...ARCHETYPES.map((slug) => ({
      url: absoluteUrl(`/archetype/${slug}`),
      lastModified: now,
      priority: 0.8,
    })),
    { url: absoluteUrl("/privacy"), lastModified: now, priority: 0.2 },
    { url: absoluteUrl("/terms"), lastModified: now, priority: 0.2 },
    { url: absoluteUrl("/sms-policy"), lastModified: now, priority: 0.2 },
  ];
}
