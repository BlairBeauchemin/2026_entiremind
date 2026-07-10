import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { type PlanType } from "@/lib/stripe";
import { resolveAppOrigin } from "@/lib/app-url";
import { createCheckoutSessionForUser } from "@/lib/billing/checkout";

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

    if (!plan || (plan !== "monthly" && plan !== "yearly")) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'monthly' or 'yearly'" },
        { status: 400 }
      );
    }

    const { url } = await createCheckoutSessionForUser({
      userId: user.id,
      email: user.email ?? null,
      plan,
      origin: resolveAppOrigin(request),
    });

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
