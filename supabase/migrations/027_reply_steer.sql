-- 027_reply_steer.sql
--
-- Explicit topic-steer support for the reply-enrichment / memory learning loop.
--
-- When an inbound reply explicitly asks us to change focus ("can we focus on
-- manifestation?"), enrichment surfaces it as insights.directive. We persist it
-- here as a short-lived active_steer that the daily-prompt builder injects at
-- top priority (see src/lib/ai/steer.ts + buildUserPrompt), so a recent
-- directive outranks older, stale memory themes. The steer never rewrites the
-- user's intention — that stays a user action in-app; steer_nudged throttles the
-- one-time "you can set this as your main intention in the app" ack.
--
-- Safe to run more than once (IF NOT EXISTS). Code reads these columns
-- defensively, so deploying the app before this migration is applied is a no-op
-- for the steer feature (it simply never activates).

ALTER TABLE user_memory
  ADD COLUMN IF NOT EXISTS active_steer TEXT,
  ADD COLUMN IF NOT EXISTS steer_set_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS steer_nudged BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN user_memory.active_steer IS
  'Latest explicit topic-steer the user asked for (e.g. "manifestation"); injected top-priority into daily prompts. Decays after STEER_TTL_DAYS; cleared by weekly compaction once folded into themes.';
COMMENT ON COLUMN user_memory.steer_set_at IS
  'When active_steer was last set. Used for TTL decay (STEER_TTL_DAYS).';
COMMENT ON COLUMN user_memory.steer_nudged IS
  'True once we have nudged the user (in an ack) to set this steer as their main intention in-app, within the current steer window.';
