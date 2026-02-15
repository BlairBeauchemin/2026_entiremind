"use client";

import { useState } from "react";
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

function getStatusDisplay(status: Subscription["status"]): {
  label: string;
  className: string;
} {
  switch (status) {
    case "active":
      return {
        label: "Active",
        className: "bg-emerald-500/20 text-emerald-700",
      };
    case "trialing":
      return {
        label: "Trial",
        className: "bg-blue-500/20 text-blue-700",
      };
    case "past_due":
      return {
        label: "Past Due",
        className: "bg-amber-500/20 text-amber-700",
      };
    case "paused":
      return {
        label: "Paused",
        className: "bg-teal-900/10 text-teal-900/50",
      };
    case "cancelled":
      return {
        label: "Cancelled",
        className: "bg-red-500/20 text-red-700",
      };
    default:
      return {
        label: status,
        className: "bg-teal-900/10 text-teal-900/50",
      };
  }
}

interface SettingsSubscriptionProps {
  subscription: Subscription;
}

export function SettingsSubscription({
  subscription,
}: SettingsSubscriptionProps) {
  const [loading, setLoading] = useState(false);
  const [showPlanOptions, setShowPlanOptions] = useState(false);

  const isFreePlan = subscription.plan === "free";
  const isPaidPlan = subscription.plan === "monthly" || subscription.plan === "yearly";
  const statusDisplay = getStatusDisplay(subscription.status);

  const handleUpgrade = async (plan: "monthly" | "yearly") => {
    setLoading(true);
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        const errorMsg = data.error || "Unknown error";
        console.error("Checkout failed:", errorMsg);
        alert(`Checkout failed: ${errorMsg}`);
      }
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/billing-portal", {
        method: "POST",
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("Failed to create billing portal session:", data.error);
        alert("Failed to open billing portal. Please try again.");
      }
    } catch (error) {
      console.error("Error creating billing portal session:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="font-serif text-navy text-lg">
            {getPlanDisplayName(subscription.plan)}
          </span>
          <span
            className={`px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide rounded-full ${statusDisplay.className}`}
          >
            {statusDisplay.label}
          </span>
        </div>

        {/* Free plan: show upgrade options */}
        {isFreePlan && !showPlanOptions && (
          <button
            onClick={() => setShowPlanOptions(true)}
            disabled={loading}
            className="px-5 py-2 bg-navy text-white text-sm font-medium rounded-full hover:bg-navy/90 transition-colors disabled:opacity-50"
          >
            Upgrade
          </button>
        )}

        {/* Paid plan: show manage subscription button */}
        {isPaidPlan && (
          <button
            onClick={handleManageSubscription}
            disabled={loading}
            className="px-5 py-2 bg-white/60 text-navy text-sm font-medium rounded-full hover:bg-white/80 border border-navy/20 transition-colors disabled:opacity-50"
          >
            {loading ? "Loading..." : "Manage Subscription"}
          </button>
        )}
      </div>

      {/* Plan selection options */}
      {isFreePlan && showPlanOptions && (
        <div className="mt-6 grid sm:grid-cols-2 gap-4">
          <button
            onClick={() => handleUpgrade("monthly")}
            disabled={loading}
            className="p-4 rounded-xl border border-navy/20 bg-white/60 hover:bg-white/80 transition-colors text-left disabled:opacity-50"
          >
            <div className="font-serif text-navy text-lg">Monthly</div>
            <div className="text-sm text-teal-900/60 mt-1">
              Billed monthly, cancel anytime
            </div>
          </button>
          <button
            onClick={() => handleUpgrade("yearly")}
            disabled={loading}
            className="p-4 rounded-xl border border-navy/20 bg-white/60 hover:bg-white/80 transition-colors text-left disabled:opacity-50"
          >
            <div className="font-serif text-navy text-lg">Yearly</div>
            <div className="text-sm text-teal-900/60 mt-1">
              Save with annual billing
            </div>
          </button>
        </div>
      )}

      {/* Status messages */}
      {subscription.status === "past_due" && (
        <p className="text-sm text-amber-700 mt-4">
          Your payment failed. Please update your payment method to continue
          your subscription.
        </p>
      )}

      {/* Cancellation pending */}
      {isPaidPlan && subscription.cancelAtPeriodEnd && subscription.currentPeriodEnd && (
        <p className="text-sm text-teal-900/60 mt-4">
          Your subscription will end on {formatDate(subscription.currentPeriodEnd)}.
          You can reactivate anytime before then.
        </p>
      )}

      {/* Renewal date for active paid plans */}
      {isPaidPlan &&
        !subscription.cancelAtPeriodEnd &&
        subscription.currentPeriodEnd &&
        subscription.status === "active" && (
          <p className="text-sm text-teal-900/50 mt-4">
            Renews on {formatDate(subscription.currentPeriodEnd)}
          </p>
        )}
    </motion.div>
  );
}
