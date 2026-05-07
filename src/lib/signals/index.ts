import { createServiceRoleClient } from "../supabase";
import type { TrackReplyParams, TrackSilenceParams, UserSignalsSummary } from "./types";
import { recomputeUserSignals } from "./compute";

// Re-export types
export type { SignalEventType, SignalMetadata, TrackReplyParams, TrackSilenceParams, UserSignalsSummary } from "./types";

// Quick reply threshold (5 minutes)
const QUICK_REPLY_THRESHOLD_MINUTES = 5;

// Long reply threshold (100 characters)
const LONG_REPLY_THRESHOLD_CHARS = 100;

/**
 * Track a user reply to an outbound message
 */
export async function trackReply(params: TrackReplyParams): Promise<void> {
  const { userId, inboundMessageId, outboundMessageId, replyTimeMinutes, replyLength } = params;
  const supabase = createServiceRoleClient();

  const metadata = {
    reply_time_minutes: replyTimeMinutes,
    reply_length: replyLength,
  };

  // Create base reply event
  const { error: replyError } = await supabase.from("signal_events").insert({
    user_id: userId,
    event_type: "reply",
    message_id: inboundMessageId,
    outbound_message_id: outboundMessageId,
    metadata,
  });

  if (replyError) {
    console.error("Failed to track reply signal:", replyError);
  }

  // Track quick reply if applicable
  if (replyTimeMinutes !== null && replyTimeMinutes <= QUICK_REPLY_THRESHOLD_MINUTES) {
    const { error: quickError } = await supabase.from("signal_events").insert({
      user_id: userId,
      event_type: "quick_reply",
      message_id: inboundMessageId,
      outbound_message_id: outboundMessageId,
      metadata,
    });

    if (quickError) {
      console.error("Failed to track quick reply signal:", quickError);
    }
  }

  // Track long reply if applicable
  if (replyLength >= LONG_REPLY_THRESHOLD_CHARS) {
    const { error: longError } = await supabase.from("signal_events").insert({
      user_id: userId,
      event_type: "long_reply",
      message_id: inboundMessageId,
      outbound_message_id: outboundMessageId,
      metadata,
    });

    if (longError) {
      console.error("Failed to track long reply signal:", longError);
    }
  }

  // Recompute user signals
  await recomputeUserSignals(userId);
}

/**
 * Track silence - user did not reply to an outbound message
 */
export async function trackSilence(params: TrackSilenceParams): Promise<void> {
  const { userId, outboundMessageId } = params;
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("signal_events").insert({
    user_id: userId,
    event_type: "silence",
    outbound_message_id: outboundMessageId,
  });

  if (error) {
    console.error("Failed to track silence signal:", error);
    return;
  }

  // Recompute user signals
  await recomputeUserSignals(userId);
}

/**
 * Track an unprompted message (user reached out without recent outbound)
 */
export async function trackUnprompted(
  userId: string,
  inboundMessageId: string
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("signal_events").insert({
    user_id: userId,
    event_type: "unprompted",
    message_id: inboundMessageId,
  });

  if (error) {
    console.error("Failed to track unprompted signal:", error);
    return;
  }

  // Recompute user signals
  await recomputeUserSignals(userId);
}

/**
 * Track a STOP request
 */
export async function trackStopRequest(
  userId: string,
  inboundMessageId: string
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("signal_events").insert({
    user_id: userId,
    event_type: "stop_request",
    message_id: inboundMessageId,
  });

  if (error) {
    console.error("Failed to track stop request signal:", error);
  }
}

/**
 * Get user signals summary
 */
export async function getUserSignals(userId: string): Promise<UserSignalsSummary | null> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("user_signals")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    userId: data.user_id,
    totalMessagesSent: data.total_messages_sent,
    totalReplies: data.total_replies,
    replyRate: data.reply_rate,
    avgReplyTimeMinutes: data.avg_reply_time_minutes,
    avgReplyLength: data.avg_reply_length,
    lastReplyAt: data.last_reply_at,
    lastMessageSentAt: data.last_message_sent_at,
    consecutiveSilences: data.consecutive_silences,
    engagementScore: data.engagement_score,
  };
}

/**
 * Find the most recent outbound message to a user that doesn't have a reply yet
 * Returns null if no unreplied outbound message exists within the window
 */
export async function findUnrepliedOutboundMessage(
  userId: string,
  windowHours: number = 24
): Promise<{ id: string; createdAt: string; text: string } | null> {
  const supabase = createServiceRoleClient();

  // Get the cutoff time
  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - windowHours);

  // Find most recent outbound message within window
  const { data: outboundMsg, error: outboundError } = await supabase
    .from("messages")
    .select("id, created_at, text")
    .eq("user_id", userId)
    .eq("direction", "outbound")
    .gte("created_at", cutoff.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (outboundError || !outboundMsg) {
    return null;
  }

  // Check if there's a reply to this message
  const { data: replyMsg } = await supabase
    .from("messages")
    .select("id")
    .eq("user_id", userId)
    .eq("direction", "inbound")
    .eq("reply_to_message_id", outboundMsg.id)
    .limit(1)
    .single();

  // If there's already a reply linked, check for any inbound after the outbound
  if (!replyMsg) {
    const { data: anyInbound } = await supabase
      .from("messages")
      .select("id")
      .eq("user_id", userId)
      .eq("direction", "inbound")
      .gt("created_at", outboundMsg.created_at)
      .limit(1)
      .single();

    if (anyInbound) {
      // There was a reply (even if not linked), so this isn't unreplied
      return null;
    }
  } else {
    return null; // Has a linked reply
  }

  return {
    id: outboundMsg.id,
    createdAt: outboundMsg.created_at,
    text: outboundMsg.text,
  };
}
