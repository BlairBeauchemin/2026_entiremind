import { createClient } from "@/lib/supabase/server";
import { SettingsProfileForm } from "@/components/dashboard/settings-profile-form";
import { SettingsMessagingForm } from "@/components/dashboard/settings-messaging-form";
import { SettingsSubscription } from "@/components/dashboard/settings-subscription";
import type { Subscription } from "@/lib/types";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let profile = null;
  let subscription: Subscription | null = null;

  if (authUser) {
    // Fetch profile and subscription in parallel
    const [profileResult, subscriptionResult] = await Promise.all([
      supabase.from("users").select("*").eq("id", authUser.id).single(),
      supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", authUser.id)
        .single(),
    ]);

    profile = profileResult.data;

    if (subscriptionResult.data) {
      subscription = {
        id: subscriptionResult.data.id,
        userId: subscriptionResult.data.user_id,
        stripeCustomerId: subscriptionResult.data.stripe_customer_id,
        stripeSubscriptionId: subscriptionResult.data.stripe_subscription_id,
        plan: subscriptionResult.data.plan,
        status: subscriptionResult.data.status,
        currentPeriodEnd: subscriptionResult.data.current_period_end,
        cancelAtPeriodEnd: subscriptionResult.data.cancel_at_period_end,
      };
    }
  }

  // Fallback subscription if not found (shouldn't happen with trigger)
  const defaultSubscription: Subscription = {
    id: "",
    userId: authUser?.id || "",
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    plan: "free",
    status: "active",
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
  };

  return (
    <div className="space-y-10">
      <h1 className="font-serif text-3xl md:text-4xl text-navy font-medium">
        Settings
      </h1>

      <div className="space-y-6">
        <SettingsProfileForm user={profile} />
        <SettingsMessagingForm status={profile?.status || "active"} />
        <SettingsSubscription subscription={subscription || defaultSubscription} />
      </div>
    </div>
  );
}
