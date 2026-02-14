import { createClient } from "@/lib/supabase/server";
import { IntentionsTimeline } from "@/components/dashboard/intentions-timeline";
import type { Intention, Message } from "@/lib/types";

export default async function IntentionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let intentions: Intention[] = [];
  let messages: Message[] = [];

  if (user) {
    // Fetch ALL intentions (not just active)
    const { data: intentionsData } = await supabase
      .from("intentions")
      .select("*")
      .eq("user_id", user.id)
      .in("status", ["active", "completed"])
      .order("created_at", { ascending: false });

    if (intentionsData) {
      intentions = intentionsData.map((i) => ({
        id: i.id,
        userId: i.user_id,
        text: i.text,
        status: i.status as "active" | "completed",
        createdAt: i.created_at,
      }));
    }

    // Fetch user messages for reflections (inbound messages)
    const { data: messagesData } = await supabase
      .from("messages")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (messagesData) {
      messages = messagesData.map((m) => ({
        id: m.id,
        userId: m.user_id,
        direction: m.direction as "inbound" | "outbound",
        type: (m.type || "reflection") as "reflection" | "check-in" | "prompt" | "reply",
        body: m.text, // Database column is 'text', frontend type uses 'body'
        createdAt: m.created_at,
      }));
    }
  }

  return (
    <div className="space-y-10">
      <h1 className="font-serif text-3xl md:text-4xl text-navy font-medium">
        Your Intentions
      </h1>

      <IntentionsTimeline intentions={intentions} messages={messages} />
    </div>
  );
}
