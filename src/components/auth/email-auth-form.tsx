"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

interface EmailAuthFormProps {
  onEmailSent: (email: string) => void;
}

export function EmailAuthForm({ onEmailSent }: EmailAuthFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = createClient();

      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
      });

      if (error) {
        setError(error.message);
        return;
      }

      onEmailSent(email.toLowerCase().trim());
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
        <Label htmlFor="email" className="text-sm font-medium text-teal-900">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          placeholder="you@example.com"
          className="h-12 bg-white/60 border-white/60 rounded-xl focus:border-em-purple-300 focus:ring-em-purple-300/20"
          disabled={isLoading}
          autoComplete="email"
        />
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
        disabled={isLoading || !email}
        className="w-full h-12 bg-navy hover:bg-navy/90 text-white rounded-xl font-medium transition-colors"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          "Send magic link"
        )}
      </Button>

      <p className="text-xs text-center text-teal-900/50">
        We&apos;ll send you a magic link to sign in
      </p>
    </motion.form>
  );
}
