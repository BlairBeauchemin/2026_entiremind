"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface PhoneAuthFormProps {
  onOtpSent: (phone: string) => void;
}

export function PhoneAuthForm({ onOtpSent }: PhoneAuthFormProps) {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatPhoneDisplay = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 10);
    setPhone(value);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();
      const formattedPhone = `+1${phone}`;

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        setError(error.message);
        return;
      }

      onOtpSent(formattedPhone);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onSubmit={handleSubmit}
      className="space-y-6"
    >
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-sm font-medium text-teal-900">
          Phone number
        </Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-900/50 select-none">
            +1
          </span>
          <Input
            id="phone"
            type="tel"
            value={formatPhoneDisplay(phone)}
            onChange={handlePhoneChange}
            placeholder="(555) 123-4567"
            className="pl-12 h-12 bg-white/60 border-white/60 rounded-xl focus:border-em-purple-300 focus:ring-em-purple-300/20"
            disabled={isLoading}
            autoComplete="tel-national"
          />
        </div>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-600"
          >
            {error}
          </motion.p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isLoading || phone.length !== 10}
        className="w-full h-12 bg-navy hover:bg-navy/90 text-white rounded-xl font-medium transition-colors"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          "Send verification code"
        )}
      </Button>

      <p className="text-xs text-center text-teal-900/50">
        We&apos;ll send you a one-time code to verify your phone number
      </p>
    </motion.form>
  );
}
