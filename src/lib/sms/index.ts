import { createServiceRoleClient } from "../supabase";
import type { SmsProvider, SmsProviderAdapter, SendSmsResult, ContentType } from "./types";
import { telnyxAdapter } from "./providers/telnyx";
import { twilioAdapter } from "./providers/twilio";

// Re-export types
export type { SmsProvider, SendSmsResult, InboundSmsData, SmsProviderAdapter, ContentType } from "./types";

/**
 * Get the current SMS provider from environment
 */
export function getSmsProvider(): SmsProvider {
  const provider = process.env.SMS_PROVIDER;
  if (provider === "telnyx") {
    return "telnyx";
  }
  // Default to twilio
  return "twilio";
}

/**
 * Get the adapter for the current SMS provider
 */
function getProviderAdapter(): SmsProviderAdapter {
  const provider = getSmsProvider();
  switch (provider) {
    case "telnyx":
      return telnyxAdapter;
    case "twilio":
      return twilioAdapter;
    default:
      return twilioAdapter;
  }
}

/**
 * Options for sending SMS
 */
export interface SendSmsOptions {
  contentType?: ContentType;
  aiGenerated?: boolean;
}

/**
 * Send an SMS message to a user and store it in the database
 */
export async function sendSms(
  userId: string,
  toPhoneNumber: string,
  text: string,
  options: SendSmsOptions = {}
): Promise<SendSmsResult> {
  const supabase = createServiceRoleClient();
  const adapter = getProviderAdapter();
  const fromNumber = adapter.getPhoneNumber();
  const { contentType, aiGenerated = false } = options;

  try {
    // Send via the configured provider
    const result = await adapter.sendSms(toPhoneNumber, text);

    if (!result.success) {
      // Store failed message attempt in database
      await supabase.from("messages").insert({
        user_id: userId,
        direction: "outbound",
        from_number: fromNumber,
        to_number: toPhoneNumber,
        text: text,
        provider: adapter.provider,
        status: "failed",
        content_type: contentType,
        ai_generated: aiGenerated,
      });

      return {
        success: false,
        error: result.error,
      };
    }

    // Store outbound message in database
    const { data: message, error: dbError } = await supabase
      .from("messages")
      .insert({
        user_id: userId,
        direction: "outbound",
        from_number: fromNumber,
        to_number: toPhoneNumber,
        text: text,
        external_message_id: result.externalMessageId,
        provider: adapter.provider,
        status: "sent",
        content_type: contentType,
        ai_generated: aiGenerated,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Failed to store message in database:", dbError);
      // Message was sent but not stored - log but don't fail
      return {
        success: true,
        externalMessageId: result.externalMessageId,
        error: "Message sent but failed to store in database",
      };
    }

    // Update user_signals.last_message_sent_at (skip for acks — they're reactive)
    if (contentType !== "ack") {
      await supabase
        .from("user_signals")
        .upsert(
          {
            user_id: userId,
            last_message_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
    }

    return {
      success: true,
      messageId: message.id,
      externalMessageId: result.externalMessageId,
    };
  } catch (error) {
    console.error("Failed to send SMS:", error);

    // Store failed message attempt in database
    await supabase.from("messages").insert({
      user_id: userId,
      direction: "outbound",
      from_number: fromNumber,
      to_number: toPhoneNumber,
      text: text,
      provider: adapter.provider,
      status: "failed",
      content_type: contentType,
      ai_generated: aiGenerated,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending SMS",
    };
  }
}

/**
 * Result of storing an inbound SMS
 */
export interface StoreInboundResult {
  success: boolean;
  messageId?: string;
  userId?: string;
  replyToMessageId?: string;
  replyTimeMinutes?: number;
  error?: string;
}

/**
 * Store an inbound SMS message from a webhook
 * Links replies to outbound messages and calculates reply time
 */
export async function storeInboundSms(
  fromPhoneNumber: string,
  toPhoneNumber: string,
  text: string,
  externalMessageId: string,
  provider: SmsProvider
): Promise<StoreInboundResult> {
  const supabase = createServiceRoleClient();

  // Look up user by phone number
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("phone", fromPhoneNumber)
    .single();

  if (userError || !user) {
    console.error("User not found for phone number:", fromPhoneNumber);
    return {
      success: false,
      error: `User not found for phone number: ${fromPhoneNumber}`,
    };
  }

  // Find the most recent unreplied outbound message to link this as a reply
  // Look for outbound messages in the last 24 hours that don't have a reply
  const twentyFourHoursAgo = new Date();
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

  const { data: recentOutbound } = await supabase
    .from("messages")
    .select("id, created_at")
    .eq("user_id", user.id)
    .eq("direction", "outbound")
    .in("content_type", ["reflection", "quote", "check-in", "action", "gratitude", "manual"])
    .gte("created_at", twentyFourHoursAgo.toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let replyToMessageId: string | undefined;
  let replyTimeMinutes: number | undefined;

  if (recentOutbound) {
    // Check if this outbound already has a reply
    const { data: existingReply } = await supabase
      .from("messages")
      .select("id")
      .eq("reply_to_message_id", recentOutbound.id)
      .limit(1)
      .single();

    if (!existingReply) {
      // This is a reply to the outbound message
      replyToMessageId = recentOutbound.id;

      // Calculate reply time in minutes
      const outboundTime = new Date(recentOutbound.created_at).getTime();
      const replyTime = new Date().getTime();
      replyTimeMinutes = Math.round((replyTime - outboundTime) / (1000 * 60));
    }
  }

  // Store inbound message
  const { data: message, error: dbError } = await supabase
    .from("messages")
    .insert({
      user_id: user.id,
      direction: "inbound",
      from_number: fromPhoneNumber,
      to_number: toPhoneNumber,
      text: text,
      external_message_id: externalMessageId,
      provider: provider,
      status: "received",
      reply_to_message_id: replyToMessageId,
    })
    .select()
    .single();

  if (dbError) {
    console.error("Failed to store inbound message:", dbError);
    return {
      success: false,
      error: dbError.message,
    };
  }

  return {
    success: true,
    messageId: message.id,
    userId: user.id,
    replyToMessageId,
    replyTimeMinutes,
  };
}

/**
 * Send a welcome SMS to a user after onboarding
 */
export async function sendWelcomeSms(
  userId: string,
  userName: string,
  phoneNumber: string
): Promise<SendSmsResult> {
  const name = userName || "friend";
  const welcomeMessage =
    `Welcome to Entiremind, ${name}! You're enrolled in daily reflection prompts. ` +
    `Up to 2 msgs/day. Msg & data rates may apply. ` +
    `Reply HELP for help or STOP to cancel.`;
  return sendSms(userId, phoneNumber, welcomeMessage, { contentType: "welcome" });
}
