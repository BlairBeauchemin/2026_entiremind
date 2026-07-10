import Link from "next/link";
import { Sparkles } from "lucide-react";

/**
 * Post-checkout landing for the tokenized SMS upgrade flow. The user's
 * browser has no session here and doesn't need one — the Stripe webhook
 * activates the subscription, and the next daily-send sees "paid".
 */
export default function WelcomeBackPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-em-purple-100 to-white flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md space-y-8 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-em-yellow-400/20">
          <Sparkles className="h-7 w-7 text-em-purple-400" />
        </span>

        <div className="space-y-3">
          <h1 className="font-serif text-3xl md:text-4xl text-navy font-medium">
            You&apos;re in
          </h1>
          <p className="text-teal-900/70 leading-relaxed">
            Your daily messages resume tomorrow morning. Nothing else to do —
            just reply when something lands.
          </p>
        </div>

        <Link
          href="/auth"
          className="inline-block text-sm text-teal-900/60 underline underline-offset-4 hover:text-navy"
        >
          Sign in to your dashboard
        </Link>
      </div>
    </main>
  );
}
