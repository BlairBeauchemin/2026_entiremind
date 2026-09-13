import { NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron-auth";
import { evaluateHealth, overallSeverity } from "@/lib/ops/health";
import { loadDailySendFacts, loadHealthConfig } from "@/lib/ops/facts";
import { checkTwilioBalance, checkAnthropic } from "@/lib/ops/providers";
import { reconcileAlerts } from "@/lib/ops/notify";

/**
 * Health endpoint — the watchdog's target.
 *
 * Answers two questions in one call:
 *   1. Did today's daily send actually happen? (reactive)
 *   2. Is anything about to stop it from happening? (proactive — provider
 *      balances and key liveness)
 *
 * Guarded by CRON_SECRET via the shared requireCronAuth, so it reuses an
 * existing secret and is not a public status page.
 *
 * Returns 503 when any check is critical. That status code is the contract with
 * .github/workflows/health-check.yml: `curl -f` fails the job, and GitHub emails
 * on a failed workflow. That backstop is deliberate — it survives this route
 * being unreachable, which an in-app alert cannot.
 *
 * Deliberately NOT scheduled in vercel.json. A watchdog running on Vercel Cron
 * could not have detected the 2026-09-12 outage, because Vercel Cron was the
 * thing that failed.
 */
export async function GET(request: Request) {
  const authError = requireCronAuth(request);
  if (authError) return authError;

  const startTime = Date.now();
  const config = loadHealthConfig();

  const [dailySend, twilio, anthropic] = await Promise.all([
    loadDailySendFacts(),
    checkTwilioBalance(),
    checkAnthropic(),
  ]);

  const checks = evaluateHealth({
    now: new Date(),
    dailySend,
    providers: { twilio, anthropic },
    config,
  });

  const status = overallSeverity(checks);
  const emailed = await reconcileAlerts(checks);

  // Lets the workflow decide whether to attempt a repair run without parsing
  // the whole check list.
  const repairable = checks.some((c) => c.id === "daily_send_missing");

  console.log(
    `Health check: ${status} (${checks.length} checks, ${emailed.length} emailed) in ${Date.now() - startTime}ms`,
  );

  return NextResponse.json(
    {
      status,
      repairable,
      checked_at: new Date().toISOString(),
      checks,
      emailed,
      duration_ms: Date.now() - startTime,
    },
    { status: status === "critical" ? 503 : 200 },
  );
}
