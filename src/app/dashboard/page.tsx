import { createClient } from "@/lib/supabase/server";
import { CurrentIntention } from "@/components/dashboard/current-intention";
import { MessageFeed } from "@/components/dashboard/message-feed";
import type { Message } from "@/lib/types";

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
  let currentIntention = null;
  let messages: Message[] = [];

  if (authUser) {
    const { data: userData } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();
    profile = userData;

    // Fetch the user's active intention
    const { data: intentionData } = await supabase
      .from("intentions")
      .select("*")
      .eq("user_id", authUser.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (intentionData) {
      currentIntention = {
        id: intentionData.id,
        userId: intentionData.user_id,
        text: intentionData.text,
        status: intentionData.status as "active" | "completed",
        createdAt: intentionData.created_at,
      };

      // Fetch messages from the current intention's start date onwards
      const { data: messagesData } = await supabase
        .from("messages")
        .select("*")
        .eq("user_id", authUser.id)
        .gte("created_at", intentionData.created_at)
        .order("created_at", { ascending: false });

      if (messagesData) {
        messages = messagesData.map((m) => ({
          id: m.id,
          userId: m.user_id,
          direction: m.direction as "inbound" | "outbound",
          type: (m.type || "reflection") as
            | "reflection"
            | "check-in"
            | "prompt"
            | "reply",
          body: m.text,
          createdAt: m.created_at,
        }));
      }
    }
  }

  const firstName = profile?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <h1 className="font-serif text-3xl md:text-4xl text-navy font-medium">
        {getGreeting()}, {firstName}
      </h1>

      {/* Current intention card */}
      {currentIntention && <CurrentIntention intention={currentIntention} />}

      <MessageFeed messages={messages} />
    </div>
  );
}
