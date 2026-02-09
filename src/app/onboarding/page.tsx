"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-cream text-teal-900 font-sans relative selection:bg-em-purple-300/30 selection:text-teal-900">
      {/* Background grain */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grain mix-blend-multiply" />

      {/* Ambient gradients */}
      <div className="fixed top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-em-purple-300/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-em-yellow-400/8 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6">
          <Link
            href="/"
            className="font-serif text-2xl font-medium tracking-[2px] text-navy"
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
              className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 p-8"
            >
              <OnboardingFlow />
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}
