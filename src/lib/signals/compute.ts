import { createServiceRoleClient } from "../supabase";

/**
 * Compute engagement score based on user behavior
 *
 * Score ranges from 0 to 100:
 * - Starts at 50 (neutral)
 * - Increases with replies, especially quick/long replies
 * - Decreases with consecutive silences
 * - Factors in overall reply rate
 */
export function computeEngagementScore(params: {
  replyRate: number | null;
  consecutiveSilences: number;
  avgReplyTimeMinutes: number | null;
  totalReplies: number;
}): number {
  const { replyRate, consecutiveSilences, avgReplyTimeMinutes, totalReplies } = params;

  let score = 50; // Start neutral

  // Reply rate impact (+/- 25 points max)
  if (replyRate !== null) {
    // replyRate is 0-100, map to -25 to +25
    score += (replyRate - 50) * 0.5;
  }

  // Consecutive silences penalty (-5 per silence, max -20)
  score -= Math.min(consecutiveSilences * 5, 20);

  // Quick replies bonus (if avg < 10 min, +10 points max)
  if (avgReplyTimeMinutes !== null && avgReplyTimeMinutes < 10) {
    score += Math.max(0, 10 - avgReplyTimeMinutes);
  }

  // Engagement longevity bonus (+0.5 per reply, max +10)
  score += Math.min(totalReplies * 0.5, 10);

  // Clamp to 0-100 range
  return Math.max(0, Math.min(100, Math.round(score * 100) / 100));
}

/**
 * Recompute and update user signals after a new event
 */
export async function recomputeUserSignals(userId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  // Get all signal events for this user
  const { data: events, error: eventsError } = await supabase
    .from("signal_events")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (eventsError) {
    console.error("Failed to fetch signal events:", eventsError);
    return;
  }

  // Count only real prompts (exclude acks, welcome messages, etc.)
  const { count: totalSent } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("direction", "outbound")
    .in("content_type", ["reflection", "quote", "check-in", "action", "gratitude", "manual"]);

  const replyEvents = events?.filter((e) => e.event_type === "reply") || [];

  // Calculate reply times and lengths from metadata
  const replyTimes: number[] = [];
  const replyLengths: number[] = [];

  for (const event of replyEvents) {
    const metadata = event.metadata as Record<string, unknown>;
    if (typeof metadata?.reply_time_minutes === "number") {
      replyTimes.push(metadata.reply_time_minutes);
    }
    if (typeof metadata?.reply_length === "number") {
      replyLengths.push(metadata.reply_length);
    }
  }

  // Calculate aggregates
  const totalReplies = replyEvents.length;
  const totalMessagesSent = totalSent || 0;
  const replyRate =
    totalMessagesSent > 0
      ? Math.round((totalReplies / totalMessagesSent) * 10000) / 100
      : null;
  const avgReplyTimeMinutes =
    replyTimes.length > 0
      ? Math.round(replyTimes.reduce((a, b) => a + b, 0) / replyTimes.length)
      : null;
  const avgReplyLength =
    replyLengths.length > 0
      ? Math.round(replyLengths.reduce((a, b) => a + b, 0) / replyLengths.length)
      : null;

  // Find last reply time
  const lastReplyEvent = replyEvents[0];
  const lastReplyAt = lastReplyEvent?.created_at || null;

  // Count consecutive silences (from most recent events)
  let consecutiveSilences = 0;
  for (const event of events || []) {
    if (event.event_type === "silence") {
      consecutiveSilences++;
    } else if (event.event_type === "reply") {
      break; // Stop counting at first reply
    }
  }

  // Get last message sent time
  const { data: lastSentMsg } = await supabase
    .from("messages")
    .select("created_at")
    .eq("user_id", userId)
    .eq("direction", "outbound")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Compute engagement score
  const engagementScore = computeEngagementScore({
    replyRate,
    consecutiveSilences,
    avgReplyTimeMinutes,
    totalReplies,
  });

  // Upsert user signals
  const { error: updateError } = await supabase
    .from("user_signals")
    .upsert(
      {
        user_id: userId,
        total_messages_sent: totalMessagesSent,
        total_replies: totalReplies,
        reply_rate: replyRate,
        avg_reply_time_minutes: avgReplyTimeMinutes,
        avg_reply_length: avgReplyLength,
        last_reply_at: lastReplyAt,
        last_message_sent_at: lastSentMsg?.created_at || null,
        consecutive_silences: consecutiveSilences,
        engagement_score: engagementScore,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (updateError) {
    console.error("Failed to update user signals:", updateError);
  }
}
