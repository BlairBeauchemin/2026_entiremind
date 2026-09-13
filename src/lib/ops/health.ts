/**
 * Health evaluation — pure decision logic, no I/O.
 *
 * Kept free of Supabase and provider calls so the rules can be exercised
 * directly in health.test.ts, the same way src/lib/reconnect.ts and
 * src/lib/ai/prompts.ts keep their decisions separable from their plumbing.
 * The caller gathers facts; this file decides what they mean.
 */

export type Severity = "ok" | "warning" | "critical";

export interface HealthCheck {
  /** Stable identifier — also the throttle key in health_alerts. */
  id: string;
  severity: Severity;
  title: string;
  detail: string;
}

/** What we know about the daily send, gathered by the caller. */
export interface DailySendFacts {
  /** Newest successful daily-send run in cron_runs, or null if none recorded. */
  lastSuccessAt: Date | null;
  /** Counts from that run. Null when only the cold-start fallback is available. */
  lastSent: number | null;
  lastFailed: number | null;
  /**
   * Newest outbound prompt in `messages`. The cold-start fallback: cron_runs is
   * empty until this ships, but there is real send history to reason about, so
   * the check is correct on day one instead of crying wolf.
   */
  lastPromptAt: Date | null;
  /** Users the daily loop would consider right now (active, onboarded, phone). */
  eligibleRecipients: number;
}

export type TwilioFacts =
  | { ok: true; balance: number; currency: string }
  | { ok: false; error: string };

export type AnthropicFacts =
  | { ok: true }
  | {
      ok: false;
      kind: "auth" | "credit" | "rate_limit" | "unknown";
      error: string;
    };

export interface ProviderFacts {
  /** Null means the check was skipped (not configured), not that it failed. */
  twilio: TwilioFacts | null;
  anthropic: AnthropicFacts | null;
}

export interface HealthConfig {
  /** When the daily send is scheduled, in UTC (vercel.json: 45 14 * * *). */
  expectedSendUtcHour: number;
  expectedSendUtcMinute: number;
  /** How late a best-effort cron may be before we call it missed. */
  graceMinutes: number;
  /** Twilio balance below this warns; below half of it is critical. */
  twilioWarnUsd: number;
}

export const DEFAULT_HEALTH_CONFIG: HealthConfig = {
  expectedSendUtcHour: 14,
  expectedSendUtcMinute: 45,
  // Hobby crons have run as much as ~40 minutes late; 90 minutes is generous
  // enough to never cry wolf and still alert within the hour of a real miss.
  graceMinutes: 90,
  twilioWarnUsd: 10,
};

export interface HealthInput {
  now: Date;
  dailySend: DailySendFacts;
  providers: ProviderFacts;
  config?: HealthConfig;
}

function sameUtcDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

/**
 * The moment today's send stops being "not yet" and starts being "missed".
 *
 * Deliberately a calendar comparison rather than a rolling "last run > N hours
 * ago" threshold. With the send at ~15:05 UTC and a check at 16:30 UTC, a fully
 * missed day is only 25.4 hours old — a 26-hour threshold would wave it
 * through. Anchoring to today's UTC date has no such blind spot.
 */
export function expectedSendDeadline(now: Date, config: HealthConfig): Date {
  const scheduled = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    config.expectedSendUtcHour,
    config.expectedSendUtcMinute,
  );
  return new Date(scheduled + config.graceMinutes * 60_000);
}

function formatAge(from: Date, to: Date): string {
  const hours = (to.getTime() - from.getTime()) / 3_600_000;
  if (hours < 1) return `${Math.round(hours * 60)} minutes ago`;
  if (hours < 48) return `${hours.toFixed(1)} hours ago`;
  return `${Math.round(hours / 24)} days ago`;
}

