import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { sendSms } from "@/lib/sms";

/**
 * Cron handler: Process pending scheduled messages
 * Runs hourly via Vercel Cron (configured in vercel.json)
 *
 * Security: Protected by CRON_SECRET header (Vercel adds this automatically)
 */
export async function GET(request: Request) {
  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET environment variable not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error("Invalid cron authorization");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceRoleClient();
  const now = new Date().toISOString();

  // Fetch pending messages that are due
  const { data: pendingMessages, error: fetchError } = await supabase
    .from("scheduled_messages")
    .select("*")
    .eq("status", "pending")
    .lte("scheduled_for", now)
    .order("scheduled_for", { ascending: true })
    .limit(50); // Process in batches to avoid timeout

  if (fetchError) {
    console.error("Failed to fetch pending messages:", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch pending messages" },
      { status: 500 }
    );
  }

  if (!pendingMessages || pendingMessages.length === 0) {
    return NextResponse.json({
      success: true,
      processed: 0,
      message: "No pending messages to send",
    });
  }

  console.log(`Processing ${pendingMessages.length} scheduled messages`);

  let sent = 0;
  let failed = 0;

  for (const scheduledMsg of pendingMessages) {
    try {
      // Send the SMS
      const result = await sendSms(
        scheduledMsg.user_id,
        scheduledMsg.to_phone,
        scheduledMsg.text
      );

      if (result.success) {
        // Update status to sent
        await supabase
          .from("scheduled_messages")
          .update({
            status: "sent",
            sent_message_id: result.messageId || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", scheduledMsg.id);

        sent++;
        console.log(`Sent scheduled message ${scheduledMsg.id}`);
      } else {
        // Update status to failed with error
        await supabase
          .from("scheduled_messages")
          .update({
            status: "failed",
            error_message: result.error || "Unknown error",
            updated_at: new Date().toISOString(),
          })
          .eq("id", scheduledMsg.id);

        failed++;
        console.error(
          `Failed to send scheduled message ${scheduledMsg.id}:`,
          result.error
        );
      }
    } catch (error) {
      // Update status to failed with error
      await supabase
        .from("scheduled_messages")
        .update({
          status: "failed",
          error_message: error instanceof Error ? error.message : "Unknown error",
          updated_at: new Date().toISOString(),
        })
        .eq("id", scheduledMsg.id);

      failed++;
      console.error(`Exception sending scheduled message ${scheduledMsg.id}:`, error);
    }
  }

  console.log(`Cron complete: ${sent} sent, ${failed} failed`);

  return NextResponse.json({
    success: true,
    processed: pendingMessages.length,
    sent,
    failed,
  });
}
