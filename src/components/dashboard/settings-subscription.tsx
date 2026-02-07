"use client";

import { motion } from "framer-motion";
import type { Subscription } from "@/lib/types";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getPlanDisplayName(plan: Subscription["plan"]): string {
  switch (plan) {
    case "free":
      return "Free Plan";
    case "monthly":
      return "Monthly Plan";
    case "yearly":
      return "Yearly Plan";
  }
}

interface SettingsSubscriptionProps {
  subscription: Subscription;
}

export function SettingsSubscription({
  subscription,
}: SettingsSubscriptionProps) {
  const isFreePlan = subscription.plan === "free";
  const isActive = subscription.status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
      className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 p-8 md:p-10"
    >
      <h2 className="text-[10px] font-medium uppercase tracking-widest text-teal-900/50 mb-6">
        Subscription
      </h2>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-serif text-navy text-lg">
            {getPlanDisplayName(subscription.plan)}
          </span>
          <span
            className={`px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded-full ${
              isActive
                ? "bg-emerald-500/20 text-emerald-700"
                : "bg-teal-900/10 text-teal-900/50"
            }`}
          >
            {subscription.status}
          </span>
        </div>

        {isFreePlan && (
          <button className="px-5 py-2 bg-navy text-white text-sm font-medium rounded-full hover:bg-navy/90 transition-colors">
            Explore Plans
          </button>
        )}
      </div>

      {/* Renewal date for paid plans */}
      {!isFreePlan && subscription.currentPeriodEnd && (
        <p className="text-sm text-teal-900/50 mt-3">
          Renews on {formatDate(subscription.currentPeriodEnd)}
        </p>
      )}
    </motion.div>
  );
}
