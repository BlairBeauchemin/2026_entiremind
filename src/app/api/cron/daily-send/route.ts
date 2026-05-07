import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { sendSms } from "@/lib/sms";
import { generateMessageForUser, getAiProvider } from "@/lib/ai";

/**
 * Daily Send Cron: Send AI-generated messages to all active users
 * Runs daily at 7:45 AM Pacific via Vercel Cron
 *
 * Security: Protected by CRON_SECRET header (Vercel adds this automatically)
 */
export async function GET(request: Request) {
  const startTime = Date.now();

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

  // Check if AI provider is configured
  const aiProvider = getAiProvider();
  const apiKeyEnvVar = aiProvider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
  if (!process.env[apiKeyEnvVar]) {
    console.error(`${apiKeyEnvVar} environment variable not set`);
    return NextResponse.json(
      { error: `AI provider (${aiProvider}) not configured` },
      { status: 500 }
    );
  }

  console.log(`Using AI provider: ${aiProvider}`);

  const supabase = createServiceRoleClient();

  // Get all active users with phone numbers who have completed onboarding
  const { data: activeUsers, error: usersError } = await supabase
    .from("users")
    .select("id, phone, name, status")
    .eq("status", "active")
    .eq("onboarding_completed", true)
    .not("phone", "is", null);

  if (usersError) {
    console.error("Failed to fetch active users:", usersError);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }

  if (!activeUsers || activeUsers.length === 0) {
    console.log("No active users to send messages to");
    return NextResponse.json({
      success: true,
      processed: 0,
      sent: 0,
      failed: 0,
      message: "No active users with phone numbers",
    });
  }

  console.log(`Processing ${activeUsers.length} active users for daily send`);

  let sent = 0;
  let failed = 0;
  const errors: Array<{ userId: string; error: string }> = [];

  // Process users sequentially to avoid rate limits
  for (const user of activeUsers) {
    if (!user.phone) continue;

    try {
      // Check if we already sent a message to this user today
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: todayMessages } = await supabase
        .from("messages")
        .select("id")
        .eq("user_id", user.id)
        .eq("direction", "outbound")
        .gte("created_at", todayStart.toISOString())
        .limit(1);

      if (todayMessages && todayMessages.length > 0) {
        console.log(`User ${user.id} already received a message today, skipping`);
        continue;
      }

      // Generate AI message for this user
      const generatedMessage = await generateMessageForUser(user.id);

      // Send the SMS
      const result = await sendSms(user.id, user.phone, generatedMessage.text, {
        contentType: generatedMessage.contentType,
        aiGenerated: true,
      });

      if (result.success) {
        sent++;
        console.log(`Sent daily message to user ${user.id}: "${generatedMessage.text.substring(0, 50)}..."`);
      } else {
        failed++;
        errors.push({ userId: user.id, error: result.error || "Unknown error" });
        console.error(`Failed to send to user ${user.id}:`, result.error);
      }

      // Small delay between sends to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      failed++;
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      errors.push({ userId: user.id, error: errorMessage });
      console.error(`Exception sending to user ${user.id}:`, error);
    }
  }

  const duration = Date.now() - startTime;
  console.log(`Daily send complete: ${sent} sent, ${failed} failed in ${duration}ms`);

  return NextResponse.json({
    success: true,
    processed: activeUsers.length,
    sent,
    failed,
    duration_ms: duration,
    errors: errors.length > 0 ? errors : undefined,
  });
}
