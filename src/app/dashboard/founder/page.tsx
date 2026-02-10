import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FounderMessageTable } from "@/components/dashboard/founder-message-table";

// Admin emails that can access the founder review interface
const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL,
  // Add more admin emails as needed
].filter(Boolean);

export default async function FounderPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/auth");
  }

  // Check if the current user is an admin
  const isAdmin = ADMIN_EMAILS.includes(authUser.email || "");
  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Fetch all messages with user info
  const { data: messages, error } = await supabase
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

      <FounderMessageTable messages={formattedMessages} />
    </div>
  );
}
