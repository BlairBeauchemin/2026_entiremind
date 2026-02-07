"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface OtpVerificationFormProps {
  phone: string;
  onBack: () => void;
}

export function OtpVerificationForm({ phone, onBack }: OtpVerificationFormProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError(null);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const newOtp = [...otp];
    pastedData.split("").forEach((char, i) => {
      if (i < 6) newOtp[i] = char;
    });
    setOtp(newOtp);
    inputRefs.current[Math.min(pastedData.length, 5)]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit code");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.verifyOtp({
        phone,
        token: code,
        type: "sms",
      });

      if (error) {
        setError(error.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCountdown > 0) return;

    setIsResending(true);
    setError(null);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });

      if (error) {
        setError(error.message);
        return;
      }

      setResendCountdown(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch {
      setError("Failed to resend code. Please try again.");
    } finally {
      setIsResending(false);
    }
  };

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 11 && cleaned.startsWith("1")) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
    }
    return phone;
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
        Change phone number
      </button>

      <div className="space-y-1">
        <p className="text-sm text-teal-900/70">
          We sent a verification code to
        </p>
        <p className="font-medium text-navy">{formatPhone(phone)}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex justify-center gap-2">
          {otp.map((digit, index) => (
            <Input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-xl font-medium bg-white/60 border-white/60 rounded-xl focus:border-em-purple-300 focus:ring-em-purple-300/20"
              disabled={isLoading}
            />
          ))}
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

        <Button
          type="submit"
          disabled={isLoading || otp.some((d) => !d)}
          className="w-full h-12 bg-navy hover:bg-navy/90 text-white rounded-xl font-medium transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            "Verify & continue"
          )}
        </Button>
      </form>

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
            `Resend code in ${resendCountdown}s`
          ) : (
            "Resend code"
          )}
        </button>
      </div>
    </motion.div>
  );
}
