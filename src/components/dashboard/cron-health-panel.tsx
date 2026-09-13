/**
 * Cron health for the founder dashboard: did each scheduled job actually run,
 * and is anything currently alerting. Presentational only — the server computes
 * the numbers in src/lib/ops/dashboard.ts.
 */
import type { CronHealth, CronJobSummary } from "@/lib/ops/dashboard";

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const hours = (Date.now() - new Date(iso).getTime()) / 3_600_000;
  if (hours < 1) return `${Math.round(hours * 60)}m ago`;
  if (hours < 48) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function statusLabel(job: CronJobSummary): {
  text: string;
  className: string;
} {
  if (job.lastStatus === "failure") {
    return { text: "Failed", className: "text-destructive" };
  }
  // A row still marked 'running' means the invocation died mid-flight.
  if (job.lastStatus === "running") {
    return { text: "Incomplete", className: "text-destructive" };
  }
  return { text: "Success", className: "text-ink" };
}

export function CronHealthPanel({ health }: { health: CronHealth }) {
  return (
    <div className="space-y-5">
      {health.alerts.length > 0 && (
        <ul className="space-y-2">
          {health.alerts.map((alert) => (
            <li
              key={alert.id}
              className="bg-surface border border-rule rounded-sm px-4 py-3"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-sm text-ink">{alert.title}</span>
                <span className="text-xs uppercase tracking-wide text-destructive shrink-0">
                  {alert.severity}
                </span>
              </div>
              {alert.message && (
                <p className="text-xs text-muted mt-1">{alert.message}</p>
              )}
              <p className="text-xs text-muted mt-1">
                Open since {relativeTime(alert.createdAt)}
                {alert.notifiedAt
                  ? ` · emailed ${relativeTime(alert.notifiedAt)}`
                  : " · not emailed (check RESEND_API_KEY)"}
              </p>
            </li>
          ))}
        </ul>
      )}

      {health.jobs.length === 0 ? (
        <div className="text-sm text-muted-foreground italic">
          No cron runs recorded in the last {health.lookbackDays} days. Runs are
          logged from the first invocation after this ships.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-4 font-medium">Job</th>
                <th className="py-2 pr-4 font-medium">Last run</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium text-right">Sent</th>
                <th className="py-2 pr-4 font-medium text-right">Failed</th>
                <th className="py-2 pr-4 font-medium text-right">
                  Runs / {health.lookbackDays}d
                </th>
              </tr>
            </thead>
            <tbody>
              {health.jobs.map((job) => {
                const status = statusLabel(job);
                return (
                  <tr key={job.jobName} className="border-t border-rule">
                    <td className="py-2 pr-4 text-ink">{job.jobName}</td>
                    <td className="py-2 pr-4 text-muted">
                      {relativeTime(job.lastRunAt)}
                    </td>
                    <td className={`py-2 pr-4 ${status.className}`}>
                      {status.text}
                    </td>
                    <td className="py-2 pr-4 text-right text-ink tabular-nums">
                      {job.lastSent ?? "—"}
                    </td>
                    <td className="py-2 pr-4 text-right text-ink tabular-nums">
                      {job.lastFailed ?? "—"}
                    </td>
                    <td className="py-2 pr-4 text-right text-muted tabular-nums">
                      {job.runsInWindow}
                      {job.failuresInWindow > 0 &&
                        ` (${job.failuresInWindow} failed)`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
