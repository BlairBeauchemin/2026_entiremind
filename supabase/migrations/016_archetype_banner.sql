-- ============================================
-- Onboarding v2: Archetype Discovery — Milestone 5 (existing-user backfill)
-- PRD:  docs/prds/2026-06-11-onboarding-v2.md
-- Plan: docs/plans/2026-06-11-onboarding-v2.md (Milestone 5)
--
-- Persists dismissal of the dashboard "discover your archetype" banner on the
-- user row so it survives devices and sign-out (PRD open question 1).
-- ============================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS archetype_banner_dismissed_at TIMESTAMPTZ;
