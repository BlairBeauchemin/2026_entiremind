import { describe, it, expect } from "vitest";
import {
  formatQuoteSms,
  mapCategoryToQuoteThemes,
  pickDeterministicQuote,
} from "./index";
import type { Quote } from "./types";

const quote = (overrides: Partial<Quote> = {}): Quote => ({
  id: "q1",
  text: "What you seek is seeking you.",
  author: "Rumi",
  theme: "trusting-the-process",
  ...overrides,
});

describe("formatQuoteSms", () => {
  it("formats as quoted text with attribution", () => {
    expect(formatQuoteSms(quote())).toBe(
      '"What you seek is seeking you." — Rumi',
    );
  });

  it("stays within 160 characters for oversized quotes", () => {
    const long = quote({ text: "a".repeat(200) });
    const formatted = formatQuoteSms(long);
    expect(formatted.length).toBeLessThanOrEqual(160);
    expect(formatted).toContain("— Rumi");
    expect(formatted).toContain("...");
  });
});

describe("mapCategoryToQuoteThemes", () => {
  it("maps known categories to themes", () => {
    expect(mapCategoryToQuoteThemes("money")).toEqual(["abundance"]);
    expect(mapCategoryToQuoteThemes("relationships")).toEqual(["love"]);
    expect(mapCategoryToQuoteThemes("family")).toEqual(["love"]);
    expect(mapCategoryToQuoteThemes("spiritual")).toEqual([
      "trusting-the-process",
      "presence",
    ]);
  });

  it("returns no preference for null or unknown categories", () => {
    expect(mapCategoryToQuoteThemes(null)).toEqual([]);
    expect(mapCategoryToQuoteThemes(undefined)).toEqual([]);
    expect(mapCategoryToQuoteThemes("other")).toEqual([]);
  });
});

describe("pickDeterministicQuote", () => {
  const library: Quote[] = [
    quote({ id: "q1", theme: "abundance" }),
    quote({ id: "q2", theme: "love" }),
    quote({ id: "q3", theme: "love" }),
    quote({ id: "q4", theme: "presence" }),
  ];

  it("returns the same quote for the same seed", () => {
    const a = pickDeterministicQuote(library, "user1-2026-07-06", []);
    const b = pickDeterministicQuote(library, "user1-2026-07-06", []);
    expect(a).toEqual(b);
  });

  it("rotates across seeds", () => {
    const picks = new Set(
      Array.from(
        { length: 30 },
        (_, i) => pickDeterministicQuote(library, `user1-day-${i}`, [])?.id,
      ),
    );
    expect(picks.size).toBeGreaterThan(1);
  });

  it("respects preferred themes when available", () => {
    const pick = pickDeterministicQuote(library, "seed", ["love"]);
    expect(pick?.theme).toBe("love");
  });

  it("widens to the full library when preferred themes have no quotes", () => {
    const pick = pickDeterministicQuote(library, "seed", ["gratitude"]);
    expect(pick).not.toBeNull();
  });

  it("returns null for an empty library", () => {
    expect(pickDeterministicQuote([], "seed", [])).toBeNull();
  });
});
