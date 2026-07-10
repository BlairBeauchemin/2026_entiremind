import { describe, it, expect } from "vitest";
import {
  shouldSendDunningNotice,
  buildPaymentFailedMessage,
  buildSubscriptionEndedMessage,
} from "./dunning";

const NOW = new Date("2026-07-04T12:00:00Z");

describe("shouldSendDunningNotice", () => {
  it("sends on the first failure (no prior notice)", () => {
    expect(shouldSendDunningNotice(null, NOW)).toBe(true);
  });

  it("throttles a retry the day after the first notice", () => {
    expect(shouldSendDunningNotice("2026-07-03T12:00:00Z", NOW)).toBe(false);
  });

  it("throttles right up to the threshold", () => {
    expect(shouldSendDunningNotice("2026-06-29T13:00:00Z", NOW)).toBe(false);
  });

  it("sends again once the throttle window has passed", () => {
    expect(shouldSendDunningNotice("2026-06-29T11:00:00Z", NOW)).toBe(true);
  });

  it("fails open on an unparseable timestamp", () => {
    expect(shouldSendDunningNotice("not-a-date", NOW)).toBe(true);
  });
});

describe("dunning messages", () => {
  it("payment-failed message names the user, links settings, fits in an SMS", () => {
    const msg = buildPaymentFailedMessage("Blair");
    expect(msg).toContain("Blair, your");
    expect(msg).toContain("https://www.entiremind.com/dashboard/settings");
    expect(msg).toContain("continue in the meantime");
    expect(msg.length).toBeLessThanOrEqual(320);
  });

  it("payment-failed message works without a name", () => {
    expect(buildPaymentFailedMessage(null).startsWith("Your ")).toBe(true);
  });

  it("subscription-ended message reassures and links the way back", () => {
    const msg = buildSubscriptionEndedMessage("Blair");
    expect(msg).toContain("saved");
    expect(msg).toContain("https://www.entiremind.com/dashboard/settings");
    expect(msg.length).toBeLessThanOrEqual(320);
  });
});
