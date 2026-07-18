import { NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron-auth";
import { loadEngineConfig } from "@/lib/marketing/config";
import { collectMetrics } from "@/lib/marketing/pipeline/metrics";

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

  const authError = requireCronAuth(request);
  if (authError) return authError;

  const config = await loadEngineConfig();
  if (!config.enabled) {
    return NextResponse.json({
      success: true,
      processed: 0,
      message: "Engine disabled",
    });
  }

  const result = await collectMetrics();
  const duration = Date.now() - startTime;

  console.log(
    `Marketing metrics complete: ${result.updated} rows upserted across ${result.processed} pieces in ${duration}ms`,
  );

  return NextResponse.json({
    success: true,
    processed: result.processed,
    updated: result.updated,
    failed: result.failed,
    duration_ms: duration,
    errors: result.errors.length > 0 ? result.errors : undefined,
  });
}
