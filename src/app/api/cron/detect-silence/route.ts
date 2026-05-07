import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { trackSilence } from "@/lib/signals";

// Silence detection window: messages older than this without a reply are considered silent
const SILENCE_WINDOW_HOURS = 20;

/**
 * Silence Detection Cron: Detect messages without replies
 * Runs daily, typically a few hours before the daily send
 *
 * This identifies outbound messages that didn't receive a reply and marks them as silence signals.
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

  const supabase = createServiceRoleClient();

  // Calculate the time window
  // We look for outbound messages that are old enough to expect a reply (SILENCE_WINDOW_HOURS)
  // but not too old (we don't want to re-process old silences)
  const windowEnd = new Date();
  windowEnd.setHours(windowEnd.getHours() - SILENCE_WINDOW_HOURS);

  const windowStart = new Date();
  windowStart.setHours(windowStart.getHours() - SILENCE_WINDOW_HOURS - 24); // 24 hour lookback

  console.log(`Detecting silences for messages between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`);

  // Find outbound messages in the window that don't have replies
  const { data: outboundMessages, error: fetchError } = await supabase
    .from("messages")
    .select("id, user_id, created_at, text")
    .eq("direction", "outbound")
    .gte("created_at", windowStart.toISOString())
    .lte("created_at", windowEnd.toISOString())
    .order("created_at", { ascending: true });

  if (fetchError) {
    console.error("Failed to fetch outbound messages:", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 }
    );
  }

  if (!outboundMessages || outboundMessages.length === 0) {
    console.log("No outbound messages in detection window");
    return NextResponse.json({
      success: true,
      processed: 0,
      silences: 0,
      message: "No outbound messages in detection window",
    });
  }

  console.log(`Found ${outboundMessages.length} outbound messages to check`);

  let silencesDetected = 0;
  let alreadyProcessed = 0;

  for (const msg of outboundMessages) {
    // Check if there's a reply to this message
    const { data: reply } = await supabase
      .from("messages")
      .select("id")
      .eq("reply_to_message_id", msg.id)
      .limit(1)
      .single();

    if (reply) {
      // Has a linked reply, not a silence
      continue;
    }

    // Also check for any inbound message from this user after the outbound
    const { data: anyInbound } = await supabase
      .from("messages")
      .select("id")
      .eq("user_id", msg.user_id)
      .eq("direction", "inbound")
      .gt("created_at", msg.created_at)
      .limit(1)
      .single();

    if (anyInbound) {
      // User did reply (even if not linked), not a silence
      continue;
    }

    // Check if we already tracked silence for this message
    const { data: existingSilence } = await supabase
      .from("signal_events")
      .select("id")
      .eq("outbound_message_id", msg.id)
      .eq("event_type", "silence")
      .limit(1)
      .single();

    if (existingSilence) {
      // Already processed
      alreadyProcessed++;
      continue;
    }

    // This is a silence - track it
    await trackSilence({
      userId: msg.user_id,
      outboundMessageId: msg.id,
    });

    silencesDetected++;
    console.log(`Detected silence for message ${msg.id} (user: ${msg.user_id})`);
  }

  const duration = Date.now() - startTime;
  console.log(
    `Silence detection complete: ${silencesDetected} new silences, ${alreadyProcessed} already processed in ${duration}ms`
  );

  return NextResponse.json({
    success: true,
    processed: outboundMessages.length,
    silences: silencesDetected,
    already_processed: alreadyProcessed,
    duration_ms: duration,
  });
}
