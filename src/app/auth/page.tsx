"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { EmailAuthForm } from "@/components/auth/email-auth-form";
import { EmailSentConfirmation } from "@/components/auth/email-sent-confirmation";
import { GoogleAuthButton } from "@/components/auth/google-auth-button";

type AuthStep = "email" | "sent";

export default function AuthPage() {
  const [step, setStep] = useState<AuthStep>("email");
  const [email, setEmail] = useState("");

  const handleEmailSent = (emailAddress: string) => {
    setEmail(emailAddress);
    setStep("sent");
  };

  const handleBack = () => {
    setStep("email");
  };

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
              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="font-serif text-2xl md:text-3xl text-navy font-medium mb-2">
                  {step === "email" ? "Welcome" : "Check your email"}
                </h1>
                <p className="text-sm text-teal-900/60">
                  {step === "email"
                    ? "Enter your email to continue"
                    : "We sent you a magic link"}
                </p>
              </div>

              {/* Form */}
              {step === "email" ? (
                <div className="space-y-6">
                  <GoogleAuthButton />

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-teal-900/10" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white/40 px-3 text-teal-900/40">
                        or
                      </span>
                    </div>
                  </div>

                  <EmailAuthForm onEmailSent={handleEmailSent} />
                </div>
              ) : (
                <EmailSentConfirmation email={email} onBack={handleBack} />
              )}
            </motion.div>

            {/* Footer text */}
            <p className="text-xs text-center text-teal-900/40 mt-6">
              By continuing, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-teal-900/60">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-teal-900/60">
                Privacy Policy
              </Link>
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
