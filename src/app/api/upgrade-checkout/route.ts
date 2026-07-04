import { NextRequest, NextResponse } from "next/server";
import { verifyUpgradeToken } from "@/lib/billing/token";
import { createCheckoutSessionForUser } from "@/lib/billing/checkout";
import { computeEntitlement } from "@/lib/billing/entitlement";
import { createServiceRoleClient } from "@/lib/supabase";
import { resolveAppOrigin } from "@/lib/app-url";

/**
 * Tokenized checkout for the SMS upgrade link — no session required; the
 * signed token IS the authorization, and it authorizes exactly this: creating
 * a Stripe Checkout session for the embedded user. The token is re-verified
 * here server-side; the interstitial page's earlier check is UX only.
 */
export async function POST(request: NextRequest) {
  try {
    let body: { token?: unknown; plan?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const token = typeof body.token === "string" ? body.token : "";
    const plan =
      body.plan === "monthly" || body.plan === "yearly" ? body.plan : null;

    const payload = verifyUpgradeToken(token);
    if (!payload || payload.intent !== "upgrade" || !plan) {
      return NextResponse.json(
        { error: "This link has expired. Please sign in to upgrade." },
        { status: 401 },
      );
    }

    const supabase = createServiceRoleClient();
    const [{ data: user }, { data: sub }] = await Promise.all([
      supabase
        .from("users")
        .select("email")
        .eq("id", payload.uid)
        .maybeSingle(),
      supabase
        .from("subscriptions")
        .select("plan, status, trial_ends_at")
        .eq("user_id", payload.uid)
        .maybeSingle(),
    ]);

    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Already on a paid plan: nothing to buy.
    if (computeEntitlement(sub ?? null) === "paid" && sub?.plan !== "free") {
      return NextResponse.json(
        { error: "You already have an active subscription." },
        { status: 409 },
      );
    }

    const origin = resolveAppOrigin(request);
    const { url } = await createCheckoutSessionForUser({
      userId: payload.uid,
      email: user.email,
      plan,
      origin,
      source: "sms-upgrade-link",
      successUrl: `${origin}/welcome-back`,
      cancelUrl: `${origin}/u/${token}`,
    });

    return NextResponse.json({ url }, { status: 200 });
  } catch (error) {
    console.error("Error creating tokenized checkout session:", error);
    return NextResponse.json(
      { error: "Failed to start checkout" },
      { status: 500 },
    );
  }
}
