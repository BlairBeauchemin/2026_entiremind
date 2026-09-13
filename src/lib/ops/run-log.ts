/**
 * Cron run logging — the record that a job actually ran.
 *
 * The 2026-09-12 miss was undetectable because nothing was written when the
 * daily send failed to happen. Every write here is best-effort and wrapped:
 * the monitor must never be able to fail the thing it monitors.
 */

import { createServiceRoleClient } from "@/lib/supabase";

export interface CronRunResult {
  processed?: number;
  sent?: number;
  failed?: number;
  detail?: Record<string, unknown>;
}

export const DAILY_SEND_JOB = "daily-send";

/** Open a run row. Returns its id, or null if the row could not be written. */
export async function startCronRun(jobName: string): Promise<string | null> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("cron_runs")
      .insert({ job_name: jobName, status: "running" })
      .select("id")
      .single();

    if (error) {
      console.error(`Failed to open cron_runs row for ${jobName}:`, error);
      return null;
    }
    return data.id as string;
  } catch (error) {
    console.error(`Failed to open cron_runs row for ${jobName}:`, error);
    return null;
  }
}

/** Close a run row. A no-op when the row was never opened. */
export async function finishCronRun(
  runId: string | null,
  status: "success" | "failure",
  result: CronRunResult = {},
): Promise<void> {
  if (!runId) return;

  try {
    const supabase = createServiceRoleClient();
    const { error } = await supabase
      .from("cron_runs")
      .update({
        status,
        finished_at: new Date().toISOString(),
        processed: result.processed ?? null,
        sent: result.sent ?? null,
        failed: result.failed ?? null,
        detail: result.detail ?? null,
      })
      .eq("id", runId);

    if (error) {
      console.error(`Failed to close cron_runs row ${runId}:`, error);
    }
  } catch (error) {
    console.error(`Failed to close cron_runs row ${runId}:`, error);
  }
}

/**
 * Wrap a cron body so the run is recorded whichever way it ends.
 *
 * The handler returns both the HTTP response and the counts worth recording,
 * so the route keeps ownership of its own response shape.
 */
export async function withCronRun<T>(
  jobName: string,
  handler: () => Promise<{ response: T; result?: CronRunResult }>,
): Promise<T> {
  const runId = await startCronRun(jobName);
  try {
    const { response, result } = await handler();
    await finishCronRun(runId, "success", result);
    return response;
  } catch (error) {
    await finishCronRun(runId, "failure", {
      detail: {
        error: error instanceof Error ? error.message : String(error),
      },
    });
    throw error;
  }
}
