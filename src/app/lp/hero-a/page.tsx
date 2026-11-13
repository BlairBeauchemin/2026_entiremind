import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/landing-page";

// The full landing page (form variant, phone-first hero) with hero option A
// on phones: a bigger, bare phone with the live photo layout. Desktop is the
// same as /. Kept out of search results: / is the canonical copy.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  robots: { index: false, follow: true },
};

export default function LandingPageHeroA() {
  return (
    <LandingPage variant="form" heroLayout="phone-first" mobileScene="a" />
  );
}
