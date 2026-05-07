import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { sendSms } from "@/lib/sms";

/**
 * POST /api/schedule/send
 * Manually send a scheduled message immediately (founder-only)
 *
 * Body:
 * - id: string (required) - Scheduled message ID to send
 */
export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check admin role
  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();

  const isAdmin = ["admin", "founder"].includes(userProfile?.role ?? "");
  if (!isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id } = body;

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "id is required and must be a string" },
      { status: 400 }
    );
  }

  const serviceSupabase = createServiceRoleClient();

  // Fetch the scheduled message
  const { data: scheduledMsg, error: fetchError } = await serviceSupabase
    .from("scheduled_messages")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !scheduledMsg) {
    return NextResponse.json(
      { error: "Scheduled message not found" },
      { status: 404 }
    );
  }

  if (scheduledMsg.status !== "pending") {
    return NextResponse.json(
      { error: `Cannot send message with status: ${scheduledMsg.status}` },
      { status: 400 }
    );
  }

  // Send the SMS
  try {
    const result = await sendSms(
      scheduledMsg.user_id,
      scheduledMsg.to_phone,
      scheduledMsg.text
    );

    if (result.success) {
      // Update status to sent
      await serviceSupabase
        .from("scheduled_messages")
        .update({
          status: "sent",
          sent_message_id: result.messageId || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      return NextResponse.json({
        success: true,
        message: "Message sent successfully",
        messageId: result.messageId,
      });
    } else {
      // Update status to failed
      await serviceSupabase
        .from("scheduled_messages")
        .update({
          status: "failed",
          error_message: result.error || "Unknown error",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      return NextResponse.json(
        { error: result.error || "Failed to send message" },
        { status: 500 }
      );
    }
  } catch (error) {
    // Update status to failed
    await serviceSupabase
      .from("scheduled_messages")
      .update({
        status: "failed",
        error_message: error instanceof Error ? error.message : "Unknown error",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send message" },
      { status: 500 }
    );
  }
}
