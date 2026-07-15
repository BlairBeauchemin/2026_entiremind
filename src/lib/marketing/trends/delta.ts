/**
 * Deterministic snapshot-to-snapshot trend diffing. The AI supplies a
 * qualitative delta_summary and per-insight momentum; this pure function
 * supplies the structural new/continued/dropped lists so the UI never has
 * to trust the model to diff correctly.
 */

export interface SnapshotDelta {
  summary: string;
  new_trends: string[];
  continued_trends: string[];
  dropped_trends: string[];
}

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

export function computeSnapshotDelta(
  previous: Array<{ trend: string }> | null,
  current: Array<{ trend: string }>,
  deltaSummary: string,
): SnapshotDelta {
  const currentNames = current.map((i) => i.trend);

  if (!previous || previous.length === 0) {
    return {
      summary: deltaSummary,
      new_trends: currentNames,
      continued_trends: [],
      dropped_trends: [],
    };
  }

  const prevSet = new Set(previous.map((i) => normalize(i.trend)));
  const currSet = new Set(currentNames.map(normalize));

  return {
    summary: deltaSummary,
    new_trends: currentNames.filter((n) => !prevSet.has(normalize(n))),
    continued_trends: currentNames.filter((n) => prevSet.has(normalize(n))),
    dropped_trends: previous
      .map((i) => i.trend)
      .filter((n) => !currSet.has(normalize(n))),
  };
}
