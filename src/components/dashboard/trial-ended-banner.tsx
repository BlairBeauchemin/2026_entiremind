import Link from "next/link";
import { Sparkles } from "lucide-react";

/**
 * Shown on the dashboard once a user's free trial has ended without an
 * upgrade. Mirrors the tone of the trial-end SMS: warm, no urgency theater.
 * Not dismissible — this is the state of the account, not a nudge.
 */
export function TrialEndedBanner() {
  return (
    <div className="relative flex items-center gap-4 rounded-sm border border-rule bg-cobalt-wash p-5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cobalt-wash">
        <Sparkles className="h-5 w-5 text-cobalt" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="font-serif text-lg text-ink">
          Your ten days together are up
        </p>
        <p className="text-sm text-muted">
          Everything you&apos;ve shared is saved. Continue the daily practice
          whenever you&apos;re ready.
        </p>
      </div>

      <Link
        href="/dashboard/settings"
        className="shrink-0 rounded-sm bg-cobalt px-4 py-2.5 text-sm font-medium text-linen transition-colors hover:bg-cobalt-deep"
      >
        Continue
      </Link>
    </div>
  );
}
