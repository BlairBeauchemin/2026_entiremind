-- 030_cron_health.sql
--
-- Cron health monitoring — making a missed send visible.
--
-- On 2026-09-12 no daily SMS went out. There were zero `messages` rows of any
-- status for that day: not sent, not failed. `sendSms` writes a status='failed'
-- row on every failure path, and `generateMessageForUser` falls back to a
-- pre-written message when the LLM call throws, so neither a Twilio rejection
-- nor an Anthropic outage can produce total silence. The send loop was never
-- reached — the Vercel cron simply did not fire. (Hobby-plan crons are
-- best-effort: the daily send has always drifted, 14:55 → 15:12 → 15:21 →
-- 15:04, against a declared 45 14 * * *.)
--
-- The defect worth fixing is not the miss, it is that the miss was INVISIBLE.
-- Nothing recorded that a run had been attempted, so the only detector was a
-- human noticing their phone was quiet.
--
-- `cron_runs` is that missing record: one row per invocation, written even when
-- the run does nothing. `health_alerts` is the throttle ledger, so a day spent
-- broken produces one email rather than one per check.
--
-- Both tables are operational, not user data. RLS is enabled with NO policies:
-- the service role bypasses RLS for the crons and the founder dashboard, and
-- there is no path by which an end user should read either table.
--
-- Safe to run more than once (IF NOT EXISTS guards throughout).

-- ============================================
-- cron_runs — did this job actually run?
-- ============================================

CREATE TABLE IF NOT EXISTS cron_runs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name    TEXT NOT NULL,
  started_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  status      TEXT NOT NULL DEFAULT 'running'
                CHECK (status IN ('running', 'success', 'failure')),
  processed   INTEGER,
  sent        INTEGER,
  failed      INTEGER,
  detail      JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cron_runs ENABLE ROW LEVEL SECURITY;

-- The health check's hottest query: "the newest successful run of this job".
CREATE INDEX IF NOT EXISTS cron_runs_job_started_idx
  ON cron_runs(job_name, started_at DESC);

COMMENT ON TABLE cron_runs IS
  'One row per cron invocation. Written even when the run sends nothing, so that "the job did not run" is distinguishable from "the job ran and had no work".';
COMMENT ON COLUMN cron_runs.status IS
  '"running" is stamped on entry and replaced on exit. A row stuck at "running" means the invocation died mid-flight (timeout, OOM) — itself a useful signal.';
COMMENT ON COLUMN cron_runs.sent IS
  'Messages actually handed to the provider. sent = 0 with eligible recipients is a failure even when status = success.';
COMMENT ON COLUMN cron_runs.detail IS
  'Free-form per-job payload (per-user errors, counts by branch). Never user message content.';

-- ============================================
-- health_alerts — notified once, not once per check
-- ============================================

CREATE TABLE IF NOT EXISTS health_alerts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_key   TEXT NOT NULL,
  severity    TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
  title       TEXT NOT NULL,
  detail      JSONB,
  notified_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE health_alerts ENABLE ROW LEVEL SECURITY;

-- "Has this exact alert been emailed recently?" and "is it still open?"
CREATE INDEX IF NOT EXISTS health_alerts_key_notified_idx
  ON health_alerts(alert_key, notified_at DESC);
CREATE INDEX IF NOT EXISTS health_alerts_open_idx
  ON health_alerts(alert_key) WHERE resolved_at IS NULL;

COMMENT ON TABLE health_alerts IS
  'Throttle + recovery ledger for operational email alerts. One open row per alert_key; resolved_at is stamped when the condition clears, which is what lets a "recovered" email fire exactly once.';
COMMENT ON COLUMN health_alerts.alert_key IS
  'Stable identifier for the condition (e.g. daily_send_missing), NOT per-occurrence. The throttle and the recovery logic both key off it.';
COMMENT ON COLUMN health_alerts.notified_at IS
  'When the email actually went out. NULL means the alert was recorded but not delivered (no RESEND_API_KEY, or the send failed) — the row still exists so the dashboard shows it.';
