import { createClient } from "@/lib/supabase/server";
import { SettingsProfileForm } from "@/components/dashboard/settings-profile-form";
import { SettingsMessagingForm } from "@/components/dashboard/settings-messaging-form";
import { SettingsSubscription } from "@/components/dashboard/settings-subscription";
import { mockSubscription } from "@/lib/mock-data";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  let profile = null;
  if (authUser) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    profile = data;
  }

  return (
    <div className="space-y-10">
      <h1 className="font-serif text-3xl md:text-4xl text-navy font-medium">
        Settings
      </h1>

      <div className="space-y-6">
        <SettingsProfileForm user={profile} />
        <SettingsMessagingForm status={profile?.status || "active"} />
        <SettingsSubscription subscription={mockSubscription} />
      </div>
    </div>
  );
}
