"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

export function LeadCaptureForm({
  variant = "hero",
}: {
  variant?: "hero" | "pricing";
}) {
  const [phone, setPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "", phone }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Something went wrong");
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 px-6 py-4 rounded-full bg-white/80 shadow-md max-w-md"
      >
        <div className="w-8 h-8 rounded-full bg-teal-900/10 flex items-center justify-center">
          <svg
            className="w-4 h-4 text-teal-900"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <span className="text-teal-900 font-medium font-sans">
          You&apos;re in the loop!
        </span>
      </motion.div>
    );
  }

  if (variant === "pricing") {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2 text-left">
          <label className="text-xs font-medium text-teal-900 ml-4 uppercase tracking-wider">
            Phone Number
          </label>
          <input
            type="tel"
            placeholder="(555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-autofill-fix w-full pl-6 pr-4 py-3.5 bg-white/60 border border-teal-900/10 rounded-full focus:outline-none focus:ring-1 focus:ring-navy/30 focus:border-navy/30 text-teal-900 placeholder-teal-900/50 transition-all font-sans font-light"
            required
          />
        </div>
        <div className="space-y-2 text-left">
          <label className="text-xs font-medium text-teal-900 ml-4 uppercase tracking-wider">
            Email (optional)
          </label>
          <input
            type="email"
            placeholder="you@example.com"
            className="input-autofill-fix w-full pl-6 pr-4 py-3.5 bg-white/60 border border-teal-900/10 rounded-full focus:outline-none focus:ring-1 focus:ring-navy/30 focus:border-navy/30 text-teal-900 placeholder-teal-900/50 transition-all font-sans font-light"
          />
        </div>
        <label className="flex items-start gap-3 cursor-pointer text-left">
          <input
            type="checkbox"
            checked={smsConsent}
            onChange={(e) => setSmsConsent(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-teal-900/20 text-navy focus:ring-navy/30"
            required
          />
          <span className="text-xs text-teal-900/70 leading-relaxed">
            I agree to receive up to 14 SMS messages per week from Entiremind.
            Message and data rates may apply. Reply STOP to cancel. View our{" "}
            <Link href="/privacy" className="underline hover:text-teal-900">
              Privacy Policy
            </Link>{" "}
            and{" "}
            <Link href="/terms" className="underline hover:text-teal-900">
              Terms of Service
            </Link>
            .
          </span>
        </label>
        <button
          type="submit"
          disabled={isSubmitting || !smsConsent}
          className="w-full bg-navy text-cream py-4 rounded-full font-medium hover:bg-navy/90 hover:shadow-lg hover:shadow-navy/10 transition-all duration-300 font-sans disabled:opacity-50"
        >
          {isSubmitting ? "Joining..." : "Reserve My Spot"}
        </button>
        {error && (
          <p className="text-sm text-red-500 text-center">{error}</p>
        )}
        <p className="text-xs text-teal-900/60 text-center font-sans">
          Your number is kept private. No spam, ever.
        </p>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto lg:mx-0 space-y-4 pt-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-grow">
          <input
            type="tel"
            placeholder="(555) 000-0000"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="input-autofill-fix w-full pl-6 pr-4 py-3.5 bg-white/60 border border-teal-900/10 rounded-full focus:outline-none focus:ring-1 focus:ring-teal-900/30 focus:border-teal-900/30 text-teal-900 placeholder-teal-900/50 transition-all font-sans font-light"
            required
          />
        </div>
        <button
          type="submit"
          disabled={isSubmitting || !smsConsent}
          className="bg-navy text-cream px-8 py-3.5 rounded-full font-medium hover:bg-navy/90 hover:shadow-lg hover:shadow-navy/10 transition-all duration-300 whitespace-nowrap font-sans disabled:opacity-50"
        >
          {isSubmitting ? "Joining..." : "Begin the Loop"}
        </button>
      </div>
      <label className="flex items-start gap-3 cursor-pointer text-left pl-1">
        <input
          type="checkbox"
          checked={smsConsent}
          onChange={(e) => setSmsConsent(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-teal-900/20 text-navy focus:ring-navy/30"
          required
        />
        <span className="text-xs text-teal-900/70 leading-relaxed">
          I agree to receive up to 14 SMS messages per week. Message and data
          rates may apply. Reply STOP to cancel. View our{" "}
          <Link href="/privacy" className="underline hover:text-teal-900">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/terms" className="underline hover:text-teal-900">
            Terms
          </Link>
          .
        </span>
      </label>
      {error && (
        <p className="text-sm text-red-500 text-center lg:text-left pl-6">
          {error}
        </p>
      )}
    </form>
  );
}
