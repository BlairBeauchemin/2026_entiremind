"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, MessageSquare } from "lucide-react";
import { updateOnboardingPhone } from "@/lib/onboarding/actions";
import {
  formatPhoneInput,
  cleanPhoneNumber,
  isValidUSPhone,
} from "@/lib/utils/phone";

interface PhoneStepProps {
  onNext: () => void;
  onBack: () => void;
}

export function PhoneStep({ onNext, onBack }: PhoneStepProps) {
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneInput(e.target.value);
    setPhone(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidUSPhone(phone)) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setIsLoading(true);
    setError(null);

    const cleanedPhone = cleanPhoneNumber(phone);
    const result = await updateOnboardingPhone(cleanedPhone);

    if ("error" in result) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    onNext();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full bg-cobalt-wash flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-cobalt" />
          </div>
        </div>
        <h1 className="font-serif text-2xl md:text-3xl text-ink">
          Your phone number
        </h1>
        <p className="text-muted text-sm">
          We&apos;ll send you gentle prompts via SMS to help you reflect and
          manifest.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="phone"
            className="text-[10px] font-medium uppercase tracking-widest text-muted"
          >
            Phone Number
          </Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted">
              +1
            </span>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="(555) 123-4567"
              className="h-12 pl-12 bg-surface border-rule rounded-sm text-ink placeholder:text-muted"
              autoFocus
            />
          </div>
        </div>

        <p className="text-xs text-muted">
          Standard SMS rates may apply. You can pause or adjust messages
          anytime.
        </p>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            aria-label="Go back"
            onClick={onBack}
            className="h-12 px-4 border-rule text-muted hover:bg-surface rounded-sm"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 h-12 bg-cobalt hover:bg-cobalt-deep text-linen rounded-sm font-medium"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              "Continue"
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
}
