"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { analytics, type PlanId } from "@/lib/analytics";

const STORAGE_KEY = "em_purchase_tracked";

interface PurchaseTrackerProps {
  plan: string;
  stripeSubscriptionId: string | null;
}

/**
 * Fires the purchase event when the user returns from Stripe Checkout with
 * ?success=true, then strips the query param so refreshes and bookmarks
 * can't re-fire it. A sessionStorage guard covers back-navigation before
 * the replace lands. Must be mounted inside <Suspense> (useSearchParams).
 */
export function PurchaseTracker({
  plan,
  stripeSubscriptionId,
}: PurchaseTrackerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const success = searchParams.get("success") === "true";

  useEffect(() => {
    if (!success) return;
    if (!sessionStorage.getItem(STORAGE_KEY)) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      // Webhook may not have landed yet, so the subscription ID (the ideal
      // transaction_id for cross-platform dedup) can be missing.
      const transactionId = stripeSubscriptionId || `purchase_${Date.now()}`;
      const purchasedPlan: PlanId = plan === "yearly" ? "yearly" : "monthly";
      analytics.purchase(purchasedPlan, transactionId);
    }
    router.replace("/dashboard/settings");
  }, [success, plan, stripeSubscriptionId, router]);

  return null;
}
