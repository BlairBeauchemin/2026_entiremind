import { describe, it, expect, afterEach } from "vitest";
import {
  coerceEnrichment,
  buildEnrichInput,
  buildFallbackEnrichment,
  deriveSubstantive,
  resolveEnrichModel,
} from "./enrich";

describe("buildEnrichInput", () => {
  it("returns the reply text unchanged when there are no known patterns", () => {
    expect(buildEnrichInput("today was hard", [])).toBe("today was hard");
  });

  it("prepends the user's known pattern codes and hints, then the reply", () => {
    const input = buildEnrichInput("this whole month is ruined", [
      "all_or_nothing",
      "catastrophizing",
    ]);
    expect(input).toContain("all_or_nothing");
    expect(input).toContain("catastrophizing");
    expect(input.toLowerCase()).toContain("all-or-nothing");
    expect(input).toContain("distortion_flags");
    expect(input).toContain("this whole month is ruined");
  });
});

describe("coerceEnrichment distortion_flags", () => {
  function raw(overrides: Record<string, unknown> = {}) {
    return {
      sentiment: "struggling",
      emotional_state: "defeated",
      themes: ["consistency"],
      category: "health",
      modality: "venting",
      mentions: [],
      open_thread: false,
      substantive: true,
      acknowledgement: "one missed morning is one missed morning",
      ...overrides,
    };
  }

  it("keeps only valid distortion codes", () => {
    const result = coerceEnrichment(
      raw({ distortion_flags: ["all_or_nothing", "not_a_code", 7] }),
    );
    expect(result?.distortion_flags).toEqual(["all_or_nothing"]);
  });

  it("defaults to an empty array when the field is missing", () => {
    expect(coerceEnrichment(raw())?.distortion_flags).toEqual([]);
  });

  it("defaults to an empty array when the field is not an array", () => {
    expect(
      coerceEnrichment(raw({ distortion_flags: "all_or_nothing" }))
        ?.distortion_flags,
    ).toEqual([]);
  });

  it("still parses the rest of the enrichment", () => {
    const result = coerceEnrichment(
      raw({ distortion_flags: ["catastrophizing"] }),
    );
    expect(result?.sentiment).toBe("struggling");
    expect(result?.substantive).toBe(true);
    expect(result?.distortion_flags).toEqual(["catastrophizing"]);
  });

  it("marks a real coerced payload as enriched", () => {
    expect(coerceEnrichment(raw())?.enriched).toBe(true);
  });
});

describe("coerceEnrichment directive", () => {
  function raw(overrides: Record<string, unknown> = {}) {
    return {
      sentiment: "neutral",
      emotional_state: "hopeful",
      themes: ["focus"],
      category: "identity",
      modality: "reflective",
      mentions: [],
      open_thread: false,
      substantive: true,
      acknowledgement: null,
      ...overrides,
    };
  }

  it("defaults to null when the field is absent", () => {
    expect(coerceEnrichment(raw())?.directive).toBeNull();
  });

  it("keeps a non-empty string directive, trimmed", () => {
    expect(
      coerceEnrichment(raw({ directive: "  manifestation " }))?.directive,
    ).toBe("manifestation");
  });

  it("treats a blank directive as null", () => {
    expect(coerceEnrichment(raw({ directive: "   " }))?.directive).toBeNull();
  });

  it("ignores a non-string directive", () => {
    expect(coerceEnrichment(raw({ directive: 42 }))?.directive).toBeNull();
  });
});

describe("buildFallbackEnrichment", () => {
  it("is marked not-enriched and carries no directive or ack", () => {
    const fb = buildFallbackEnrichment("something");
    expect(fb.enriched).toBe(false);
    expect(fb.directive).toBeNull();
    expect(fb.acknowledgement).toBeNull();
  });

  it("derives substantive from length (>=30 chars)", () => {
    expect(buildFallbackEnrichment("yes").substantive).toBe(false);
    expect(
      buildFallbackEnrichment(
        "this is a much longer and clearly substantive reply",
      ).substantive,
    ).toBe(true);
  });
});

describe("deriveSubstantive", () => {
  it("prefers the model's explicit flag", () => {
    expect(deriveSubstantive({ substantive: true }, "yes")).toBe(true);
    expect(
      deriveSubstantive(
        { substantive: false },
        "a fairly long reply that would otherwise pass the length test",
      ),
    ).toBe(false);
  });

  it("falls back to length when insights is null", () => {
    expect(deriveSubstantive(null, "yes")).toBe(false);
    expect(
      deriveSubstantive(null, "this reply is clearly long enough to count"),
    ).toBe(true);
  });

  it("falls back to length when the flag is missing", () => {
    expect(
      deriveSubstantive(
        {},
        "this reply is clearly long enough to count as substantive",
      ),
    ).toBe(true);
  });
});

describe("resolveEnrichModel", () => {
  const original = { ...process.env };
  afterEach(() => {
    process.env = { ...original };
  });

  it("defaults to Haiku and never inherits ANTHROPIC_MODEL", () => {
    delete process.env.ANTHROPIC_ENRICH_MODEL;
    process.env.ANTHROPIC_MODEL = "claude-sonnet-5";
    expect(resolveEnrichModel()).toBe("claude-haiku-4-5-20251001");
  });

  it("uses ANTHROPIC_ENRICH_MODEL when set", () => {
    process.env.ANTHROPIC_ENRICH_MODEL = "claude-sonnet-5";
    expect(resolveEnrichModel()).toBe("claude-sonnet-5");
  });
});
