import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

// The landing page with the "form" signup variant and the phone-first hero:
// on phones the phone scene comes right after the headline, and a bottom bar
// asks while the hero form is off screen. For ads and side-by-side tests
// against /lp/form. Kept out of search results: / is the canonical copy.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  robots: { index: false, follow: true },
};

export default function LandingPagePhoneFirst() {
  return <LandingPage variant="form" heroLayout="phone-first" stickyJoin />;
}
