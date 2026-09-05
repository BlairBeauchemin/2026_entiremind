import { describe, it, expect } from "vitest";
import {
  buildIntentionShiftNudge,
  trimFocus,
  INTENTION_EDIT_PATH,
} from "./shift-nudge";

describe("trimFocus", () => {
  it("strips first-person framing so the phrase reads mid-sentence", () => {
    expect(trimFocus("I want to build a sustainable creative practice")).toBe(
      "build a sustainable creative practice",
    );
    expect(trimFocus("I'm rebuilding my confidence")).toBe(
      "rebuilding my confidence",
    );
    expect(trimFocus("To leave the job")).toBe("leave the job");
  });

  it("strips trailing punctuation and whitespace", () => {
    expect(trimFocus("  finishing the album.  ")).toBe("finishing the album");
    expect(trimFocus("finding steadier work!")).toBe("finding steadier work");
  });

  it("leaves an already-clean phrase alone", () => {
    expect(trimFocus("the move to Lisbon")).toBe("the move to Lisbon");
  });
});

describe("buildIntentionShiftNudge", () => {
  const PROPOSED = "I want to build a sustainable creative practice";

  it("points the user at the page where they change it themselves", () => {
    expect(buildIntentionShiftNudge(PROPOSED)).toContain(INTENTION_EDIT_PATH);
  });

  it("uses the name when we have one, and works without", () => {
    expect(buildIntentionShiftNudge(PROPOSED, "Alex")).toMatch(/^Alex, /);
    expect(buildIntentionShiftNudge(PROPOSED, null)).toMatch(/^I've noticed/);
  });

  it("names what they keep returning to", () => {
    expect(buildIntentionShiftNudge(PROPOSED)).toContain(
      "build a sustainable creative practice",
    );
  });

  // The whole point of this message. If it ever starts claiming we changed
  // something, the product has silently taken authorship of the user's goal.
  it("never claims we changed anything", () => {
    const text = buildIntentionShiftNudge(PROPOSED, "Alex").toLowerCase();
    for (const claim of [
      "i've updated",
      "i updated",
      "we've updated",
      "we updated",
      "your new intention",
      "changed your intention",
      "i've changed",
      "set your intention to",
    ]) {
      expect(text).not.toContain(claim);
    }
  });

  it("says the intention is unchanged and makes the change optional", () => {
    const text = buildIntentionShiftNudge(PROPOSED);
    expect(text).toContain("still what you set");
    expect(text).toContain("if you'd like");
  });

  it("does not tell the user what their intention should be", () => {
    const text = buildIntentionShiftNudge(PROPOSED, "Alex").toLowerCase();
    expect(text).not.toContain("you should");
    expect(text).not.toContain("you need to");
  });
});
