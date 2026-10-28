import { Navigation } from "@/components/landing/navigation";
import { Hero } from "@/components/landing/hero";
import { Problem } from "@/components/landing/problem";
import { ProductDemo } from "@/components/landing/product-demo";
import { FAQ } from "@/components/landing/faq";
import { BottomCTA } from "@/components/landing/bottom-cta";
import { Footer } from "@/components/landing/footer";

// One story, top to bottom: the promise, the familiar problem, the
// experience, and how to join.
export default function Home() {
  return (
    <div className="bg-linen text-ink font-sans min-h-screen relative overflow-x-hidden selection:bg-cobalt-wash selection:text-cobalt-deep">
      {/* Background Grain Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grain mix-blend-multiply" />

      <Navigation />
      <Hero />
      <Problem />
      <ProductDemo />
      <FAQ />
      <BottomCTA />
      <Footer />
    </div>
  );
}
