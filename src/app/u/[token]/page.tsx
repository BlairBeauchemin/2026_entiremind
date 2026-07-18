import { redirect } from "next/navigation";
import { verifyUpgradeToken } from "@/lib/billing/token";
import { computeEntitlement } from "@/lib/billing/entitlement";
import { createServiceRoleClient } from "@/lib/supabase";
import { stripe } from "@/lib/stripe";
import { UpgradePlanPicker } from "@/components/upgrade-plan-picker";

/**
 * Tokenized upgrade landing (docs/plans/2026-07-04-sms-upgrade-link.md).
 *
 * Public — the signed token in the URL is the only credential, and it
 * authorizes payment flows only. This page must NEVER set a session or
 * expose anything beyond a first name. Cache-Control/noindex headers for
 * /u/* are set in next.config.ts.
 *
 * intent=upgrade → plan-choice interstitial (Checkout via /api/upgrade-checkout)
 * intent=billing → 302 straight into the Stripe billing portal
 * invalid/expired → the old authenticated path, gracefully
 */

export const dynamic = "force-dynamic";

export default async function UpgradeLinkPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // verifyUpgradeToken never throws on bad input, but it does when
  // UPGRADE_LINK_SECRET is unset — degrade to the authenticated path
  // instead of a 500.
  let payload: ReturnType<typeof verifyUpgradeToken> = null;
  try {
    payload = verifyUpgradeToken(token);
  } catch (err) {
    console.error("Upgrade token verification unavailable:", err);
  }
  if (!payload) {
    redirect("/auth?next=/dashboard/settings");
  }

  // Any infrastructure failure degrades to the authenticated path — a
  // paying-intent user should never see a 500 at this moment.
  let user: { name: string | null } | null = null;
  let sub: {
    plan: string;
    status: string;
    trial_ends_at: string | null;
    stripe_customer_id: string | null;
  } | null = null;
  try {
    const supabase = createServiceRoleClient();
    const [userRes, subRes] = await Promise.all([
      supabase.from("users").select("name").eq("id", payload.uid).maybeSingle(),
      supabase
        .from("subscriptions")
        .select("plan, status, trial_ends_at, stripe_customer_id")
        .eq("user_id", payload.uid)
        .maybeSingle(),
    ]);
    user = userRes.data;
    sub = subRes.data;
  } catch (err) {
    console.error("Upgrade link lookup failed:", err);
    redirect("/auth?next=/dashboard/settings");
  }

  if (!user) {
    redirect("/auth?next=/dashboard/settings");
  }

  if (payload.intent === "billing") {
    // Dunning link: only meaningful while Stripe is retrying. Straight into
    // the portal (Stripe-hosted; handles its own verification).
    if (sub?.stripe_customer_id && sub.status === "past_due") {
      let portalUrl: string | null = null;
      try {
        const session = await stripe.billingPortal.sessions.create({
          customer: sub.stripe_customer_id,
          return_url: "https://www.entiremind.com/dashboard/settings",
        });
        portalUrl = session.url;
      } catch (err) {
        console.error("Billing portal session failed:", err);
      }
      redirect(portalUrl ?? "/auth?next=/dashboard/settings");
    }
    redirect("/auth?next=/dashboard/settings");
  }

  // intent === "upgrade"
  if (computeEntitlement(sub ?? null) === "paid" && sub?.plan !== "free") {
    redirect("/dashboard/settings");
  }

  const firstName = user.name?.split(" ")[0] || null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-em-purple-100 to-white flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg space-y-8 text-center">
        <p className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40">
          Entiremind
        </p>

        <div className="space-y-3">
          <h1 className="font-serif text-3xl md:text-4xl text-navy font-medium">
            {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
          </h1>
          <p className="text-teal-900/70 leading-relaxed">
            Everything you&apos;ve shared is saved. Pick a plan and the daily
            practice picks right back up tomorrow morning.
          </p>
        </div>

        <UpgradePlanPicker token={token} />

        <p className="text-xs text-teal-900/50">
          Secure checkout by Stripe. Cancel anytime from your settings.
        </p>
      </div>
    </main>
  );
}
