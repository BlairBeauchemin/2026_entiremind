-- 028_affirmations.sql
--
-- User-authored affirmations for The Space (/space) — the full-screen breathing
-- and focus surface.
--
-- Deliberately minimal, and deliberately WITHOUT a sessions/visits table. The
-- Space has no timer, no streak, and no completion state (see the dashboard
-- principles in CLAUDE.md and the trusted-friend guardrail in
-- docs/design-philosophy.md), so there is nothing here that could later grow
-- into a "don't break the chain" mechanic.
--
-- `source` records whether the user wrote the line themselves or kept an
-- AI-drafted suggestion. It exists as a founder-side learning signal (do drafted
-- affirmations get kept and re-read?) and is never shown to the user.
--
-- Safe to run more than once (IF NOT EXISTS guards throughout).

CREATE TABLE IF NOT EXISTS affirmations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text       TEXT NOT NULL,
  source     TEXT NOT NULL DEFAULT 'user'   CHECK (source IN ('user', 'ai_draft')),
  status     TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  position   INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE affirmations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own affirmations" ON affirmations;
CREATE POLICY "Users can manage own affirmations" ON affirmations
  FOR ALL USING (auth.uid() = user_id);

-- Covers the only read the app makes: this user's active affirmations in order.
CREATE INDEX IF NOT EXISTS affirmations_user_active_idx
  ON affirmations(user_id, status, position);

COMMENT ON COLUMN affirmations.source IS
  'How the line came to exist: "user" (typed it) or "ai_draft" (kept an AI suggestion). Internal learning signal only — never surfaced to the user.';
COMMENT ON COLUMN affirmations.position IS
  'Display order within a user''s active set. Contiguous 0..n-1, rewritten wholesale on reorder.';
COMMENT ON COLUMN affirmations.status IS
  'Archived affirmations are hidden from The Space but never hard-deleted — the user''s own words are not thrown away.';
