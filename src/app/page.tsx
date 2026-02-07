import { Navigation } from "@/components/landing/navigation";
import { Hero } from "@/components/landing/hero";
import { TrustStrip } from "@/components/landing/trust-strip";
import { Philosophy } from "@/components/landing/philosophy";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Testimonials } from "@/components/landing/testimonials";
import { Pricing } from "@/components/landing/pricing";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="bg-cream text-teal-900 font-sans min-h-screen relative overflow-x-hidden selection:bg-em-purple-300/30 selection:text-teal-900">
      {/* Background Grain Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grain mix-blend-multiply" />

      {/* Ambient Background Gradients */}
      <div className="fixed top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-em-purple-300/15 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-em-yellow-400/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <Navigation />
      <Hero />
      <TrustStrip />
      <Philosophy />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <Footer />
    </div>
  );
}
