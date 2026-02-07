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
      <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 p-8 md:p-10">
        <p className="text-teal-900/50">Loading profile...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 p-8 md:p-10"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[10px] font-medium uppercase tracking-widest text-teal-900/50">
          Profile
        </h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 text-xs text-teal-900/50 hover:text-teal-900 transition-colors"
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
              <Label htmlFor="name" className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40">
                Name
              </Label>
              <Input
                id="name"
                name="name"
                defaultValue={user.name || ""}
                placeholder="Your name"
                className="h-11 bg-white/60 border-white/60 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                defaultValue={user.email || ""}
                placeholder="you@example.com"
                className="h-11 bg-white/60 border-white/60 rounded-xl"
              />
            </div>

            {user.phone && (
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40">
                  Phone
                </Label>
                <p className="font-serif text-navy py-2.5">{formatPhone(user.phone)}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="timezone" className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40">
                Timezone
              </Label>
              <select
                id="timezone"
                name="timezone"
                defaultValue={user.timezone}
                className="w-full h-11 px-4 bg-white/60 border border-white/60 rounded-xl text-navy appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-em-purple-300/20"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-navy hover:bg-navy/90 text-white rounded-xl"
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
              className="border-teal-900/20 text-teal-900/60 hover:bg-white/40 rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <span className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40 block mb-1">
              Name
            </span>
            <span className="font-serif text-navy">{user.name || "Not set"}</span>
          </div>
          <div>
            <span className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40 block mb-1">
              Email
            </span>
            <span className="font-serif text-navy">{user.email || "Not set"}</span>
          </div>
          {user.phone && (
            <div>
              <span className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40 block mb-1">
                Phone
              </span>
              <span className="font-serif text-navy">{formatPhone(user.phone)}</span>
            </div>
          )}
          <div>
            <span className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40 block mb-1">
              Timezone
            </span>
            <span className="font-serif text-navy">
              {TIMEZONES.find((tz) => tz.value === user.timezone)?.label || user.timezone}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40 block mb-1">
              Member Since
            </span>
            <span className="font-serif text-navy">{formatDate(user.created_at)}</span>
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
