import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { FounderMessageTable } from "@/components/dashboard/founder-message-table";
import { SchedulingSection } from "@/components/dashboard/scheduling-section";
import { logAdminViewedMessages } from "@/lib/audit";

export default async function FounderPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/auth");
  }

  // Fetch user profile with role from database
  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();

  // Check if the current user has admin/founder role
  const isAdmin = ["admin", "founder"].includes(userProfile?.role ?? "");
  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Use service role client for admin queries (bypasses RLS)
  const serviceSupabase = createServiceRoleClient();

  // Fetch all messages with user info
  const { data: messages, error } = await serviceSupabase
    .from("messages")
    .select(
      `
      *,
      users:user_id (
        name,
        email,
        phone
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching messages:", error);
  }
  const { data: scheduledMessages, error: scheduledError } = await serviceSupabase
    .from("scheduled_messages")
    .select("*")
    .order("scheduled_for", { ascending: false })
    .limit(50);

  if (scheduledError) {
    console.error("Error fetching scheduled messages:", scheduledError);
  }

  // Transform scheduled messages for display
  const formattedScheduledMessages =
    scheduledMessages?.map((msg) => ({
      id: msg.id,
      toPhone: msg.to_phone,
      text: msg.text,
      scheduledFor: msg.scheduled_for,
      status: msg.status,
      createdAt: msg.created_at,
    })) || [];

  // Log audit entry for admin viewing messages
  await logAdminViewedMessages(authUser.id, messages?.length ?? 0);

  // Transform messages for display
  const formattedMessages =
    messages?.map((msg) => ({
      id: msg.id,
      direction: msg.direction,
      text: msg.text,
      status: msg.status,
      createdAt: msg.created_at,
      fromNumber: msg.from_number,
      toNumber: msg.to_number,
      userName: (msg.users as { name: string | null })?.name || "Unknown",
      userPhone: (msg.users as { phone: string | null })?.phone || msg.from_number,
    })) || [];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl md:text-4xl text-navy font-medium">
          Founder Review
        </h1>
        <p className="text-muted-foreground mt-2">
          View all user messages to understand patterns and improve the experience.
        </p>
      </div>

      <SchedulingSection initialMessages={formattedScheduledMessages} />

      <div>
        <h2 className="font-serif text-2xl text-navy font-medium mb-4">
          User Messages
        </h2>
        <FounderMessageTable messages={formattedMessages} />
      </div>
    </div>
  );
}
