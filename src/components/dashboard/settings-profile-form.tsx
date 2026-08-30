"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/lib/auth/actions";
import type { DbUser } from "@/lib/supabase";

function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const TIMEZONES = [
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Chicago", label: "Central Time" },
  { value: "America/Denver", label: "Mountain Time" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
  { value: "America/Anchorage", label: "Alaska Time" },
  { value: "Pacific/Honolulu", label: "Hawaii Time" },
];

interface SettingsProfileFormProps {
  user: DbUser | null;
}

export function SettingsProfileForm({ user }: SettingsProfileFormProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const result = await updateProfile(formData);

    setIsLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  if (!user) {
    return (
      <div className="bg-surface rounded-sm border border-rule p-8 md:p-10">
        <p className="text-muted">Loading profile...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-surface rounded-sm border border-rule p-8 md:p-10"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[10px] font-medium uppercase tracking-widest text-muted">
          Profile
        </h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 text-xs text-muted hover:text-cobalt transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <Label
                htmlFor="name"
                className="text-[10px] font-medium uppercase tracking-widest text-muted"
              >
                Name
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={user.name || ""}
                placeholder="Your name"
                className="h-11 bg-surface border-rule rounded-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label
                htmlFor="email"
                className="text-[10px] font-medium uppercase tracking-widest text-muted"
              >
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email || ""}
                placeholder="you@example.com"
                className="h-11 bg-surface border-rule rounded-sm"
              />
            </div>

            {user.phone && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium uppercase tracking-widest text-muted">
                  Phone
                </Label>
                <p className="font-serif text-ink py-2.5">
                  {formatPhone(user.phone)}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label
                htmlFor="timezone"
                className="text-[10px] font-medium uppercase tracking-widest text-muted"
              >
                Timezone
              </Label>
              <select
                id="timezone"
                name="timezone"
                defaultValue={user.timezone}
                className="w-full h-11 px-4 bg-surface border border-rule rounded-sm text-ink appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cobalt"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label
                htmlFor="preferredSendHour"
                className="text-[10px] font-medium uppercase tracking-widest text-muted"
              >
                Preferred Send Hour
              </Label>
              <select
                id="preferredSendHour"
                name="preferredSendHour"
                defaultValue={String(user.preferred_send_hour ?? 7)}
                className="w-full h-11 px-4 bg-surface border border-rule rounded-sm text-ink appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-cobalt"
              >
                {Array.from({ length: 24 }).map((_, hour) => {
                  const label = new Date(2000, 0, 1, hour).toLocaleTimeString(
                    "en-US",
                    {
                      hour: "numeric",
                      hour12: true,
                    },
                  );
                  return (
                    <option key={hour} value={hour}>
                      {label}
                    </option>
                  );
                })}
              </select>
              <p className="text-[11px] text-muted italic mt-1">
                We&apos;ll send around your preferred hour soon. For now all
                messages go out at 7:45 AM Pacific.
              </p>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-cobalt hover:bg-cobalt-deep text-linen rounded-sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Save changes"
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditing(false)}
              className="border-rule text-muted hover:bg-surface rounded-sm"
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted block mb-1">
              Name
            </span>
            <span className="font-serif text-ink">
              {user.name || "Not set"}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted block mb-1">
              Email
            </span>
            <span className="font-serif text-ink">
              {user.email || "Not set"}
            </span>
          </div>
          {user.phone && (
            <div>
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted block mb-1">
                Phone
              </span>
              <span className="font-serif text-ink">
                {formatPhone(user.phone)}
              </span>
            </div>
          )}
          <div>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted block mb-1">
              Timezone
            </span>
            <span className="font-serif text-ink">
              {TIMEZONES.find((tz) => tz.value === user.timezone)?.label ||
                user.timezone}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-medium uppercase tracking-widest text-muted block mb-1">
              Member Since
            </span>
            <span className="font-serif text-ink">
              {formatDate(user.created_at)}
            </span>
          </div>
        </div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-2 text-sm text-emerald-600"
        >
          <Check className="w-4 h-4" />
          Profile updated successfully
        </motion.div>
      )}
    </motion.div>
  );
}
