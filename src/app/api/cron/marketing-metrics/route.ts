import { NextResponse } from "next/server";
import { loadEngineConfig } from "@/lib/marketing/config";
import { collectMetrics } from "@/lib/marketing/pipeline/metrics";
import { evaluateRunningExperiments } from "@/lib/marketing/pipeline/experiments";

export const maxDuration = 300;

/**
 * Marketing Metrics Cron: pull daily performance for recently published
 * pieces into content_metrics. Adapters return placeholder data until
 * platform credentials are wired.
 *
 * Security: Protected by CRON_SECRET header.
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET environment variable not set");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error("Invalid cron authorization");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await loadEngineConfig();
  if (!config.enabled) {
    return NextResponse.json({ success: true, processed: 0, message: "Engine disabled" });
  }

  const result = await collectMetrics();

  // Fresh metrics in hand: advance experiment lifecycles (recommend-only —
  // conclusions never publish or promote anything)
  const experiments = await evaluateRunningExperiments();

  const duration = Date.now() - startTime;

  console.log(
    `Marketing metrics complete: ${result.updated} rows upserted across ${result.processed} pieces; experiments ${experiments.started} started, ${experiments.concluded} concluded in ${duration}ms`,
  );

  return NextResponse.json({
    success: true,
    processed: result.processed,
    updated: result.updated,
    failed: result.failed,
    experiments_checked: experiments.checked,
    experiments_started: experiments.started,
    experiments_concluded: experiments.concluded,
    duration_ms: duration,
    errors:
      result.errors.length > 0 || experiments.errors.length > 0
        ? [...result.errors, ...experiments.errors]
        : undefined,
  });
}
