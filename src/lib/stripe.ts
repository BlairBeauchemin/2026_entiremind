import Stripe from "stripe";

// Lazy initialization to avoid throwing at module load time
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
    }
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: "2026-01-28.clover",
      typescript: true,
    });
  }
  return stripeInstance;
}

// For backwards compatibility - will throw descriptive error if not configured
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

// Price IDs for subscription plans
export const PRICE_IDS = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID || "",
  yearly: process.env.STRIPE_YEARLY_PRICE_ID || "",
} as const;

export type PlanType = keyof typeof PRICE_IDS;
