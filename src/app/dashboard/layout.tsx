import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { UserProvider } from "@/components/dashboard/user-context";
import type { DbUser, DbSubscription } from "@/lib/supabase";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let profile: DbUser | null = null;
  let subscription: DbSubscription | null = null;

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
    subscription = subscriptionResult.data;
  }

  return (
    <UserProvider user={profile} subscription={subscription}>
      <DashboardShell>{children}</DashboardShell>
    </UserProvider>
  );
}
