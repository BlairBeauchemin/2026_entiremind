/**
 * Onboarding drop-off funnel for the founder dashboard.
 *
 * Renders the 15-screen flow in order with the distinct-user count that reached
 * each step and its share of starts, so the founder can see where people leave.
 * Presentational only — the server passes raw per-step counts.
 */

interface FunnelStep {
  step: string;
  label: string;
}

// Canonical flow order, mirrors STEPS in onboarding-flow.tsx.
const FUNNEL_STEPS: FunnelStep[] = [
  { step: "welcome", label: "Welcome" },
  { step: "name", label: "Name" },
  { step: "phone", label: "Phone" },
  { step: "category", label: "Dream category" },
  { step: "intention", label: "Intention" },
  { step: "vision", label: "Vision" },
  { step: "orientation", label: "Motivation" },
  { step: "style", label: "Change style" },
  { step: "past_pattern", label: "Past pattern" },
  { step: "first_doubt", label: "First doubt" },
  { step: "inner_voice", label: "Inner voice" },
  { step: "values", label: "Values" },
  { step: "tone", label: "Tone" },
  { step: "aligned", label: "Aligned state" },
  { step: "reveal", label: "Reveal" },
];

interface Props {
  /** Distinct users who reached each step, keyed by step id. */
  counts: Record<string, number>;
}

export function FounderOnboardingFunnel({ counts }: Props) {
  const total = Object.values(counts).reduce((sum, n) => sum + (n || 0), 0);

  if (total === 0) {
    return (
      <div className="text-sm text-muted-foreground italic">
        No onboarding activity yet (last 30 days).
      </div>
    );
  }

  // Share of starts is relative to the first step; fall back to the max count
  // if no one is recorded at "welcome" (e.g. backfill-only traffic).
  const startCount =
    counts[FUNNEL_STEPS[0].step] || Math.max(...Object.values(counts), 1);

  return (
    <ul className="space-y-1.5">
      {FUNNEL_STEPS.map(({ step, label }) => {
        const count = counts[step] ?? 0;
        const pct = Math.round((count / startCount) * 100);
        return (
          <li
            key={step}
            className="flex items-center gap-3 bg-white/60 border border-white/60 rounded-xl px-4 py-2.5"
          >
            <div className="w-28 shrink-0 text-sm text-navy">{label}</div>
            <div className="flex-1 h-3 rounded-full bg-white/70 overflow-hidden">
              <div
                className="h-full rounded-full bg-em-purple-300/70"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <div className="w-10 shrink-0 text-right text-sm text-navy tabular-nums">
              {count}
            </div>
            <div className="w-12 shrink-0 text-right text-xs text-teal-900/50 tabular-nums">
              {pct}%
            </div>
          </li>
        );
      })}
    </ul>
  );
}
