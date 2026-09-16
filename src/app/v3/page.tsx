import type { Metadata } from "next";
import { stagingMetadata } from "@/config/site";
import { V3Nav } from "@/components/landing-v3/v3-nav";
import { V3Hero } from "@/components/landing-v3/v3-hero";
import { V3Example } from "@/components/landing-v3/v3-example";
import { V3Friction } from "@/components/landing-v3/v3-friction";
import { V3HowItWorks } from "@/components/landing-v3/v3-how-it-works";
import { V3Approach } from "@/components/landing-v3/v3-approach";
import { V3Cta } from "@/components/landing-v3/v3-cta";
import { V3Footer } from "@/components/landing-v3/v3-footer";

/** Unlinked variation: noindex, and deliberately absent from sitemap.ts. */
export const metadata: Metadata = stagingMetadata;

export default function V3Page() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-linen font-sans text-ink selection:bg-cobalt-wash selection:text-cobalt-deep">
      {/* Two scales of tooth. The coarse layer is what makes the ground read as
          cold-press stock rather than uniform noise. Both sit at z-0 and every
          section sits above them — critically, so does the hero photograph,
          because multiplying grain over the plate greys out exactly the warmth
          this direction exists for. */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-grain-coarse opacity-30 mix-blend-multiply" />
      <div className="pointer-events-none fixed inset-0 z-0 bg-grain opacity-40 mix-blend-multiply" />

      <V3Nav />
      <V3Hero />
      <V3Example />
      <V3Friction />
      <V3HowItWorks />
      <V3Approach />
      <V3Cta />
      <V3Footer />
    </div>
  );
}
