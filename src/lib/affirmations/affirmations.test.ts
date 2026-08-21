import { describe, it, expect } from "vitest";
import {
  MAX_AFFIRMATION_LENGTH,
  moveInOrder,
  nextPosition,
  normalizeAffirmationText,
  resequence,
  validateAffirmationText,
} from "./index";

describe("normalizeAffirmationText", () => {
  it("trims and collapses runs of whitespace", () => {
    expect(normalizeAffirmationText("  I   am    steady  ")).toBe(
      "I am steady",
    );
  });

  it("flattens the line breaks phone keyboards and paste insert", () => {
    expect(normalizeAffirmationText("I am\nsteady\r\nand clear")).toBe(
      "I am steady and clear",
    );
    expect(normalizeAffirmationText("I am\tsteady")).toBe("I am steady");
  });

  it("strips control characters rather than rendering them", () => {
    expect(normalizeAffirmationText("I am\u0000 steady\u007F")).toBe(
      "I am steady",
    );
  });

  it("leaves ordinary punctuation and accents alone", () => {
    expect(normalizeAffirmationText("Je suis calme — déjà.")).toBe(
      "Je suis calme — déjà.",
    );
  });
});

describe("validateAffirmationText", () => {
  it("accepts and returns the normalized text", () => {
    const result = validateAffirmationText("  I am  already enough ");
    expect(result).toEqual({ ok: true, text: "I am already enough" });
  });

  it("rejects text that is empty once normalized", () => {
    expect(validateAffirmationText("").ok).toBe(false);
    expect(validateAffirmationText("   \n\t  ").ok).toBe(false);
  });

  it("rejects text over the length ceiling but accepts text exactly at it", () => {
    expect(validateAffirmationText("a".repeat(MAX_AFFIRMATION_LENGTH))).toEqual(
      {
        ok: true,
        text: "a".repeat(MAX_AFFIRMATION_LENGTH),
      },
    );
    expect(
      validateAffirmationText("a".repeat(MAX_AFFIRMATION_LENGTH + 1)).ok,
    ).toBe(false);
  });

  it("measures length after normalizing, so padding alone cannot fail it", () => {
    const padded = `   ${"a".repeat(MAX_AFFIRMATION_LENGTH)}   `;
    expect(validateAffirmationText(padded).ok).toBe(true);
  });

  it("does not throw on a non-string sneaking through an untyped boundary", () => {
    expect(validateAffirmationText(null as unknown as string).ok).toBe(false);
  });
});

describe("nextPosition", () => {
  it("starts an empty set at 0", () => {
    expect(nextPosition([])).toBe(0);
  });

  it("appends after the highest existing position, gaps and all", () => {
    expect(nextPosition([{ position: 0 }, { position: 1 }])).toBe(2);
    expect(nextPosition([{ position: 0 }, { position: 7 }])).toBe(8);
  });

  it("is not confused by unsorted input", () => {
    expect(nextPosition([{ position: 5 }, { position: 2 }])).toBe(6);
  });
});

describe("resequence", () => {
  it("produces contiguous positions 0..n-1 in the given order", () => {
    expect(resequence(["c", "a", "b"])).toEqual([
      { id: "c", position: 0 },
      { id: "a", position: 1 },
      { id: "b", position: 2 },
    ]);
  });

  it("repairs a drifted set — duplicates and gaps both come out contiguous", () => {
    const positions = resequence(["a", "b", "c", "d"]).map((r) => r.position);
    expect(positions).toEqual([0, 1, 2, 3]);
  });

  it("handles an empty list", () => {
    expect(resequence([])).toEqual([]);
  });
});

describe("moveInOrder", () => {
  const items = [{ id: "a" }, { id: "b" }, { id: "c" }];

  it("moves an item up one step", () => {
    expect(moveInOrder(items, "b", "up")).toEqual(["b", "a", "c"]);
  });

  it("moves an item down one step", () => {
    expect(moveInOrder(items, "b", "down")).toEqual(["a", "c", "b"]);
  });

  it("is a no-op at the ends rather than wrapping around", () => {
    expect(moveInOrder(items, "a", "up")).toEqual(["a", "b", "c"]);
    expect(moveInOrder(items, "c", "down")).toEqual(["a", "b", "c"]);
  });

  it("is a no-op for an unknown id", () => {
    expect(moveInOrder(items, "zzz", "up")).toEqual(["a", "b", "c"]);
  });

  it("does not mutate the input", () => {
    const original = [{ id: "a" }, { id: "b" }];
    moveInOrder(original, "b", "up");
    expect(original.map((i) => i.id)).toEqual(["a", "b"]);
  });
});
