"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import {
  formatPhoneInput,
  cleanPhoneNumber,
  isValidUSPhone,
} from "@/lib/utils/phone";

const SMS_CONSENT_LANGUAGE =
  "I agree to receive recurring automated SMS messages from Entiremind (up to 2 msgs/day depending on engagement). Msg & data rates may apply. Reply STOP to cancel. Consent not required for purchase.";

interface WaitlistModalSingleProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WaitlistModalSingle({
  isOpen,
  onClose,
}: WaitlistModalSingleProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [termsConsent, setTermsConsent] = useState(false);
  const [smsConsent, setSmsConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    if (!isValidUSPhone(phone)) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: cleanPhoneNumber(phone),
          smsConsent,
          smsConsentLanguage: smsConsent ? SMS_CONSENT_LANGUAGE : null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Something went wrong");
      }

      router.push("/thank-you");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName("");
    setEmail("");
    setPhone("");
    setTermsConsent(false);
    setSmsConsent(false);
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 z-50"
          />

          {/* Modal */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="waitlist-modal-title"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8 mx-4">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-6 right-6 text-teal-900/30 hover:text-teal-900 transition-colors"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>

              <h2
                id="waitlist-modal-title"
                className="font-serif text-2xl text-navy font-medium text-center mb-2"
              >
                Join the Waitlist
              </h2>
              <p className="text-sm text-teal-900/60 text-center mb-6">
                Be the first to experience Entiremind via SMS.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-teal-900 mb-2 ml-1 uppercase tracking-wider">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="input-autofill-fix w-full px-4 py-3 bg-cream/50 border border-teal-900/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 text-teal-900 placeholder-teal-900/40 transition-all font-sans"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-teal-900 mb-2 ml-1 uppercase tracking-wider">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-autofill-fix w-full px-4 py-3 bg-cream/50 border border-teal-900/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 text-teal-900 placeholder-teal-900/40 transition-all font-sans"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-teal-900 mb-2 ml-1 uppercase tracking-wider">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneInput(e.target.value))}
                    placeholder="(555) 000-0000"
                    className="input-autofill-fix w-full px-4 py-3 bg-cream/50 border border-teal-900/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 text-teal-900 placeholder-teal-900/40 transition-all font-sans"
                    required
                  />
                </div>

                {/* SMS consent checkbox - optional per Twilio compliance */}
                <div className="pt-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smsConsent}
                      onChange={(e) => setSmsConsent(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-teal-900/20 text-navy focus:ring-navy/30"
                    />
                    <span className="text-xs text-teal-900/70 leading-relaxed">
                      I agree to receive recurring automated SMS messages from
                      Entiremind (up to 2 msgs/day depending on engagement).
                    </span>
                  </label>
                  <p className="text-[10px] text-teal-900/50 leading-relaxed mt-1.5 ml-7 max-w-[280px]">
                    Msg &amp; data rates may apply. Reply STOP to cancel.
                    Consent not required for purchase.
                  </p>
                </div>

                {/* Terms checkbox - optional per Twilio compliance */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={termsConsent}
                    onChange={(e) => setTermsConsent(e.target.checked)}
                    className="mt-1 w-4 h-4 rounded border-teal-900/20 text-navy focus:ring-navy/30"
                  />
                  <span className="text-xs text-teal-900/70 leading-relaxed">
                    I agree to the{" "}
                    <Link
                      href="/terms"
                      className="underline hover:text-teal-900"
                      target="_blank"
                    >
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link
                      href="/privacy"
                      className="underline hover:text-teal-900"
                      target="_blank"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>

                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-navy text-cream py-3.5 rounded-xl font-medium hover:bg-navy/90 transition-all duration-300 font-sans disabled:opacity-50"
                >
                  {isSubmitting ? "Submitting..." : "Reserve My Spot"}
                </button>

                {/* Implied consent text near submit button */}
                <p className="text-[10px] text-teal-900/40 text-center leading-relaxed">
                  By submitting, you agree to our{" "}
                  <Link
                    href="/terms"
                    className="underline hover:text-teal-900/60"
                    target="_blank"
                  >
                    Terms
                  </Link>
                  ,{" "}
                  <Link
                    href="/privacy"
                    className="underline hover:text-teal-900/60"
                    target="_blank"
                  >
                    Privacy Policy
                  </Link>
                  , and{" "}
                  <Link
                    href="/sms-policy"
                    className="underline hover:text-teal-900/60"
                    target="_blank"
                  >
                    SMS Policy
                  </Link>
                  .
                </p>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
