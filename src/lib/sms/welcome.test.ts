import { describe, it, expect } from "vitest";
import { buildWelcomeMessage } from "./welcome";

const COMPLIANCE = [
  "Up to 2 msgs/day",
  "Msg & data rates may apply",
  "HELP",
  "STOP",
];

describe("buildWelcomeMessage", () => {
  it("greets the user by name", () => {
    expect(buildWelcomeMessage("Maya")).toContain("Maya");
  });

  it("falls back to 'friend' when no name is given", () => {
    expect(buildWelcomeMessage("")).toContain("friend");
  });

  it("always includes the carrier-compliance language", () => {
    const msg = buildWelcomeMessage("Maya");
    for (const token of COMPLIANCE) expect(msg).toContain(token);
  });

  it("uses the default enrollment line when no archetype line is supplied", () => {
    expect(buildWelcomeMessage("Maya")).toContain("daily reflection prompts");
  });

  it("weaves in the archetype line and keeps compliance intact", () => {
    const line = "Visionary energy. We see it. Your first prompt lands tomorrow morning.";
    const msg = buildWelcomeMessage("Maya", line);
    expect(msg).toContain(line);
    for (const token of COMPLIANCE) expect(msg).toContain(token);
  });
});
