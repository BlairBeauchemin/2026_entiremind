import { Navigation } from "@/components/landing/navigation";
import { SacredHero } from "@/components/landing-v2/sacred-hero";
import { SacredValues } from "@/components/landing-v2/sacred-values";
import { SacredLoop } from "@/components/landing-v2/sacred-loop";
import { SacredTestimonial } from "@/components/landing-v2/sacred-testimonial";
import { SacredCTA } from "@/components/landing-v2/sacred-cta";
import { SacredFooter } from "@/components/landing-v2/sacred-footer";

export default function LandingV2() {
  return (
    <div className="bg-gradient-to-b from-cream to-em-purple-100/30 text-teal-900 font-sans min-h-screen relative overflow-x-hidden selection:bg-em-purple-300/30 selection:text-teal-900">
      {/* Background Grain Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-30 bg-grain mix-blend-multiply" />

      <Navigation />
      <SacredHero />
      <SacredValues />
      <SacredLoop />
      <SacredTestimonial />
      <SacredCTA />
      <SacredFooter />
    </div>
  );
}
