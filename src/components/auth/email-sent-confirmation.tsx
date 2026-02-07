"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface EmailSentConfirmationProps {
  email: string;
  onBack: () => void;
}

export function EmailSentConfirmation({ email, onBack }: EmailSentConfirmationProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleResend = async () => {
    if (resendCountdown > 0) return;

    setIsResending(true);
    setError(null);
    setResent(false);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithOtp({
        email,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setResendCountdown(60);
      setResent(true);
    } catch {
      setError("Failed to resend. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="space-y-6"
    >
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-teal-900/60 hover:text-teal-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Use a different email
      </button>

      <div className="text-center py-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-em-purple-300/20 flex items-center justify-center">
          <Mail className="w-8 h-8 text-em-purple-400" />
        </div>
        <p className="text-sm text-teal-900/70 mb-1">
          We sent a magic link to
        </p>
        <p className="font-medium text-navy">{email}</p>
      </div>

      <div className="bg-white/40 rounded-xl p-4 text-center">
        <p className="text-sm text-teal-900/60">
          Click the link in your email to sign in. You can close this tab.
        </p>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-center text-red-600"
        >
          {error}
        </motion.p>
      )}

      {resent && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm text-center text-emerald-600"
        >
          Email resent!
        </motion.p>
      )}

      <div className="text-center">
        <button
          type="button"
          onClick={handleResend}
          disabled={resendCountdown > 0 || isResending}
          className="text-sm text-teal-900/60 hover:text-teal-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isResending ? (
            <span className="flex items-center gap-2 justify-center">
              <Loader2 className="w-3 h-3 animate-spin" />
              Sending...
            </span>
          ) : resendCountdown > 0 ? (
            `Resend email in ${resendCountdown}s`
          ) : (
            "Resend email"
          )}
        </button>
      </div>
    </motion.div>
  );
}
