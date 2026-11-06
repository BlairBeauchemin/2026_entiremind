import { Navigation } from "@/components/landing/navigation";
import { Hero } from "@/components/landing/hero";
import { Problem } from "@/components/landing/problem";
import { Introducing } from "@/components/landing/introducing";
import { Moment } from "@/components/landing/moment";
import { SignupSteps } from "@/components/landing/signup-steps";
import { FAQ } from "@/components/landing/faq";
import { BottomCTA } from "@/components/landing/bottom-cta";
import { Footer } from "@/components/landing/footer";

// One story, top to bottom: the promise, the familiar tension, what
// Entiremind is and what it makes room for, and how joining works. The FAQ
// comes after the final ask, for anyone still deciding.
export default function Home() {
  return (
    <div className="bg-linen text-ink font-sans min-h-screen relative overflow-x-hidden selection:bg-cobalt-wash selection:text-cobalt-deep">
      {/* Background Grain Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grain mix-blend-multiply" />

      <Navigation />
      <Hero />
      <Problem />
      <Introducing />
      <Moment />
      <SignupSteps />
      <BottomCTA />
      <FAQ />
      <Footer />
    </div>
  );
}
