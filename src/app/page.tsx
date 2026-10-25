import { Navigation } from "@/components/landing/navigation";
import { Hero } from "@/components/landing/hero";
import { Problem } from "@/components/landing/problem";
import { ListensBack } from "@/components/landing/listens-back";
import { Remembered } from "@/components/landing/remembered";
import { QuizInvite } from "@/components/landing/quiz-invite";
import { FAQ } from "@/components/landing/faq";
import { BottomCTA } from "@/components/landing/bottom-cta";
import { Footer } from "@/components/landing/footer";

export default function Home() {
  return (
    <div className="bg-linen text-ink font-sans min-h-screen relative overflow-x-hidden selection:bg-cobalt-wash selection:text-cobalt-deep">
      {/* Background Grain Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grain mix-blend-multiply" />

      <Navigation />
      <Hero />
      <Problem />
      <ListensBack />
      <Remembered />
      <QuizInvite />
      <FAQ />
      <BottomCTA />
      <Footer />
    </div>
  );
}
