import { createClient } from "@/lib/supabase/server";
import { CurrentIntention } from "@/components/dashboard/current-intention";
import { MessageFeed } from "@/components/dashboard/message-feed";
import { mockIntention, mockMessages } from "@/lib/mock-data";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
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

  const firstName = profile?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <h1 className="font-serif text-3xl md:text-4xl text-navy font-medium">
        {getGreeting()}, {firstName}
      </h1>

      {/* Current intention card - using mock data for now */}
      <CurrentIntention intention={mockIntention} />

      {/* Message feed - using mock data for now */}
      <MessageFeed messages={mockMessages} />
    </div>
  );
}
