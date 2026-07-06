import { describe, it, expect } from "vitest";
import { currentWeekStart } from "./index";

describe("currentWeekStart", () => {
  it("returns the same Monday for every day of that week", () => {
    // 2026-07-06 is a Monday
    expect(currentWeekStart(new Date("2026-07-06T10:00:00Z"))).toBe(
      "2026-07-06",
    );
    expect(currentWeekStart(new Date("2026-07-08T10:00:00Z"))).toBe(
      "2026-07-06",
    );
    expect(currentWeekStart(new Date("2026-07-12T23:59:59Z"))).toBe(
      "2026-07-06",
    );
  });

  it("rolls Sunday back to the previous Monday", () => {
    expect(currentWeekStart(new Date("2026-07-05T00:00:00Z"))).toBe(
      "2026-06-29",
    );
  });

  it("moves to the next Monday when the week turns", () => {
    expect(currentWeekStart(new Date("2026-07-13T00:00:00Z"))).toBe(
      "2026-07-13",
    );
  });
});
