-- ============================================
-- 019: Free-trial value ladder + failed-payment dunning
-- Plan: docs/plans/2026-07-04-monetization-growth.md (Parts A + B)
--
-- Part A: subscriptions.trial_ends_at gates the daily loop. Trial starts at
-- onboarding completion (now() + 10 days, set by completeFullOnboarding).
-- Existing free users are grandfathered into a fresh 14-day trial so nobody
-- who onboarded pre-launch is cut off without a trial-end moment.
--
-- Part B: subscriptions.dunning_notified_at throttles failed-payment SMS
-- (Stripe fires invoice.payment_failed on every retry; we text at most
-- once per 5 days).
-- ============================================

ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;
ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS dunning_notified_at TIMESTAMPTZ;

-- Grandfather existing free users: fresh 14-day trial from migration time.
UPDATE subscriptions
SET trial_ends_at = now() + interval '14 days'
WHERE plan = 'free' AND trial_ends_at IS NULL;

-- New outbound content types:
--   'billing' — dunning + subscription lifecycle notices (excluded from
--               engagement metrics and from daily-send suppression)
--   'upgrade' — trial-end personalized paywall messages
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_content_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_content_type_check
  CHECK (content_type IN (
    'reflection',
    'quote',
    'check-in',
    'action',
    'gratitude',
    'welcome',
    'manual',
    'ack',
    'recap',
    'reconnect',
    'billing',
    'upgrade'
  ));
