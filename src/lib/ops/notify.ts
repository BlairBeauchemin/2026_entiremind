/**
 * Operational email alerts.
 *
 * Email rather than SMS on purpose: the thing most likely to be broken is the
 * SMS path itself, and an alert that travels down the failing wire is no alert.
 *
 * Resend over plain fetch — no new npm dependency. Every failure here is
 * swallowed and logged: the GitHub Actions watchdog fails its job on a non-2xx
 * from the health endpoint regardless, so a missing RESEND_API_KEY degrades
 * this system rather than silencing it.
 */

import { createServiceRoleClient } from "@/lib/supabase";
import type { HealthCheck } from "./health";

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_THROTTLE_HOURS = 12;

function throttleHours(): number {
  const raw = Number.parseFloat(process.env.ALERT_THROTTLE_HOURS ?? "");
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_THROTTLE_HOURS;
}

function recipient(): string | null {
  return process.env.ALERT_EMAIL_TO || process.env.ADMIN_EMAIL || null;
}

async function sendEmail(subject: string, body: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = recipient();
  const from = process.env.ALERT_EMAIL_FROM || "alerts@entiremind.com";

  if (!apiKey || !to) {
    console.error(
      "Health alert not emailed: RESEND_API_KEY or ALERT_EMAIL_TO/ADMIN_EMAIL is unset.",
      { subject },
    );
    return false;
  }

  try {
    const response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: [to], subject, text: body }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!response.ok) {
      console.error(
        `Resend rejected the alert: ${response.status} ${await response.text()}`,
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("Failed to send health alert email:", error);
    return false;
  }
}

function formatAlertBody(check: HealthCheck, checks: HealthCheck[]): string {
  const others = checks
    .filter((c) => c.id !== check.id)
    .map((c) => `  [${c.severity}] ${c.title} — ${c.detail}`)
    .join("\n");

  return [
    check.title,
    "",
    check.detail,
    "",
    "Full health report:",
    others || "  (no other checks)",
    "",
    "Founder dashboard: https://www.entiremind.com/dashboard/founder",
  ].join("\n");
}

/**
 * Record the current checks, emailing on newly-opened and newly-cleared
 * conditions. Returns the alert keys that were emailed this run.
 */
export async function reconcileAlerts(
  checks: HealthCheck[],
): Promise<string[]> {
  const supabase = createServiceRoleClient();
  const firing = checks.filter((c) => c.severity !== "ok");
  const firingKeys = new Set(firing.map((c) => c.id));
  const emailed: string[] = [];

  try {
    const { data: openRows, error } = await supabase
      .from("health_alerts")
      .select("id, alert_key, notified_at")
      .is("resolved_at", null);

    if (error) {
      console.error("Failed to read open health_alerts:", error);
      return emailed;
    }

    const open = openRows ?? [];
    const openByKey = new Map(open.map((row) => [row.alert_key, row]));
    const cutoff = Date.now() - throttleHours() * 3_600_000;

    // Newly firing, or firing again past the throttle window.
    for (const check of firing) {
      const existing = openByKey.get(check.id);
      const notifiedAt = existing?.notified_at
        ? new Date(existing.notified_at).getTime()
        : null;

      // Already open and emailed recently — stay quiet.
      if (existing && notifiedAt !== null && notifiedAt > cutoff) continue;

      const sent = await sendEmail(
        `[Entiremind ${check.severity}] ${check.title}`,
        formatAlertBody(check, checks),
      );
      if (sent) emailed.push(check.id);

      if (existing) {
        await supabase
          .from("health_alerts")
          .update({
            severity: check.severity,
            title: check.title,
            detail: { message: check.detail },
            notified_at: sent ? new Date().toISOString() : existing.notified_at,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("health_alerts").insert({
          alert_key: check.id,
          severity: check.severity,
          title: check.title,
          detail: { message: check.detail },
          notified_at: sent ? new Date().toISOString() : null,
        });
      }
    }

    // Conditions that have cleared since the last run.
    for (const row of open) {
      if (firingKeys.has(row.alert_key)) continue;

      await supabase
        .from("health_alerts")
        .update({ resolved_at: new Date().toISOString() })
        .eq("id", row.id);

      // Only announce a recovery for something the founder was told about.
      if (row.notified_at) {
        await sendEmail(
          `[Entiremind recovered] ${row.alert_key}`,
          `The condition "${row.alert_key}" has cleared as of ${new Date().toISOString()}.`,
        );
      }
    }
  } catch (error) {
    console.error("Failed to reconcile health alerts:", error);
  }

  return emailed;
}
