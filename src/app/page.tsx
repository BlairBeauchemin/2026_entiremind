import { Navigation } from "@/components/landing/navigation";
import { Hero } from "@/components/landing/hero";
import { Problem } from "@/components/landing/problem";
import { Introducing } from "@/components/landing/introducing";
import { SignupSteps } from "@/components/landing/signup-steps";
import { FAQ } from "@/components/landing/faq";
import { BottomCTA } from "@/components/landing/bottom-cta";
import { Footer } from "@/components/landing/footer";

// One story, top to bottom: the promise, the familiar tension, what
// Entiremind is and what it makes room for, and how joining works.
export default function Home() {
  return (
    <div className="bg-linen text-ink font-sans min-h-screen relative overflow-x-hidden selection:bg-cobalt-wash selection:text-cobalt-deep">
      {/* Background Grain Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grain mix-blend-multiply" />

      <Navigation />
      <Hero
        label="Option A · Claude's suggestion"
        subhead="Lightly magical texts that weave reflection and inspiration into your day, and help turn your intentions into reality."
      />
      <div className="relative z-10 border-t-4 border-cobalt" />
      <Hero
        label="Option B · Your version"
        subhead="Weave reflection, gratitude, and inspiration into your day with texts that help turn your intentions into reality."
      />
      <Problem />
      <Introducing />
      <SignupSteps />
      <FAQ />
      <BottomCTA />
      <Footer />
    </div>
  );
}
