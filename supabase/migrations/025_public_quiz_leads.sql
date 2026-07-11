-- ============================================
-- Migration 025: Public quiz lead capture
-- The public /quiz flow stores the taker's archetype result and raw answers
-- on their lead row (email-gated full reveal). Server re-scores answers with
-- scoreProfile() before writing, so these columns are trustworthy.
-- ============================================

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS archetype TEXT
    CHECK (archetype IN ('visionary', 'alchemist', 'seeker', 'phoenix')),
  ADD COLUMN IF NOT EXISTS quiz_answers JSONB,
  ADD COLUMN IF NOT EXISTS quiz_version INTEGER,
  ADD COLUMN IF NOT EXISTS quiz_completed_at TIMESTAMPTZ;

-- The leads API validates source against an allowlist; 'quiz' joins
-- 'landing_page' and 'share-{archetype}' as an accepted value (no constraint
-- exists on leads.source — this comment is documentation).

COMMENT ON COLUMN leads.archetype IS 'Result of the public /quiz (server-scored)';
COMMENT ON COLUMN leads.quiz_answers IS 'Raw QuizAnswers payload from the public quiz';
COMMENT ON COLUMN leads.quiz_version IS 'QUIZ_VERSION at the time of the attempt';
COMMENT ON COLUMN leads.quiz_completed_at IS 'When the email gate was submitted';
