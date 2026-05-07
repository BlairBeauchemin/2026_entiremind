"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, Check, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ScheduleMessageFormProps {
  onScheduled?: () => void;
}

export function ScheduleMessageForm({ onScheduled }: ScheduleMessageFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const handleGenerateAI = async () => {
    const phone = phoneInputRef.current?.value;
    if (!phone) {
      setError("Enter a phone number first to generate a personalized message");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to generate message");
        return;
      }

      // Set the generated message in the textarea
      if (textareaRef.current) {
        textareaRef.current.value = data.message;
      }
    } catch {
      setError("Failed to generate message");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const toPhone = formData.get("toPhone") as string;
    const text = formData.get("text") as string;
    const date = formData.get("date") as string;
    const time = formData.get("time") as string;

    if (!toPhone || !text || !date || !time) {
      setError("All fields are required");
      setIsLoading(false);
      return;
    }

    // Combine date and time into ISO timestamp
    const scheduledFor = new Date(`${date}T${time}`).toISOString();

    try {
      const res = await fetch("/api/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toPhone, text, scheduledFor }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to schedule message");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      // Reset form
      (e.target as HTMLFormElement).reset();
      onScheduled?.();
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Failed to schedule message");
    } finally {
      setIsLoading(false);
    }
  };

  // Default to tomorrow at 7:45 AM Pacific (cron time)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split("T")[0];
  const defaultTime = "07:45";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 p-6 md:p-8"
    >
      <h3 className="text-[10px] font-medium uppercase tracking-widest text-teal-900/50 mb-4">
        Schedule New Message
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="toPhone"
              className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40"
            >
              Phone Number
            </Label>
            <Input
              id="toPhone"
              name="toPhone"
              type="tel"
              placeholder="+1234567890"
              ref={phoneInputRef}
              className="h-11 bg-white/60 border-white/60 rounded-xl font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label
                htmlFor="date"
                className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40"
              >
                Date
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={defaultDate}
                className="h-11 bg-white/60 border-white/60 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label
                htmlFor="time"
                className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40"
              >
                Time
              </Label>
              <Input
                id="time"
                name="time"
                type="time"
                defaultValue={defaultTime}
                className="h-11 bg-white/60 border-white/60 rounded-xl"
              />
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="text"
            className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40"
          >
            Message
          </Label>
          <div className="flex gap-2">
            <textarea
              id="text"
              name="text"
              rows={3}
              ref={textareaRef}
              placeholder="Enter your message..."
              className="flex-1 px-4 py-3 bg-white/60 border border-white/60 rounded-xl text-navy resize-none focus:outline-none focus:ring-2 focus:ring-em-purple-300/20"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="h-auto px-3 bg-white/60 border-white/60 rounded-xl hover:bg-em-purple-100/50 self-start"
              title="Generate AI message"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-em-purple-500" />
              )}
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex items-center gap-4">
          <Button
            type="submit"
            disabled={isLoading}
            className="bg-navy hover:bg-navy/90 text-white rounded-xl"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Schedule Message
          </Button>

          {success && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-sm text-emerald-600"
            >
              <Check className="w-4 h-4" />
              Message scheduled
            </motion.div>
          )}
        </div>
      </form>

      <p className="text-xs text-teal-900/40 mt-4">
        Note: Messages are sent during the daily cron job at 7:45 AM Pacific.
      </p>
    </motion.div>
  );
}
