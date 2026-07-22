import { describe, it, expect } from "vitest";
import { decideMessageMode, getModeInstruction } from "./prompts";
import type { MessageMode } from "./types";

const BASE = {
  enabled: true,
  techniqueActive: false,
  eligible: [] as MessageMode[],
  sentThisWeek: {} as Partial<Record<MessageMode, number>>,
  mirrorTarget: 2,
  callbackTarget: 1,
};

describe("decideMessageMode", () => {
  it("returns question when the feature is disabled (invariant)", () => {
    const d = decideMessageMode({
      ...BASE,
      enabled: false,
      eligible: ["mirror", "callback", "attunement"],
      random: () => 0,
    });
    expect(d.mode).toBe("question");
    expect(d.enabled).toBe(false);
  });

  it("returns question when a technique is active (no double-transform)", () => {
    const d = decideMessageMode({
      ...BASE,
      techniqueActive: true,
      eligible: ["mirror"],
      random: () => 0,
    });
    expect(d.mode).toBe("question");
    expect(d.techniqueActive).toBe(true);
  });

  it("returns question when no feeling-seen mode is eligible", () => {
    const d = decideMessageMode({ ...BASE, eligible: [], random: () => 0 });
    expect(d.mode).toBe("question");
  });

  it("forces mirror by cadence when under target", () => {
    const d = decideMessageMode({
      ...BASE,
      eligible: ["mirror"],
      sentThisWeek: { mirror: 0 },
      random: () => 0, // 0 < needed/7 → fires
    });
    expect(d.mode).toBe("mirror");
    expect(d.forcedByCadence).toBe(true);
  });

  it("prioritizes callback over mirror when both are under target", () => {
    const d = decideMessageMode({
      ...BASE,
      eligible: ["mirror", "callback"],
      sentThisWeek: {},
      random: () => 0,
    });
    expect(d.mode).toBe("callback");
    expect(d.forcedByCadence).toBe(true);
  });

  it("does not force a mode whose weekly target is already met", () => {
    const d = decideMessageMode({
      ...BASE,
      eligible: ["mirror"],
      sentThisWeek: { mirror: 2 }, // target met
      random: () => 0,
    });
    expect(d.mode).toBe("question");
    expect(d.forcedByCadence).toBe(false);
  });

  it("offers attunement as an occasional softener", () => {
    const attune = decideMessageMode({
      ...BASE,
      eligible: ["attunement"],
      random: () => 0.1, // < 0.15
    });
    expect(attune.mode).toBe("attunement");

    const question = decideMessageMode({
      ...BASE,
      eligible: ["attunement"],
      random: () => 0.9, // ≥ 0.15
    });
    expect(question.mode).toBe("question");
  });
});

describe("getModeInstruction", () => {
  it("question mode keeps the gentle-question mandate", () => {
    const instr = getModeInstruction("question", "reflection");
    expect(instr.toLowerCase()).toContain("question");
  });

  it("declarative modes explicitly forbid a question", () => {
    for (const mode of ["mirror", "callback", "attunement"] as MessageMode[]) {
      const instr = getModeInstruction(mode, "reflection");
      expect(instr).toContain("Do NOT ask a question");
    }
  });

  it("mirror mode asks for a specific reflect-back", () => {
    const instr = getModeInstruction("mirror", "check-in");
    expect(instr.toLowerCase()).toContain("reflect back");
  });
});
