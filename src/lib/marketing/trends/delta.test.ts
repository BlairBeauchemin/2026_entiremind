import { describe, it, expect } from "vitest";
import { computeSnapshotDelta } from "./delta";

describe("computeSnapshotDelta", () => {
  it("marks everything new when there is no previous snapshot", () => {
    const delta = computeSnapshotDelta(
      null,
      [{ trend: "Lucky girl syndrome" }, { trend: "5-9 before 9-5" }],
      "First snapshot — no prior data.",
    );
    expect(delta.new_trends).toEqual(["Lucky girl syndrome", "5-9 before 9-5"]);
    expect(delta.continued_trends).toEqual([]);
    expect(delta.dropped_trends).toEqual([]);
    expect(delta.summary).toBe("First snapshot — no prior data.");
  });

  it("splits new, continued, and dropped trends", () => {
    const delta = computeSnapshotDelta(
      [{ trend: "Vision boards" }, { trend: "Morning pages" }],
      [{ trend: "Morning pages" }, { trend: "Voice journaling" }],
      "Voice journaling is emerging.",
    );
    expect(delta.new_trends).toEqual(["Voice journaling"]);
    expect(delta.continued_trends).toEqual(["Morning pages"]);
    expect(delta.dropped_trends).toEqual(["Vision boards"]);
  });

  it("matches trend names case-insensitively with trimming", () => {
    const delta = computeSnapshotDelta(
      [{ trend: "  Lucky Girl Syndrome " }],
      [{ trend: "lucky girl syndrome" }],
      "Steady.",
    );
    expect(delta.continued_trends).toEqual(["lucky girl syndrome"]);
    expect(delta.new_trends).toEqual([]);
    expect(delta.dropped_trends).toEqual([]);
  });

  it("treats an empty previous insights array like a first snapshot", () => {
    const delta = computeSnapshotDelta([], [{ trend: "A" }], "s");
    expect(delta.new_trends).toEqual(["A"]);
    expect(delta.dropped_trends).toEqual([]);
  });
});
