import Telnyx from "telnyx";
import { createServiceRoleClient } from "./supabase";

// Initialize Telnyx client
function getTelnyxClient() {
  const apiKey = process.env.TELNYX_API_KEY;
  if (!apiKey) {
    throw new Error("TELNYX_API_KEY environment variable is not set");
  }
  return new Telnyx({ apiKey });
}

// Get the configured Telnyx phone number
function getTelnyxPhoneNumber(): string {
  const phoneNumber = process.env.TELNYX_PHONE_NUMBER;
  if (!phoneNumber) {
    throw new Error("TELNYX_PHONE_NUMBER environment variable is not set");
  }
  return phoneNumber;
}

export interface SendSmsResult {
  success: boolean;
  messageId?: string;
  telnyxMessageId?: string;
  error?: string;
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
  const fromNumber = getTelnyxPhoneNumber();

  try {
    const telnyx = getTelnyxClient();

    // Send via Telnyx
    const response = await telnyx.messages.send({
      from: fromNumber,
      to: toPhoneNumber,
      text: text,
    });

    const telnyxMessageId = response.data?.id;

    // Store outbound message in database
    const { data: message, error: dbError } = await supabase
      .from("messages")
      .insert({
        user_id: userId,
        direction: "outbound",
        from_number: fromNumber,
        to_number: toPhoneNumber,
        text: text,
        telnyx_message_id: telnyxMessageId,
        status: "sent",
      })
      .select()
      .single();

    if (dbError) {
      console.error("Failed to store message in database:", dbError);
      // Message was sent but not stored - log but don't fail
      return {
        success: true,
        telnyxMessageId: telnyxMessageId,
        error: "Message sent but failed to store in database",
      };
    }

    return {
      success: true,
      messageId: message.id,
      telnyxMessageId: telnyxMessageId,
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
  telnyxMessageId: string
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
      telnyx_message_id: telnyxMessageId,
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
  const welcomeMessage = `Welcome to Entiremind, ${userName || "friend"}! Your intention has been set. Reply anytime to reflect.`;
  return sendSms(userId, phoneNumber, welcomeMessage);
}

// Types for webhook payloads
export interface TelnyxWebhookPayload {
  data: {
    event_type: string;
    id: string;
    occurred_at: string;
    payload: {
      id: string;
      direction: "inbound" | "outbound";
      from: {
        phone_number: string;
        carrier?: string;
        line_type?: string;
      };
      to: Array<{
        phone_number: string;
        status?: string;
      }>;
      text: string;
      received_at?: string;
      sent_at?: string;
      type?: string;
    };
    record_type: string;
  };
  meta?: {
    attempt: number;
    delivered_to: string;
  };
}

/**
 * Validate and parse a Telnyx webhook payload
 */
export function parseWebhookPayload(body: unknown): TelnyxWebhookPayload | null {
  try {
    const payload = body as TelnyxWebhookPayload;

    // Basic validation
    if (!payload?.data?.event_type || !payload?.data?.payload) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
