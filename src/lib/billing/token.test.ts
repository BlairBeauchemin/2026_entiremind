import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  signUpgradeToken,
  verifyUpgradeToken,
  buildUpgradeLink,
  BILLING_TOKEN_TTL_DAYS,
  UPGRADE_TOKEN_TTL_DAYS,
} from "./token";

const NOW = new Date("2026-07-04T12:00:00Z");

describe("upgrade-link tokens", () => {
  beforeEach(() => {
    process.env.UPGRADE_LINK_SECRET = "test-secret-0123456789abcdef";
  });

  afterEach(() => {
    delete process.env.UPGRADE_LINK_SECRET;
  });

  it("round-trips a valid upgrade token", () => {
    const token = signUpgradeToken("user-123", "upgrade", NOW);
    const payload = verifyUpgradeToken(token, NOW);
    expect(payload).toEqual({
      uid: "user-123",
      intent: "upgrade",
      exp: Math.floor(NOW.getTime() / 1000) + UPGRADE_TOKEN_TTL_DAYS * 86_400,
    });
  });

  it("billing tokens carry the shorter expiry", () => {
    const token = signUpgradeToken("user-123", "billing", NOW);
    const payload = verifyUpgradeToken(token, NOW);
    expect(payload?.intent).toBe("billing");
    expect(BILLING_TOKEN_TTL_DAYS).toBeLessThan(UPGRADE_TOKEN_TTL_DAYS);
    expect(payload?.exp).toBe(
      Math.floor(NOW.getTime() / 1000) + BILLING_TOKEN_TTL_DAYS * 86_400,
    );
  });

  it("rejects a tampered payload (uid swap)", () => {
    const token = signUpgradeToken("user-123", "upgrade", NOW);
    const [payload, sig] = token.split(".");
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    decoded.uid = "victim-456";
    const forged =
      Buffer.from(JSON.stringify(decoded)).toString("base64url") + "." + sig;
    expect(verifyUpgradeToken(forged, NOW)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const token = signUpgradeToken("user-123", "upgrade", NOW);
    const flipped = token.slice(0, -2) + (token.endsWith("A") ? "BB" : "AA");
    expect(verifyUpgradeToken(flipped, NOW)).toBeNull();
  });

  it("rejects an expired token", () => {
    const token = signUpgradeToken("user-123", "upgrade", NOW);
    const later = new Date(NOW.getTime() + 61 * 86_400_000);
    expect(verifyUpgradeToken(token, later)).toBeNull();
  });

  it("rejects tokens signed with a different secret", () => {
    const token = signUpgradeToken("user-123", "upgrade", NOW);
    process.env.UPGRADE_LINK_SECRET = "another-secret-0123456789abcdef";
    expect(verifyUpgradeToken(token, NOW)).toBeNull();
  });

  it("rejects malformed input without throwing", () => {
    for (const garbage of [
      "",
      ".",
      "abc",
      "a.b.c",
      "!!!.###",
      "a".repeat(2000),
    ]) {
      expect(verifyUpgradeToken(garbage, NOW)).toBeNull();
    }
  });

  it("signing without a secret throws; buildUpgradeLink degrades to null", () => {
    delete process.env.UPGRADE_LINK_SECRET;
    expect(() => signUpgradeToken("user-123", "upgrade", NOW)).toThrow();
    expect(buildUpgradeLink("user-123", "upgrade")).toBeNull();
  });

  it("buildUpgradeLink produces an SMS-sized URL on the right path", () => {
    const link = buildUpgradeLink(
      "2f9d3a44-9c1b-4a55-8a6d-1f2e3d4c5b6a",
      "upgrade",
    );
    expect(link).toMatch(/^https:\/\/www\.entiremind\.com\/u\//);
    expect(link!.length).toBeLessThan(250);
  });
});
