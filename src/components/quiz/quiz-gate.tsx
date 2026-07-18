"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { analytics } from "@/lib/analytics";
import { archetypeDisplayName } from "@/lib/persona/share";
import type { PersonaProfile, QuizAnswers } from "@/lib/persona/types";

// Same consent language the waitlist modals use (Twilio A2P 10DLC).
const SMS_CONSENT_LANGUAGE =
  "I agree to receive recurring automated SMS messages from Entiremind (up to 2 msgs/day depending on engagement). Msg & data rates may apply. Reply HELP for help or STOP to cancel. Consent not required for purchase.";

/**
 * The email gate between the partial and full reveal. An honest value
 * exchange (trusted-friend test): the full reading for an email. Name is
 * optional (it personalizes the reading), phone + SMS consent are a clearly
 * optional extra — never required, never pre-checked.
 */
export function QuizGate({
  profile,
  answers,
  src,
  onUnlocked,
  onBack,
}: {
  profile: PersonaProfile;
  answers: QuizAnswers;
  /** Share attribution (?src=share-{slug}); server validates against allowlist. */
  src: string | null;
  onUnlocked: (name: string) => void;
  onBack: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const archetypeName = archetypeDisplayName(profile.archetype);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email");
      return;
    }
    if (phone.trim()) {
      const digits = phone.replace(/\D/g, "");
      if (digits.length < 10 || digits.length > 15) {
        setError("Please enter a valid phone number (or leave it blank)");
        return;
      }
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/quiz/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          smsConsent,
          smsConsentLanguage: smsConsent ? SMS_CONSENT_LANGUAGE : undefined,
          answers,
          source: src ?? undefined,
          website,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.error ?? "Something went wrong — please try again");
        setSubmitting(false);
        return;
      }
      analytics.quizGateSubmit(profile.archetype, Boolean(phone.trim()));
      onUnlocked(name.trim());
    } catch {
      setError("Something went wrong — please try again");
      setSubmitting(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1 text-sm text-teal-900/50 hover:text-teal-900/80 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="space-y-2 text-center">
        <h2 className="font-serif text-2xl text-navy font-medium">
          Your {archetypeName.replace(/^The\s+/, "")} reading is ready
        </h2>
        <p className="text-sm text-teal-900/60">
          Tell us where it belongs and it&apos;s yours — on screen now, and in
          your inbox to keep.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Honeypot — hidden from humans, tempting to bots. */}
        <input
          type="text"
          name="website"
          value={website}
          onChange={(e) => setWebsite(e.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          className="hidden"
        />

        <div className="space-y-1.5">
          <label
            htmlFor="quiz-name"
            className="text-xs font-medium text-teal-900/60"
          >
            First name{" "}
            <span className="text-teal-900/40">(makes it personal)</span>
          </label>
          <input
            id="quiz-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            placeholder="Your first name"
            className="w-full h-11 rounded-xl border border-teal-900/15 bg-white/70 px-4 text-sm text-teal-900 placeholder:text-teal-900/30 focus:outline-none focus:ring-2 focus:ring-em-purple-300/50"
          />
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="quiz-email"
            className="text-xs font-medium text-teal-900/60"
          >
            Email
          </label>
          <input
            id="quiz-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={320}
            placeholder="you@example.com"
            className="w-full h-11 rounded-xl border border-teal-900/15 bg-white/70 px-4 text-sm text-teal-900 placeholder:text-teal-900/30 focus:outline-none focus:ring-2 focus:ring-em-purple-300/50"
          />
        </div>

        <details className="rounded-xl border border-teal-900/10 bg-white/40 px-4 py-3">
          <summary className="cursor-pointer text-xs font-medium text-teal-900/60 select-none">
            Want the daily practice by text? (optional)
          </summary>
          <div className="mt-3 space-y-3">
            <input
              id="quiz-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={20}
              placeholder="(555) 123-4567"
              className="w-full h-11 rounded-xl border border-teal-900/15 bg-white/70 px-4 text-sm text-teal-900 placeholder:text-teal-900/30 focus:outline-none focus:ring-2 focus:ring-em-purple-300/50"
            />
            <label className="flex items-start gap-2 text-[11px] leading-relaxed text-teal-900/60">
              <input
                type="checkbox"
                checked={smsConsent}
                onChange={(e) => setSmsConsent(e.target.checked)}
                className="mt-0.5"
              />
              {SMS_CONSENT_LANGUAGE}
            </label>
          </div>
        </details>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          type="submit"
          disabled={submitting}
          className="w-full h-12 bg-navy hover:bg-navy/90 text-white rounded-xl font-medium"
        >
          {submitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            "Show me my full reading"
          )}
        </Button>
        <p className="text-center text-[11px] text-teal-900/45">
          No spam, ever. One email with your reading, and you can unsubscribe
          from anything else with one tap.
        </p>
      </form>
    </motion.div>
  );
}
