import { Navigation } from "./navigation";
import { Hero, type HeroLayout } from "./hero";
import { Problem } from "./problem";
import { Introducing } from "./introducing";
import { Moment } from "./moment";
import { SignupSteps } from "./signup-steps";
import { FAQ } from "./faq";
import { BottomCTA } from "./bottom-cta";
import { Footer } from "./footer";
import { SignupVariantProvider } from "./signup-variant";
import type { SignupVariant } from "./signup-variant-config";
import type { MobileSceneOption } from "./hero-scene-mobile";

// One story, top to bottom: the promise, the familiar tension, what
// Entiremind is and what it makes room for, and how joining works. The FAQ
// comes after the final ask, for anyone still deciding.
//
// The page is the same for every signup variant; only how the asks collect
// a first name and email differs (see signup-variant.tsx).
export function LandingPage({
  variant,
  heroLayout = "copy-first",
  mobileScene,
}: {
  variant: SignupVariant;
  heroLayout?: HeroLayout;
  /** A phone-sized hero scene to try (see hero-scene-mobile.tsx). */
  mobileScene?: MobileSceneOption;
}) {
  return (
    <SignupVariantProvider variant={variant}>
      <div className="bg-linen text-ink font-sans min-h-screen relative overflow-x-hidden selection:bg-cobalt-wash selection:text-cobalt-deep">
        {/* Background Grain Texture */}
        <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grain mix-blend-multiply" />

        <Navigation />
        <Hero layout={heroLayout} mobileScene={mobileScene} />
        <Problem />
        <Introducing />
        <Moment />
        <SignupSteps />
        <BottomCTA />
        <FAQ />
        <Footer />
      </div>
    </SignupVariantProvider>
  );
}
