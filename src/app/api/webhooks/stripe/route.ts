import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase";
import { sendSms } from "@/lib/sms";
import {
  shouldSendDunningNotice,
  buildPaymentFailedMessage,
  buildSubscriptionEndedMessage,
} from "@/lib/billing/dunning";
import { buildUpgradeLink } from "@/lib/billing/token";
import type Stripe from "stripe";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Look up the phone + name behind a Stripe customer so lifecycle events can
 * notify the user over SMS. Returns null when the customer has no matching
 * subscription row or the user has no phone.
 */
async function findUserForCustomer(
  supabase: SupabaseClient,
  customerId: string,
): Promise<{
  userId: string;
  phone: string;
  name: string | null;
  dunningNotifiedAt: string | null;
} | null> {
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("user_id, dunning_notified_at")
    .eq("stripe_customer_id", customerId)
    .single();
  if (!sub) return null;

  const { data: user } = await supabase
    .from("users")
    .select("phone, name")
    .eq("id", sub.user_id)
    .single();
  if (!user?.phone) return null;

  return {
    userId: sub.user_id,
    phone: user.phone,
    name: user.name,
    dunningNotifiedAt: sub.dunning_notified_at ?? null,
  };
}

// Map Stripe price IDs to plan names
function getPlanFromPriceId(priceId: string): "monthly" | "yearly" | "free" {
  const monthlyPriceId = process.env.STRIPE_MONTHLY_PRICE_ID;
  const yearlyPriceId = process.env.STRIPE_YEARLY_PRICE_ID;

  if (priceId === monthlyPriceId) return "monthly";
  if (priceId === yearlyPriceId) return "yearly";
  return "free";
}

// Map Stripe subscription status to our status
function mapSubscriptionStatus(
  stripeStatus: Stripe.Subscription.Status
): "active" | "paused" | "cancelled" | "past_due" | "trialing" {
  switch (stripeStatus) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "paused":
      return "paused";
    case "canceled":
    case "incomplete":
    case "incomplete_expired":
    case "unpaid":
      return "cancelled";
    default:
      return "cancelled";
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    console.error("Missing Stripe signature");
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", message);
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const plan = session.metadata?.plan as "monthly" | "yearly";

        if (!userId) {
          console.error("No user ID in checkout session metadata");
          break;
        }

        // Get the subscription from the session
        const subscriptionId = session.subscription as string;
        const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
          expand: ["items.data"],
        });

        // Get current_period_end from the first subscription item
        const currentPeriodEnd = stripeSubscription.items.data[0]?.current_period_end;

        const { error } = await supabase
          .from("subscriptions")
          .update({
            stripe_subscription_id: subscriptionId,
            stripe_customer_id: session.customer as string,
            plan,
            status: "active",
            current_period_end: currentPeriodEnd
              ? new Date(currentPeriodEnd * 1000).toISOString()
              : null,
            cancel_at_period_end: stripeSubscription.cancel_at_period_end,
          })
          .eq("user_id", userId);

        if (error) {
          console.error("Error updating subscription after checkout:", error);
        } else {
          console.log(`Subscription activated for user ${userId}: ${plan}`);
        }
        break;
      }

      case "customer.subscription.updated": {
        const stripeSubUpdated = event.data.object as Stripe.Subscription;
        const customerId = stripeSubUpdated.customer as string;

        // Find user by stripe_customer_id
        const { data: existingSub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (!existingSub) {
          console.error(`No subscription found for customer ${customerId}`);
          break;
        }

        // Get the price ID and current_period_end from the first subscription item
        const firstItem = stripeSubUpdated.items.data[0];
        const priceId = firstItem?.price.id || "";
        const currentPeriodEndUpdated = firstItem?.current_period_end;
        const plan = getPlanFromPriceId(priceId);
        const status = mapSubscriptionStatus(stripeSubUpdated.status);

        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan,
            status,
            current_period_end: currentPeriodEndUpdated
              ? new Date(currentPeriodEndUpdated * 1000).toISOString()
              : null,
            cancel_at_period_end: stripeSubUpdated.cancel_at_period_end,
            // Payment recovered → reset the dunning throttle for next time.
            ...(status === "active" ? { dunning_notified_at: null } : {}),
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Error updating subscription:", error);
        } else {
          console.log(
            `Subscription updated for customer ${customerId}: ${plan}, ${status}`
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const stripeSubDeleted = event.data.object as Stripe.Subscription;
        const customerId = stripeSubDeleted.customer as string;

        // Revert to free plan
        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan: "free",
            status: "active",
            stripe_subscription_id: null,
            current_period_end: null,
            cancel_at_period_end: false,
            dunning_notified_at: null,
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Error reverting to free plan:", error);
        } else {
          console.log(`Subscription cancelled, reverted to free: ${customerId}`);
        }

        // Tell the user their subscription ended and how to come back.
        const endedUser = await findUserForCustomer(supabase, customerId);
        if (endedUser) {
          // Re-subscribe path: an upgrade-intent token (they have no active
          // subscription to manage, so the portal is the wrong surface).
          const result = await sendSms(
            endedUser.userId,
            endedUser.phone,
            buildSubscriptionEndedMessage(
              endedUser.name,
              buildUpgradeLink(endedUser.userId, "upgrade"),
            ),
            { contentType: "billing" },
          );
          if (!result.success) {
            console.error("Failed to send subscription-ended SMS:", result.error);
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { error } = await supabase
          .from("subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Error setting past_due status:", error);
        } else {
          console.log(`Payment failed, marked past_due: ${customerId}`);
        }

        // Dunning: tell the user promptly, throttled across Stripe's retry
        // cycle (this event fires on every retry — max ~1 text per 5 days).
        const dunningUser = await findUserForCustomer(supabase, customerId);
        if (
          dunningUser &&
          shouldSendDunningNotice(dunningUser.dunningNotifiedAt)
        ) {
          // One-tap billing-portal link (14-day token, matching the retry cycle)
          const result = await sendSms(
            dunningUser.userId,
            dunningUser.phone,
            buildPaymentFailedMessage(
              dunningUser.name,
              buildUpgradeLink(dunningUser.userId, "billing"),
            ),
            { contentType: "billing" },
          );
          if (result.success) {
            await supabase
              .from("subscriptions")
              .update({ dunning_notified_at: new Date().toISOString() })
              .eq("stripe_customer_id", customerId);
          } else {
            console.error("Failed to send dunning SMS:", result.error);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
