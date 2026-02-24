import { createServiceRoleClient } from "../supabase";
import type { SmsProvider, SmsProviderAdapter, SendSmsResult } from "./types";
import { telnyxAdapter } from "./providers/telnyx";
import { twilioAdapter } from "./providers/twilio";

// Re-export types
export type { SmsProvider, SendSmsResult, InboundSmsData, SmsProviderAdapter } from "./types";

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
 * Send an SMS message to a user and store it in the database
 */
export async function sendSms(
  userId: string,
  toPhoneNumber: string,
  text: string
): Promise<SendSmsResult> {
  const supabase = createServiceRoleClient();
  const adapter = getProviderAdapter();
  const fromNumber = adapter.getPhoneNumber();

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
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error sending SMS",
    };
  }
}

/**
 * Store an inbound SMS message from a webhook
 */
export async function storeInboundSms(
  fromPhoneNumber: string,
  toPhoneNumber: string,
  text: string,
  externalMessageId: string,
  provider: SmsProvider
): Promise<{ success: boolean; messageId?: string; error?: string }> {
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
  return sendSms(userId, phoneNumber, welcomeMessage);
}
