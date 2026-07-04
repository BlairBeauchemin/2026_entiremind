import Telnyx from "telnyx";
import { createPublicKey, verify as cryptoVerify } from "crypto";
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

// Max allowed clock skew between Telnyx's timestamp header and our clock.
// Prevents replay of captured webhook payloads.
const TELNYX_TIMESTAMP_TOLERANCE_SECONDS = 5 * 60;

// DER prefix for an Ed25519 SubjectPublicKeyInfo wrapper. Telnyx publishes the
// raw 32-byte public key base64-encoded; Node's crypto needs the SPKI framing.
const ED25519_SPKI_PREFIX = Buffer.from("302a300506032b6570032100", "hex");

/**
 * Verify a Telnyx webhook's Ed25519 signature.
 *
 * Telnyx signs `${timestamp}|${rawBody}` with its private key and sends the
 * signature in `telnyx-signature-ed25519` plus the timestamp in
 * `telnyx-timestamp`. The account's public key lives in the Telnyx portal and
 * must be configured as TELNYX_PUBLIC_KEY. Returns false (never throws) on
 * any missing input, malformed key, or stale timestamp.
 */
export function verifyTelnyxSignature(params: {
  signatureBase64: string | null;
  timestamp: string | null;
  rawBody: string;
}): boolean {
  const { signatureBase64, timestamp, rawBody } = params;
  const publicKeyBase64 = process.env.TELNYX_PUBLIC_KEY;

  if (!publicKeyBase64 || !signatureBase64 || !timestamp) {
    return false;
  }

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) {
    return false;
  }
  const skew = Math.abs(Date.now() / 1000 - timestampSeconds);
  if (skew > TELNYX_TIMESTAMP_TOLERANCE_SECONDS) {
    return false;
  }

  try {
    const rawKey = Buffer.from(publicKeyBase64, "base64");
    if (rawKey.length !== 32) return false;
    const publicKey = createPublicKey({
      key: Buffer.concat([ED25519_SPKI_PREFIX, rawKey]),
      format: "der",
      type: "spki",
    });
    const message = Buffer.from(`${timestamp}|${rawBody}`, "utf8");
    const signature = Buffer.from(signatureBase64, "base64");
    return cryptoVerify(null, message, publicKey, signature);
  } catch {
    return false;
  }
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
