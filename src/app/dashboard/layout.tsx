import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { UserProvider } from "@/components/dashboard/user-context";
import type { DbUser } from "@/lib/supabase";

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

  if (authUser) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    profile = data;
  }

  return (
    <UserProvider user={profile}>
      <DashboardShell>{children}</DashboardShell>
    </UserProvider>
  );
}
