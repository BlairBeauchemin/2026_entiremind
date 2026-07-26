import { describe, it, expect } from "vitest";
import { isSteerActive, buildSteerAck, STEER_TTL_DAYS } from "./steer";

const NOW = new Date("2026-07-26T12:00:00Z");

function daysAgo(n: number): string {
  return new Date(NOW.getTime() - n * 24 * 3_600_000).toISOString();
}

describe("isSteerActive", () => {
  it("is false for a null/empty timestamp", () => {
    expect(isSteerActive(null, NOW)).toBe(false);
    expect(isSteerActive(undefined, NOW)).toBe(false);
    expect(isSteerActive("", NOW)).toBe(false);
  });

  it("is true within the TTL window", () => {
    expect(isSteerActive(daysAgo(0), NOW)).toBe(true);
    expect(isSteerActive(daysAgo(STEER_TTL_DAYS - 1), NOW)).toBe(true);
    expect(isSteerActive(daysAgo(STEER_TTL_DAYS), NOW)).toBe(true);
  });

  it("is false once the steer is older than the TTL", () => {
    expect(isSteerActive(daysAgo(STEER_TTL_DAYS + 1), NOW)).toBe(false);
  });

  it("is false for an unparseable timestamp", () => {
    expect(isSteerActive("not-a-date", NOW)).toBe(false);
  });
});

describe("buildSteerAck", () => {
  it("names the steer and points to the in-app settings page", () => {
    const ack = buildSteerAck("manifestation");
    expect(ack).toContain("manifestation");
    expect(ack.toLowerCase()).toContain("main intention");
    expect(ack).toContain("/dashboard/settings");
  });
});
