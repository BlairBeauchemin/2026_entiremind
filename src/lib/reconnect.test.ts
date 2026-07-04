import { describe, it, expect } from "vitest";
import {
  decideSilenceRecovery,
  buildReconnectMessage,
  buildPauseMessage,
  type SilenceRecoveryConfig,
} from "./reconnect";

const CONFIG: SilenceRecoveryConfig = {
  reconnectAfterSilences: 5,
  pauseAfterSilences: 9,
};

describe("decideSilenceRecovery", () => {
  it("does nothing below the reconnect threshold", () => {
    expect(
      decideSilenceRecovery({
        consecutiveSilences: 4,
        config: CONFIG,
        reconnectSentSinceLastReply: false,
      }),
    ).toBe("none");
  });

  it("sends a reconnect at the threshold when none has gone out this stretch", () => {
    expect(
      decideSilenceRecovery({
        consecutiveSilences: 5,
        config: CONFIG,
        reconnectSentSinceLastReply: false,
      }),
    ).toBe("reconnect");
  });

  it("does not repeat the reconnect between the two thresholds", () => {
    expect(
      decideSilenceRecovery({
        consecutiveSilences: 7,
        config: CONFIG,
        reconnectSentSinceLastReply: true,
      }),
    ).toBe("none");
  });

  it("pauses at the pause threshold after an unanswered reconnect", () => {
    expect(
      decideSilenceRecovery({
        consecutiveSilences: 9,
        config: CONFIG,
        reconnectSentSinceLastReply: true,
      }),
    ).toBe("pause");
  });

  it("never pauses without a reconnect warning first, even past the pause threshold", () => {
    // E.g. thresholds were lowered after the streak accrued.
    expect(
      decideSilenceRecovery({
        consecutiveSilences: 12,
        config: CONFIG,
        reconnectSentSinceLastReply: false,
      }),
    ).toBe("reconnect");
  });

  it("a reply resets the arc: fresh streak after reconnect gets a new reconnect", () => {
    // reconnectSentSinceLastReply is false because the reconnect predates
    // the user's latest reply.
    expect(
      decideSilenceRecovery({
        consecutiveSilences: 5,
        config: CONFIG,
        reconnectSentSinceLastReply: false,
      }),
    ).toBe("reconnect");
  });
});

describe("recovery messages", () => {
  it("reconnect message greets by name, offers PAUSE, and fits in an SMS", () => {
    const msg = buildReconnectMessage("Blair");
    expect(msg).toContain("Blair");
    expect(msg).toContain("PAUSE");
    expect(msg.length).toBeLessThanOrEqual(320);
  });

  it("reconnect message works without a name", () => {
    const msg = buildReconnectMessage(null);
    expect(msg.startsWith("Hey — ")).toBe(true);
    expect(msg).toContain("PAUSE");
  });

  it("pause farewell offers RESUME and fits in an SMS", () => {
    const named = buildPauseMessage("Blair");
    expect(named).toContain("Blair, I'm");
    expect(named).toContain("RESUME");
    expect(named.length).toBeLessThanOrEqual(320);

    const anonymous = buildPauseMessage(null);
    expect(anonymous.startsWith("I'm")).toBe(true);
    expect(anonymous).toContain("RESUME");
  });
});
