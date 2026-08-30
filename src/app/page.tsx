import { Navigation } from "@/components/landing/navigation";
import { Hero } from "@/components/landing/hero";
import { Philosophy } from "@/components/landing/philosophy";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonials } from "@/components/landing/testimonials";
import { Pricing } from "@/components/landing/pricing";
import { BottomCTA } from "@/components/landing/bottom-cta";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="bg-linen text-ink font-sans min-h-screen relative overflow-x-hidden selection:bg-cobalt-wash selection:text-cobalt-deep">
      {/* Background Grain Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grain mix-blend-multiply" />

      {/* Ambient Background Gradients */}

      <Navigation />
      <Hero />
      <Philosophy />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <BottomCTA />
      <Footer />
    </div>
  );
}
