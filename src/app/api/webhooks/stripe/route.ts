import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceRoleClient } from "@/lib/supabase";
import type Stripe from "stripe";

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
          })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Error reverting to free plan:", error);
        } else {
          console.log(`Subscription cancelled, reverted to free: ${customerId}`);
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
