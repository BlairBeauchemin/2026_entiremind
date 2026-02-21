import { Navigation } from "@/components/landing/navigation";
import { Footer } from "@/components/landing/footer";
import { Check } from "lucide-react";

export const metadata = {
  title: "You're on the list | Entiremind",
  description: "Thank you for joining the Entiremind waitlist.",
};

export default function ThankYouPage() {
  return (
    <div className="bg-cream text-teal-900 font-sans min-h-screen relative overflow-x-hidden selection:bg-em-purple-300/30 selection:text-teal-900">
      {/* Background Grain Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grain mix-blend-multiply" />

      {/* Ambient Background Gradients */}
      <div className="fixed top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-em-purple-300/15 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-em-yellow-400/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <Navigation />

      <main className="relative z-10 py-40 px-6">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-navy/10 flex items-center justify-center mx-auto mb-8">
            <Check className="w-8 h-8 text-navy" />
          </div>

          <h1 className="font-serif text-4xl md:text-5xl text-navy font-medium mb-6">
            You&apos;re on the list
          </h1>

          <p className="text-lg text-teal-900/70 font-light leading-relaxed mb-4">
            We&apos;ll text you when it&apos;s your turn to begin the loop.
          </p>

          <p className="text-sm text-teal-900/50 font-light">
            Keep an eye on your inbox for updates.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
