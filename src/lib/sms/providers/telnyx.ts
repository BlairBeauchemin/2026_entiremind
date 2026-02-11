import Telnyx from "telnyx";
import type { SmsProviderAdapter } from "../types";

function getTelnyxClient() {
  const apiKey = process.env.TELNYX_API_KEY;
  if (!apiKey) {
    throw new Error("TELNYX_API_KEY environment variable is not set");
  }
  return new Telnyx({ apiKey });
}

function getTelnyxPhoneNumber(): string {
  const phoneNumber = process.env.TELNYX_PHONE_NUMBER;
  if (!phoneNumber) {
    throw new Error("TELNYX_PHONE_NUMBER environment variable is not set");
  }
  return phoneNumber;
}

export const telnyxAdapter: SmsProviderAdapter = {
  provider: "telnyx",

  getPhoneNumber(): string {
    return getTelnyxPhoneNumber();
  },

  async sendSms(toPhoneNumber: string, text: string) {
    try {
      const telnyx = getTelnyxClient();
      const fromNumber = getTelnyxPhoneNumber();

      const response = await telnyx.messages.send({
        from: fromNumber,
        to: toPhoneNumber,
        text: text,
      });

      const externalMessageId = response.data?.id;

      return {
        success: true,
        externalMessageId: externalMessageId,
      };
    } catch (error) {
      console.error("Telnyx SMS send failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error sending SMS via Telnyx",
      };
    }
  },
};

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
 * Parse and validate a Telnyx webhook payload
 */
export function parseTelnyxWebhookPayload(body: unknown): TelnyxWebhookPayload | null {
  try {
    const payload = body as TelnyxWebhookPayload;

    if (!payload?.data?.event_type || !payload?.data?.payload) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
