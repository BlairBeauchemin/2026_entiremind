import { createHmac, timingSafeEqual } from "crypto";

/**
 * Purpose-bound upgrade-link tokens
 * (docs/plans/2026-07-04-sms-upgrade-link.md).
 *
 * Format: base64url(payload JSON) + "." + base64url(HMAC-SHA256(secret, payload))
 *
 * THREAT MODEL — a token is NEVER a login. Verifying one grants exactly one
 * capability: opening a payment flow (Stripe Checkout or billing portal)
 * for the embedded user. It exposes no messages, no memory, no dashboard,
 * and no route that accepts it may ever set a session. Tokens sit at rest
 * in the messages table and at Twilio like any link we text; expiry bounds
 * that exposure.
 */

export type UpgradeLinkIntent = "upgrade" | "billing";

export interface UpgradeTokenPayload {
  uid: string;
  intent: UpgradeLinkIntent;
  exp: number; // unix seconds
}

/** Trial-end links: "whenever you're ready" should stay true for a while. */
export const UPGRADE_TOKEN_TTL_DAYS = 60;
/** Dunning links: time-boxed by Stripe's retry cycle. */
export const BILLING_TOKEN_TTL_DAYS = 14;

function getSecret(): Buffer {
  const secret = process.env.UPGRADE_LINK_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "UPGRADE_LINK_SECRET is not set (needs 32+ random bytes); upgrade links cannot be issued",
    );
  }
  return Buffer.from(secret, "utf8");
}

function b64url(buf: Buffer): string {
  return buf.toString("base64url");
}

function hmac(payload: Buffer): Buffer {
  return createHmac("sha256", getSecret()).update(payload).digest();
}

export function signUpgradeToken(
  uid: string,
  intent: UpgradeLinkIntent,
  now: Date = new Date(),
): string {
  const ttlDays =
    intent === "billing" ? BILLING_TOKEN_TTL_DAYS : UPGRADE_TOKEN_TTL_DAYS;
  const payload: UpgradeTokenPayload = {
    uid,
    intent,
    exp: Math.floor(now.getTime() / 1000) + ttlDays * 86_400,
  };
  const payloadBuf = Buffer.from(JSON.stringify(payload), "utf8");
  return `${b64url(payloadBuf)}.${b64url(hmac(payloadBuf))}`;
}

/**
 * Verify a token and return its payload, or null for anything invalid:
 * malformed, tampered, expired, or wrong shape. Never throws on bad input
 * (only on missing server secret).
 */
export function verifyUpgradeToken(
  token: string,
  now: Date = new Date(),
): UpgradeTokenPayload | null {
  if (typeof token !== "string" || token.length > 1024) return null;
  const dot = token.indexOf(".");
  if (dot <= 0 || dot === token.length - 1) return null;

  let payloadBuf: Buffer;
  let signature: Buffer;
  try {
    payloadBuf = Buffer.from(token.slice(0, dot), "base64url");
    signature = Buffer.from(token.slice(dot + 1), "base64url");
  } catch {
    return null;
  }

  const expected = hmac(payloadBuf);
  if (
    signature.length !== expected.length ||
    !timingSafeEqual(signature, expected)
  ) {
    return null;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(payloadBuf.toString("utf8"));
  } catch {
    return null;
  }
  if (!parsed || typeof parsed !== "object") return null;
  const obj = parsed as Record<string, unknown>;
  if (
    typeof obj.uid !== "string" ||
    (obj.intent !== "upgrade" && obj.intent !== "billing") ||
    typeof obj.exp !== "number"
  ) {
    return null;
  }
  if (obj.exp <= Math.floor(now.getTime() / 1000)) return null;

  return { uid: obj.uid, intent: obj.intent, exp: obj.exp };
}

/**
 * Build the SMS-embeddable link, or null when the secret isn't configured —
 * callers fall back to the settings URL rather than failing the send.
 */
export function buildUpgradeLink(
  uid: string,
  intent: UpgradeLinkIntent,
): string | null {
  try {
    return `https://www.entiremind.com/u/${signUpgradeToken(uid, intent)}`;
  } catch (err) {
    console.error(
      "Upgrade link unavailable:",
      err instanceof Error ? err.message : err,
    );
    return null;
  }
}
