/**
 * Founder-dashboard view of cron health. Server-computed, in the same shape as
 * src/lib/founder/conversion-funnel.ts — the component stays presentational.
 */

import { createServiceRoleClient } from "@/lib/supabase";

const LOOKBACK_DAYS = 7;

export interface CronJobSummary {
  jobName: string;
  lastRunAt: string | null;
  lastStatus: "running" | "success" | "failure" | null;
  lastSent: number | null;
  lastFailed: number | null;
  runsInWindow: number;
  failuresInWindow: number;
}

export interface OpenAlert {
  id: string;
  alertKey: string;
  severity: "warning" | "critical";
  title: string;
  message: string | null;
  notifiedAt: string | null;
  createdAt: string;
}

export interface CronHealth {
  jobs: CronJobSummary[];
  alerts: OpenAlert[];
  lookbackDays: number;
}

interface CronRunRow {
  job_name: string;
  started_at: string;
  status: "running" | "success" | "failure";
  sent: number | null;
  failed: number | null;
}

export async function loadCronHealth(): Promise<CronHealth> {
  const supabase = createServiceRoleClient();
  const since = new Date(
    Date.now() - LOOKBACK_DAYS * 24 * 3_600_000,
  ).toISOString();

  const [runsResult, alertsResult] = await Promise.all([
    supabase
      .from("cron_runs")
      .select("job_name, started_at, status, sent, failed")
      .gte("started_at", since)
      .order("started_at", { ascending: false })
      .limit(500),
    supabase
      .from("health_alerts")
      .select("id, alert_key, severity, title, detail, notified_at, created_at")
      .is("resolved_at", null)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (runsResult.error) {
    console.error("Failed to load cron_runs:", runsResult.error);
  }
  if (alertsResult.error) {
    console.error("Failed to load health_alerts:", alertsResult.error);
  }

  // Rows arrive newest-first, so the first row seen per job is its latest run.
  const byJob = new Map<string, CronJobSummary>();
  for (const row of (runsResult.data ?? []) as CronRunRow[]) {
    const existing = byJob.get(row.job_name);
    if (existing) {
      existing.runsInWindow += 1;
      if (row.status === "failure") existing.failuresInWindow += 1;
      continue;
    }
    byJob.set(row.job_name, {
      jobName: row.job_name,
      lastRunAt: row.started_at,
      lastStatus: row.status,
      lastSent: row.sent,
      lastFailed: row.failed,
      runsInWindow: 1,
      failuresInWindow: row.status === "failure" ? 1 : 0,
    });
  }

  const alerts: OpenAlert[] = (alertsResult.data ?? []).map((row) => ({
    id: row.id as string,
    alertKey: row.alert_key as string,
    severity: row.severity as "warning" | "critical",
    title: row.title as string,
    message: (row.detail as { message?: string } | null)?.message ?? null,
    notifiedAt: row.notified_at as string | null,
    createdAt: row.created_at as string,
  }));

  return {
    jobs: [...byJob.values()].sort((a, b) =>
      a.jobName.localeCompare(b.jobName),
    ),
    alerts,
    lookbackDays: LOOKBACK_DAYS,
  };
}
