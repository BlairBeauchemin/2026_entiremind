import { stripe, getPriceId, type PlanType } from "../stripe";
import { createServiceRoleClient } from "../supabase";

/**
 * Shared Stripe Checkout session creation — used by the authenticated
 * dashboard route (/api/checkout) and the tokenized SMS upgrade path
 * (/api/upgrade-checkout). One implementation so customer reuse and
 * webhook metadata can never drift between the two.
 */
export async function createCheckoutSessionForUser(params: {
  userId: string;
  email: string | null;
  plan: PlanType;
  origin: string;
  /** Attribution recorded in session metadata (e.g. "sms-upgrade-link"). */
  source?: string;
  successUrl?: string;
  cancelUrl?: string;
}): Promise<{ url: string | null }> {
  const { userId, email, plan, origin, source, successUrl, cancelUrl } = params;

  const priceId = getPriceId(plan);
  if (!priceId) {
    throw new Error(`Price ID not configured for plan: ${plan}`);
  }

  const serviceClient = createServiceRoleClient();

  const { data: subscription, error: subError } = await serviceClient
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single();

  if (subError && subError.code !== "PGRST116") {
    // PGRST116 = not found
    throw new Error(`Failed to fetch subscription: ${subError.message}`);
  }

  let stripeCustomerId = subscription?.stripe_customer_id;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      email: email ?? undefined,
      metadata: { supabase_user_id: userId },
    });
    stripeCustomerId = customer.id;

    const { error: updateError } = await serviceClient
      .from("subscriptions")
      .update({ stripe_customer_id: stripeCustomerId })
      .eq("user_id", userId);

    if (updateError) {
      console.error("Error updating stripe_customer_id:", updateError);
      // Continue anyway - we can still create the checkout session
    }
  }

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl ?? `${origin}/dashboard/settings?success=true`,
    cancel_url: cancelUrl ?? `${origin}/dashboard/settings?canceled=true`,
    metadata: {
      supabase_user_id: userId,
      plan,
      ...(source ? { source } : {}),
    },
  });

  return { url: session.url };
}