function checkDailySend(
  now: Date,
  facts: DailySendFacts,
  config: HealthConfig,
): HealthCheck[] {
  const checks: HealthCheck[] = [];
  const deadline = expectedSendDeadline(now, config);
  const due = now.getTime() >= deadline.getTime();

  // cron_runs is authoritative; `messages` is the cold-start fallback.
  const lastActivity = facts.lastSuccessAt ?? facts.lastPromptAt;
  const ranToday = lastActivity != null && sameUtcDay(lastActivity, now);

  if (!due) {
    checks.push({
      id: "daily_send_window",
      severity: "ok",
      title: "Daily send not due yet",
      detail: `Today's send window closes at ${deadline.toISOString()}.${
        ranToday ? " Already sent today." : ""
      }`,
    });
  } else if (facts.eligibleRecipients === 0) {
    // Nobody to send to is a quiet day, not an outage.
    checks.push({
      id: "daily_send_window",
      severity: "ok",
      title: "No eligible recipients",
      detail:
        "No active, onboarded users with a phone number — nothing was expected to send.",
    });
  } else if (!ranToday) {
    checks.push({
      id: "daily_send_missing",
      severity: "critical",
      title: "Daily send did not run",
      detail: lastActivity
        ? `Today's window closed at ${deadline.toISOString()} with no successful run. Last send was ${formatAge(lastActivity, now)} (${lastActivity.toISOString()}). ${facts.eligibleRecipients} user(s) were due a message.`
        : `Today's window closed at ${deadline.toISOString()} with no successful run, and no previous send is on record. ${facts.eligibleRecipients} user(s) were due a message.`,
    });
  } else if (facts.lastSent === 0) {
    // The run happened and reported success but delivered nothing. This is the
    // failure mode a naive "did the cron fire?" check would miss entirely.
    checks.push({
      id: "daily_send_no_output",
      severity: "critical",
      title: "Daily send ran but sent nothing",
      detail: `The run completed with sent=0 while ${facts.eligibleRecipients} user(s) were eligible.`,
    });
  } else {
    checks.push({
      id: "daily_send_window",
      severity: "ok",
      title: "Daily send completed",
      detail: `Sent ${facts.lastSent ?? "?"} message(s) to ${facts.eligibleRecipients} eligible user(s).`,
    });
  }

  if (facts.lastFailed != null && facts.lastFailed > 0) {
    checks.push({
      id: "daily_send_failures",
      severity: "warning",
      title: "Daily send had per-user failures",
      detail: `${facts.lastFailed} send(s) failed in the most recent run. Check messages with status='failed'.`,
    });
  }

  return checks;
}

function checkTwilio(
  facts: TwilioFacts | null,
  config: HealthConfig,
): HealthCheck | null {
  if (!facts) return null;

  if (!facts.ok) {
    return {
      id: "twilio_unreachable",
      severity: "warning",
      title: "Could not read Twilio balance",
      detail: facts.error,
    };
  }

  const critical = config.twilioWarnUsd / 2;
  const amount = `${facts.balance.toFixed(2)} ${facts.currency}`;

  if (facts.balance < critical) {
    return {
      id: "twilio_balance_low",
      severity: "critical",
      title: "Twilio balance critically low",
      detail: `Balance is ${amount}, below the critical floor of ${critical.toFixed(2)}. Sends will start failing.`,
    };
  }
  if (facts.balance < config.twilioWarnUsd) {
    return {
      id: "twilio_balance_low",
      severity: "warning",
      title: "Twilio balance low",
      detail: `Balance is ${amount}, below the ${config.twilioWarnUsd.toFixed(2)} warning threshold. Top up soon.`,
    };
  }
  return {
    id: "twilio_balance",
    severity: "ok",
    title: "Twilio balance healthy",
    detail: `Balance is ${amount}.`,
  };
}

function checkAnthropic(facts: AnthropicFacts | null): HealthCheck | null {
  if (!facts) return null;

  if (facts.ok) {
    return {
      id: "anthropic",
      severity: "ok",
      title: "Anthropic API reachable",
      detail: "A minimal completion succeeded.",
    };
  }

  // A rate limit means the key and the credit are both fine — it is the one
  // failure here that says nothing about whether tomorrow's send will work.
  if (facts.kind === "rate_limit") {
    return {
      id: "anthropic_rate_limited",
      severity: "warning",
      title: "Anthropic rate limited",
      detail: `${facts.error} Key and credit are valid; the daily send falls back to pre-written copy if this persists.`,
    };
  }

  if (facts.kind === "unknown") {
    return {
      id: "anthropic_unavailable",
      severity: "warning",
      title: "Anthropic check inconclusive",
      detail: facts.error,
    };
  }

  return {
    id: "anthropic_unavailable",
    severity: "critical",
    title:
      facts.kind === "credit"
        ? "Anthropic credit exhausted"
        : "Anthropic API key rejected",
    detail: `${facts.error} Daily prompts will degrade to generic pre-written fallback copy.`,
  };
}

/** Worst severity across the checks — what the endpoint's status code keys off. */
export function overallSeverity(checks: HealthCheck[]): Severity {
  if (checks.some((c) => c.severity === "critical")) return "critical";
  if (checks.some((c) => c.severity === "warning")) return "warning";
  return "ok";
}

export function evaluateHealth(input: HealthInput): HealthCheck[] {
  const config = input.config ?? DEFAULT_HEALTH_CONFIG;
  const checks = checkDailySend(input.now, input.dailySend, config);

  const twilio = checkTwilio(input.providers.twilio, config);
  if (twilio) checks.push(twilio);

  const anthropic = checkAnthropic(input.providers.anthropic);
  if (anthropic) checks.push(anthropic);

  return checks;
}
