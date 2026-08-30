import { Navigation } from "@/components/landing/navigation";
import { Footer } from "@/components/landing/footer";
import { Check } from "lucide-react";

export const metadata = {
  title: "You're on the list | Entiremind",
  description: "Thank you for joining the Entiremind waitlist.",
};

export default function ThankYouPage() {
  return (
    <div className="bg-linen text-ink font-sans min-h-screen relative overflow-x-hidden selection:bg-cobalt-wash selection:text-cobalt-deep">
      {/* Background Grain Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grain mix-blend-multiply" />

      {/* Ambient Background Gradients */}

      <Navigation />

      <main className="relative z-10 py-40 px-6">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-cobalt-wash flex items-center justify-center mx-auto mb-8">
            <Check className="w-8 h-8 text-ink" />
          </div>

          <h1 className="font-serif text-display text-ink mb-6">
            You&apos;re on the list
          </h1>

          <p className="text-lg text-muted font-light leading-relaxed mb-4">
            We&apos;ll text you when it&apos;s your turn to begin the loop.
          </p>

          <p className="text-sm text-muted font-light">
            Keep an eye on your inbox for updates.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
