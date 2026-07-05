/**
 * Typed dataLayer event layer for Google Tag Manager.
 *
 * All marketing pixels (GA4, Google Ads, Meta, TikTok) are configured inside
 * the GTM container and triggered off these events — see
 * docs/marketing/gtm-setup.md for the container configuration guide.
 *
 * Event names follow GA4 recommended events (generate_lead, sign_up,
 * begin_checkout, purchase) so mapping to each ad platform in GTM is trivial.
 *
 * Call sites are client components only. When NEXT_PUBLIC_GTM_ID is unset,
 * GTM never loads and these pushes accumulate harmlessly in the dataLayer.
 *
 * NOTE: both waitlist modal variants (waitlist-modal-single.tsx and
 * waitlist-modal-two-step.tsx) must fire generateLead — keep any future
 * variant in sync.
 */

type DataLayerObject = Record<string, unknown>;

declare global {
  interface Window {
    dataLayer?: DataLayerObject[];
  }
}

export type PlanId = "monthly" | "yearly";

// PLACEHOLDER prices — update when real pricing is final. Used only for ad
// platform conversion values; Stripe remains the source of truth for billing.
const PLAN_VALUES: Record<PlanId, number> = { monthly: 29, yearly: 199 };
const CURRENCY = "USD";

function planItems(plan: PlanId) {
  return [
    {
      item_id: `entiremind_${plan}`,
      item_name: `Entiremind ${plan === "monthly" ? "Monthly" : "Yearly"}`,
      price: PLAN_VALUES[plan],
      quantity: 1,
    },
  ];
}

export function trackEvent(event: string, params: DataLayerObject = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
}

export type CtaLocation = "nav" | "hero" | "bottom_cta";
export type ModalVersion = "single" | "two_step";

export const analytics = {
  /** A landing-page CTA opened the waitlist modal. */
  leadFormOpen(ctaLocation: CtaLocation) {
    trackEvent("lead_form_open", { cta_location: ctaLocation });
  },

  /** Waitlist form submitted successfully (lead saved). */
  generateLead(params: { lead_source: string; modal_version: ModalVersion }) {
    trackEvent("generate_lead", { currency: CURRENCY, value: 0, ...params });
  },

  /** User arrived authenticated (proxy: first /onboarding visit per session). */
  signUp(method: string = "magic_link") {
    trackEvent("sign_up", { method });
  },

  /** Onboarding completed — welcome SMS on its way. */
  onboardingComplete() {
    trackEvent("onboarding_complete", {});
  },

  /** User clicked upgrade and is being sent to Stripe Checkout. */
  beginCheckout(plan: PlanId) {
    trackEvent("begin_checkout", {
      currency: CURRENCY,
      value: PLAN_VALUES[plan],
      items: planItems(plan),
    });
  },

  /** Returned from Stripe Checkout with a completed payment. */
  purchase(plan: PlanId, transactionId: string) {
    trackEvent("purchase", {
      transaction_id: transactionId,
      currency: CURRENCY,
      value: PLAN_VALUES[plan],
      items: planItems(plan),
    });
  },
};
