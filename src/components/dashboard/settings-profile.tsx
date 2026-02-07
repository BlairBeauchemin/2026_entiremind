"use client";

import { motion } from "framer-motion";
import type { User } from "@/lib/types";

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

function formatTimezone(tz: string): string {
  return tz.replace(/_/g, " ").replace(/\//g, " / ");
}

interface SettingsProfileProps {
  user: User;
}

export function SettingsProfile({ user }: SettingsProfileProps) {
  const fields = [
    { label: "Name", value: user.name },
    { label: "Email", value: user.email },
    { label: "Phone", value: formatPhone(user.phone) },
    { label: "Timezone", value: formatTimezone(user.timezone) },
    { label: "Member Since", value: formatDate(user.createdAt) },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 p-8 md:p-10"
    >
      <h2 className="text-[10px] font-medium uppercase tracking-widest text-teal-900/50 mb-6">
        Profile
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {fields.map((field) => (
          <div key={field.label}>
            <span className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40 block mb-1">
              {field.label}
            </span>
            <span className="font-serif text-navy">{field.value}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
