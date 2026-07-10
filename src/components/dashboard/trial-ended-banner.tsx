import Link from "next/link";
import { Sparkles } from "lucide-react";

/**
 * Shown on the dashboard once a user's free trial has ended without an
 * upgrade. Mirrors the tone of the trial-end SMS: warm, no urgency theater.
 * Not dismissible — this is the state of the account, not a nudge.
 */
export function TrialEndedBanner() {
  return (
    <div className="relative flex items-center gap-4 rounded-2xl border border-em-yellow-400/40 bg-em-yellow-400/10 p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-em-yellow-400/20">
        <Sparkles className="h-5 w-5 text-em-purple-400" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-serif text-lg text-navy">
          Your ten days together are up
        </p>
        <p className="text-sm text-teal-900/60">
          Everything you&apos;ve shared is saved. Continue the daily practice
          whenever you&apos;re ready.
        </p>
      </div>

      <Link
        href="/dashboard/settings"
        className="shrink-0 rounded-xl bg-navy px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-navy/90"
      >
        Continue
      </Link>
    </div>
  );
}
