import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { generateKeyPairSync, sign as cryptoSign } from "crypto";
import { verifyTelnyxSignature } from "./telnyx";

// Generate a real Ed25519 keypair and export the raw 32-byte public key the
// way Telnyx publishes it (base64 of the raw key, no SPKI framing).
const { publicKey, privateKey } = generateKeyPairSync("ed25519");
const spki = publicKey.export({ format: "der", type: "spki" });
const rawPublicKeyBase64 = spki.subarray(spki.length - 32).toString("base64");

function signPayload(timestamp: string, rawBody: string): string {
  return cryptoSign(
    null,
    Buffer.from(`${timestamp}|${rawBody}`, "utf8"),
    privateKey,
  ).toString("base64");
}

describe("verifyTelnyxSignature", () => {
  const rawBody = JSON.stringify({ data: { event_type: "message.received" } });
  let timestamp: string;

  beforeEach(() => {
    process.env.TELNYX_PUBLIC_KEY = rawPublicKeyBase64;
    timestamp = String(Math.floor(Date.now() / 1000));
  });

  afterEach(() => {
    delete process.env.TELNYX_PUBLIC_KEY;
    vi.useRealTimers();
  });

  it("accepts a correctly signed payload", () => {
    expect(
      verifyTelnyxSignature({
        signatureBase64: signPayload(timestamp, rawBody),
        timestamp,
        rawBody,
      }),
    ).toBe(true);
  });

  it("rejects a tampered body", () => {
    expect(
      verifyTelnyxSignature({
        signatureBase64: signPayload(timestamp, rawBody),
        timestamp,
        rawBody: rawBody + "x",
      }),
    ).toBe(false);
  });

  it("rejects a signature from a different key", () => {
    const other = generateKeyPairSync("ed25519");
    const forged = cryptoSign(
      null,
      Buffer.from(`${timestamp}|${rawBody}`, "utf8"),
      other.privateKey,
    ).toString("base64");
    expect(
      verifyTelnyxSignature({ signatureBase64: forged, timestamp, rawBody }),
    ).toBe(false);
  });

  it("rejects when TELNYX_PUBLIC_KEY is not configured", () => {
    delete process.env.TELNYX_PUBLIC_KEY;
    expect(
      verifyTelnyxSignature({
        signatureBase64: signPayload(timestamp, rawBody),
        timestamp,
        rawBody,
      }),
    ).toBe(false);
  });

  it("rejects missing signature or timestamp headers", () => {
    expect(
      verifyTelnyxSignature({ signatureBase64: null, timestamp, rawBody }),
    ).toBe(false);
    expect(
      verifyTelnyxSignature({
        signatureBase64: signPayload(timestamp, rawBody),
        timestamp: null,
        rawBody,
      }),
    ).toBe(false);
  });

  it("rejects a stale timestamp (replay protection)", () => {
    const stale = String(Math.floor(Date.now() / 1000) - 6 * 60);
    expect(
      verifyTelnyxSignature({
        signatureBase64: signPayload(stale, rawBody),
        timestamp: stale,
        rawBody,
      }),
    ).toBe(false);
  });

  it("rejects garbage signature material without throwing", () => {
    expect(
      verifyTelnyxSignature({
        signatureBase64: "not-base64!!",
        timestamp,
        rawBody,
      }),
    ).toBe(false);
    process.env.TELNYX_PUBLIC_KEY = "tooshort";
    expect(
      verifyTelnyxSignature({
        signatureBase64: signPayload(timestamp, rawBody),
        timestamp,
        rawBody,
      }),
    ).toBe(false);
  });
});
