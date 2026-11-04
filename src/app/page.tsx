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
// Entiremind is and what it makes room for, and how joining works.
export default function Home() {
  return (
    <div className="bg-linen text-ink font-sans min-h-screen relative overflow-x-hidden selection:bg-cobalt-wash selection:text-cobalt-deep">
      {/* Background Grain Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grain mix-blend-multiply" />

      <Navigation />
      <Hero />
      <Problem />
      <Introducing />
      <Moment label="Option A · Sketching by the window" />
      <Moment
        label="Option B · Reading her text"
        src="/marketing/hero/studio-woman-phone.webp"
        alt="A woman at a sunlit table by the window, smiling as she reads a text on her phone"
      />
      {/* Options C–F: free stock photos (Pexels License: free for commercial
          use, no attribution required), cropped to 4:5. Photo ids in the
          filenames: pexels.com/photo/<id>. */}
      <Moment
        label="Option C · Pexels · By the window"
        src="/marketing/hero/pexels-phone-7269428.webp"
        alt="A woman sitting by a tall window with a mug, reading her phone"
      />
      <Moment
        label="Option D · Pexels · Smiling at her phone"
        src="/marketing/hero/pexels-phone-6697318.webp"
        alt="A woman in a soft sweater smiling as she reads her phone"
      />
      <Moment
        label="Option E · Pexels · Morning light, coffee"
        src="/marketing/hero/pexels-phone-7329675.webp"
        alt="A woman in the morning sun by a window, holding a coffee and her phone"
      />
      <Moment
        label="Option F · Pexels · Hands, coffee, flower"
        src="/marketing/hero/pexels-phone-7339209.webp"
        alt="Hands holding a phone at a wooden table beside a cup and a pink flower"
      />
      <SignupSteps />
      <FAQ />
      <BottomCTA />
      <Footer />
    </div>
  );
}
