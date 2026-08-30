"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";
import { SignUpTracker } from "@/components/analytics/sign-up-tracker";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-linen text-ink font-sans relative selection:bg-cobalt-wash selection:text-cobalt-deep">
      <SignUpTracker />
      {/* Background grain */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grain mix-blend-multiply" />

      {/* Ambient gradients */}

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6">
          <Link
            href="/"
            className="font-serif text-2xl tracking-[2px] text-ink"
          >
            Entiremind
          </Link>
        </header>

        {/* Main content */}
        <main className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="bg-surface rounded-sm border border-rule p-8"
            >
              <OnboardingFlow />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
