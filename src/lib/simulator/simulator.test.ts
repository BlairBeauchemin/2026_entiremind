import { describe, it, expect } from "vitest";
import { coercePersonaProposal } from "./persona";
import { dayTimestamps } from "./engine";

describe("coercePersonaProposal", () => {
  it("accepts a valid reply proposal", () => {
    const result = coercePersonaProposal({
      action: "reply",
      text: "feeling good today",
      delay_minutes: 30,
      reasoning: "message landed well",
    });
    expect(result).toEqual({
      action: "reply",
      text: "feeling good today",
      delayMinutes: 30,
      reasoning: "message landed well",
    });
  });

  it("accepts a silence proposal and nulls out text", () => {
    const result = coercePersonaProposal({
      action: "silence",
      text: "ignored",
      delay_minutes: 5,
      reasoning: "busy day",
    });
    expect(result?.action).toBe("silence");
    expect(result?.text).toBeNull();
  });

  it("rejects a reply with no text", () => {
    expect(
      coercePersonaProposal({ action: "reply", text: "", delay_minutes: 10 }),
    ).toBeNull();
    expect(
      coercePersonaProposal({ action: "reply", text: null }),
    ).toBeNull();
  });

  it("rejects unknown actions and non-objects", () => {
    expect(coercePersonaProposal({ action: "shout", text: "hi" })).toBeNull();
    expect(coercePersonaProposal(null)).toBeNull();
    expect(coercePersonaProposal("reply")).toBeNull();
  });

  it("clamps delay_minutes into [2, 600] and defaults when missing", () => {
    expect(
      coercePersonaProposal({ action: "reply", text: "hi", delay_minutes: 0 })
        ?.delayMinutes,
    ).toBe(2);
    expect(
      coercePersonaProposal({
        action: "reply",
        text: "hi",
        delay_minutes: 9999,
      })?.delayMinutes,
    ).toBe(600);
    expect(
      coercePersonaProposal({ action: "reply", text: "hi" })?.delayMinutes,
    ).toBe(47);
  });
});

describe("dayTimestamps", () => {
  it("puts day 1 at the send hour on the start date", () => {
    const { outboundAt, simDate } = dayTimestamps("2026-06-26", 1);
    expect(simDate).toBe("2026-06-26");
    expect(outboundAt.toISOString()).toBe("2026-06-26T15:45:00.000Z");
  });

  it("advances one calendar day per day number", () => {
    const { outboundAt, simDate } = dayTimestamps("2026-06-26", 7);
    expect(simDate).toBe("2026-07-02");
    expect(outboundAt.toISOString()).toBe("2026-07-02T15:45:00.000Z");
  });

  it("crosses month boundaries correctly", () => {
    const { simDate } = dayTimestamps("2026-06-29", 3);
    expect(simDate).toBe("2026-07-01");
  });
});
