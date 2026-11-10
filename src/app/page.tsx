import { LandingPage } from "@/components/landing/landing-page";
import { resolveSignupVariant } from "@/components/landing/signup-variant-config";

// The home page uses the signup variant chosen in Vercel
// (NEXT_PUBLIC_SIGNUP_VARIANT: "form", the default, or "modal").
// /lp/form and /lp/modal pin one each, for ads and side-by-side tests.
export default function Home() {
  return (
    <LandingPage
      variant={resolveSignupVariant(process.env.NEXT_PUBLIC_SIGNUP_VARIANT)}
    />
  );
}
