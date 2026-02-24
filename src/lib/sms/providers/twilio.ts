import twilio from "twilio";
import type { SmsProviderAdapter } from "../types";

function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (!accountSid || !authToken) {
    throw new Error(
      "TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables must be set"
    );
  }

  return twilio(accountSid, authToken);
}

function getTwilioPhoneNumber(): string {
  const phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!phoneNumber) {
    throw new Error("TWILIO_PHONE_NUMBER environment variable is not set");
  }
  return phoneNumber;
}

export const twilioAdapter: SmsProviderAdapter = {
  provider: "twilio",

  getPhoneNumber(): string {
    return getTwilioPhoneNumber();
  },

  async sendSms(toPhoneNumber: string, text: string) {
    try {
      const client = getTwilioClient();
      const fromNumber = getTwilioPhoneNumber();

      const message = await client.messages.create({
        body: text,
        to: toPhoneNumber,
        from: fromNumber,
      });

      return {
        success: true,
        externalMessageId: message.sid,
      };
    } catch (error) {
      console.error("Twilio SMS send failed:", error);

      // Handle Twilio-specific errors
      if (error && typeof error === "object" && "code" in error) {
        const twilioError = error as { code: number; message: string };
        return {
          success: false,
          error: `Twilio Error ${twilioError.code}: ${twilioError.message}`,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error sending SMS via Twilio",
      };
    }
  },
};

// Types for Twilio webhook payloads (form-encoded)
export interface TwilioWebhookPayload {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia?: string;
  NumSegments?: string;
}

/**
 * Parse Twilio form-encoded webhook data
 */
export function parseTwilioWebhookPayload(
  formData: FormData
): TwilioWebhookPayload | null {
  try {
    const messageSid = formData.get("MessageSid");
    const accountSid = formData.get("AccountSid");
    const from = formData.get("From");
    const to = formData.get("To");
    const body = formData.get("Body");

    if (!messageSid || !accountSid || !from || !to || body === null) {
      return null;
    }

    return {
      MessageSid: messageSid.toString(),
      AccountSid: accountSid.toString(),
      From: from.toString(),
      To: to.toString(),
      Body: body.toString(),
      NumMedia: formData.get("NumMedia")?.toString(),
      NumSegments: formData.get("NumSegments")?.toString(),
    };
  } catch {
    return null;
  }
}

/**
 * Validate Twilio webhook signature
 */
export function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) {
    console.error("TWILIO_AUTH_TOKEN not set, cannot validate signature");
    return false;
  }

  return twilio.validateRequest(authToken, signature, url, params);
}

/**
 * Create an empty TwiML response (no auto-reply)
 */
export function createEmptyTwimlResponse(): string {
  const MessagingResponse = twilio.twiml.MessagingResponse;
  const response = new MessagingResponse();
  return response.toString();
}

/**
 * Create a TwiML response with a text message body
 */
export function createTwimlResponse(messageBody: string): string {
  const MessagingResponse = twilio.twiml.MessagingResponse;
  const response = new MessagingResponse();
  response.message(messageBody);
  return response.toString();
}
