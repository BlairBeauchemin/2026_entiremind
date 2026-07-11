import { describe, it, expect } from "vitest";
import { ARCHETYPES } from "../types";
import { QUIZ_SHARE, archetypeShareUrl, archetypeDisplayName } from "../share";
import { DISTORTION_CONTENT } from "../content";

describe("QUIZ_SHARE", () => {
  it("has an entry with non-empty copy for every archetype", () => {
    for (const archetype of ARCHETYPES) {
      const entry = QUIZ_SHARE[archetype];
      expect(entry, `missing entry for ${archetype}`).toBeDefined();
      expect(entry.hookLine.length).toBeGreaterThan(20);
      expect(entry.shareText.length).toBeGreaterThan(20);
    }
  });

  it("share text names the archetype so shares read naturally", () => {
    for (const archetype of ARCHETYPES) {
      expect(QUIZ_SHARE[archetype].shareText).toContain(
        archetypeDisplayName(archetype),
      );
    }
  });

  it("never leaks inner-critic content into public copy", () => {
    const privateNames = Object.values(DISTORTION_CONTENT).map((d) => d.name);
    for (const archetype of ARCHETYPES) {
      const publicCopy =
        QUIZ_SHARE[archetype].hookLine + QUIZ_SHARE[archetype].shareText;
      for (const name of privateNames) {
        expect(publicCopy).not.toContain(name);
      }
    }
  });

  it("share URLs point at the public archetype pages", () => {
    for (const archetype of ARCHETYPES) {
      expect(archetypeShareUrl(archetype)).toBe(
        `https://www.entiremind.com/archetype/${archetype}`,
      );
    }
  });
});
