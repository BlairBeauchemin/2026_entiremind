import { describe, it, expect } from "vitest";
import {
  decideUpgradeNudge,
  buildTrialEndMessage,
  buildUpgradeFollowupMessage,
} from "./upgrade";

const NOW = new Date("2026-07-14T12:00:00Z");

describe("decideUpgradeNudge", () => {
  it("sends the trial-end message when nothing has been sent", () => {
    expect(decideUpgradeNudge({ upgradeSentAts: [], now: NOW })).toBe(
      "send-first",
    );
  });

  it("stays quiet in the week after the first message", () => {
    expect(
      decideUpgradeNudge({
        upgradeSentAts: ["2026-07-10T12:00:00Z"],
        now: NOW,
      }),
    ).toBe("none");
  });

  it("sends the follow-up once a week has passed", () => {
    expect(
      decideUpgradeNudge({
        upgradeSentAts: ["2026-07-07T11:00:00Z"],
        now: NOW,
      }),
    ).toBe("send-followup");
  });

  it("goes permanently quiet after two messages", () => {
    expect(
      decideUpgradeNudge({
        upgradeSentAts: ["2026-06-20T12:00:00Z", "2026-06-13T12:00:00Z"],
        now: NOW,
      }),
    ).toBe("none");
  });
});

describe("upgrade messages", () => {
  it("trial-end message personalizes from a memory theme", () => {
    const msg = buildTrialEndMessage("Blair", "self-worth at work");
    expect(msg).toContain("Blair, our first days");
    expect(msg).toContain("self-worth at work");
    expect(msg).toContain("https://www.entiremind.com/dashboard/settings");
    expect(msg.length).toBeLessThanOrEqual(400);
  });

  it("trial-end message degrades gracefully without name or memory", () => {
    const msg = buildTrialEndMessage(null, null);
    expect(msg.startsWith("Our first days")).toBe(true);
    expect(msg).not.toContain("undefined");
    expect(msg).toContain("https://www.entiremind.com/dashboard/settings");
  });

  it("follow-up leaves the door open without pressure", () => {
    const msg = buildUpgradeFollowupMessage("Blair");
    expect(msg).toContain("Blair — no pressure");
    expect(msg).toContain("https://www.entiremind.com/dashboard/settings");
    expect(msg.length).toBeLessThanOrEqual(320);
  });
});
