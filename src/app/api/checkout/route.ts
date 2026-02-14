import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { stripe, PRICE_IDS, type PlanType } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Get request body
    const body = await request.json();
    const { plan } = body as { plan: PlanType };

    if (!plan || !PRICE_IDS[plan]) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'monthly' or 'yearly'" },
        { status: 400 }
      );
    }

    const priceId = PRICE_IDS[plan];

    if (!priceId) {
      console.error("Price ID not configured for plan:", plan, "PRICE_IDS:", PRICE_IDS);
      return NextResponse.json(
        { error: "Price ID not configured. Check STRIPE_MONTHLY_PRICE_ID and STRIPE_YEARLY_PRICE_ID env vars." },
        { status: 500 }
      );
    }

    // Use service role client to access subscriptions table
    const serviceClient = createServiceRoleClient();

    // Get user's subscription to check for existing Stripe customer
    const { data: subscription, error: subError } = await serviceClient
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single();

    if (subError && subError.code !== "PGRST116") {
      // PGRST116 = not found
      console.error("Error fetching subscription:", subError);
      return NextResponse.json(
        { error: "Failed to fetch subscription" },
        { status: 500 }
      );
    }

    let stripeCustomerId = subscription?.stripe_customer_id;

    // Create Stripe customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      stripeCustomerId = customer.id;

      // Store the customer ID
      const { error: updateError } = await serviceClient
        .from("subscriptions")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("user_id", user.id);

      if (updateError) {
        console.error("Error updating stripe_customer_id:", updateError);
        // Continue anyway - we can still create the checkout session
      }
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${request.headers.get("origin")}/dashboard/settings?success=true`,
      cancel_url: `${request.headers.get("origin")}/dashboard/settings?canceled=true`,
      metadata: {
        supabase_user_id: user.id,
        plan,
      },
    });

    return NextResponse.json({ url: session.url }, { status: 200 });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
