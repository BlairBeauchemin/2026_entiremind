/**
 * Central site/brand configuration — the single place new code should read
 * product identity from. Existing hardcoded "Entiremind" strings migrate here
 * opportunistically as files are touched; when spinning this codebase up for
 * a new business idea, start by editing this file.
 */
export const siteConfig = {
  name: "Entiremind",
  tagline: "Manifest what matters, one text at a time",
  description:
    "A lightly magical SMS-based system that helps you align your thoughts, intentions, and actions to manifest your goals and dreams.",
  url: "https://www.entiremind.com",
  supportEmail: "support@entiremind.com",
  keywords: ["manifestation", "mindset", "SMS", "intentions", "goals"],
  gtmId: "GTM-WBJQRSNT",
} as const;

/** Absolute URL for a site path (for metadata, share links, emails). */
export function absoluteUrl(path: string): string {
  return new URL(path, siteConfig.url).toString();
}
