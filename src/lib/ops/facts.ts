/**
 * Fact gathering for the health check — all the I/O the pure evaluator avoids.
 */

import { createServiceRoleClient } from "@/lib/supabase";
import type { DailySendFacts, HealthConfig } from "./health";
import { DEFAULT_HEALTH_CONFIG } from "./health";
import { DAILY_SEND_JOB } from "./run-log";

/**
 * Content types that are not the morning prompt. Mirrors the exclusion list
 * daily-send itself uses for its "already sent today" guard — acks are
 * reactive, and billing/upgrade/intention_nudge are out-of-band notices. If a
 * user got only one of those, they did not get their daily message.
 */
const NON_PROMPT_CONTENT_TYPES = [
  "ack",
  "billing",
  "upgrade",
  "intention_nudge",
];

export async function loadDailySendFacts(): Promise<DailySendFacts> {
  const supabase = createServiceRoleClient();

  const [runResult, promptResult, usersResult] = await Promise.all([
    supabase
      .from("cron_runs")
      .select("started_at, sent, failed")
      .eq("job_name", DAILY_SEND_JOB)
      .eq("status", "success")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Cold-start fallback: cron_runs is empty until this ships, but there is
    // real send history to reason about.
    supabase
      .from("messages")
      .select("created_at")
      .eq("direction", "outbound")
      .or(
        `content_type.not.in.(${NON_PROMPT_CONTENT_TYPES.join(",")}),content_type.is.null`,
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Exactly the population daily-send iterates.
    supabase
      .from("users")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .eq("onboarding_completed", true)
      .eq("is_test", false)
      .not("phone", "is", null),
  ]);

  if (runResult.error) {
    console.error("Failed to read cron_runs:", runResult.error);
  }
  if (usersResult.error) {
    console.error("Failed to count eligible users:", usersResult.error);
  }

  const run = runResult.data;

  return {
    lastSuccessAt: run?.started_at ? new Date(run.started_at) : null,
    lastSent: run?.sent ?? null,
    lastFailed: run?.failed ?? null,
    lastPromptAt: promptResult.data?.created_at
      ? new Date(promptResult.data.created_at)
      : null,
    eligibleRecipients: usersResult.count ?? 0,
  };
}

/** Health thresholds, env-tunable without a deploy of new code. */
export function loadHealthConfig(): HealthConfig {
  const warn = Number.parseFloat(process.env.TWILIO_BALANCE_WARN_USD ?? "");
  return {
    ...DEFAULT_HEALTH_CONFIG,
    twilioWarnUsd: Number.isFinite(warn)
      ? warn
      : DEFAULT_HEALTH_CONFIG.twilioWarnUsd,
  };
}
