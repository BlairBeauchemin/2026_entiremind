import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

// The landing page pinned to the "modal" signup variant, for ads and
// side-by-side tests (see signup-variant.tsx). Kept out of search results:
// the home page is the canonical copy.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  robots: { index: false, follow: true },
};

export default function LandingPageModal() {
  return <LandingPage variant="modal" />;
}
