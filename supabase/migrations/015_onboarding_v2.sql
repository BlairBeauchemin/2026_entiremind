-- ============================================
-- Onboarding v2: Archetype Discovery
-- PRD:  docs/prds/2026-06-11-onboarding-v2.md
-- Plan: docs/plans/2026-06-11-onboarding-v2.md
--
-- Adds the derived persona profile, its retake history, lightweight drop-off
-- tracking, and verbatim raw-answer storage on onboarding_responses.
-- Numbered 015 (014 is the create_user_signals search_path fix).
-- ============================================

-- --------------------------------------------
-- Derived persona profile (current version per user)
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  archetype TEXT NOT NULL CHECK (archetype IN ('visionary','alchemist','seeker','phoenix')),
  motivation_orientation TEXT NOT NULL CHECK (motivation_orientation IN ('toward','away')),
  change_style TEXT NOT NULL CHECK (change_style IN ('dreamer','doer')),
  primary_distortion TEXT CHECK (primary_distortion IN (
    'worthiness','all_or_nothing','catastrophizing','should_statements',
    'mind_reading','discounting_positive','personalization'
  )),
  secondary_distortion TEXT CHECK (secondary_distortion IN (
    'worthiness','all_or_nothing','catastrophizing','should_statements',
    'mind_reading','discounting_positive','personalization'
  )),
  distortion_scores JSONB NOT NULL DEFAULT '{}',
  -- named core_values (not "values") to avoid the reserved-ish column name
  core_values TEXT[] NOT NULL DEFAULT '{}',
  tone_preference TEXT NOT NULL CHECK (tone_preference IN ('gentle','direct','socratic','celebratory')),
  -- mirrors message_themes.category (incl. 'other' for forward-compat; quiz offers 8)
  intention_category TEXT CHECK (intention_category IN (
    'career','health','relationships','money','identity',
    'creative','family','spiritual','other'
  )),
  quiz_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

GRANT ALL ON user_profiles TO service_role;

-- --------------------------------------------
-- Retakes archive the previous profile
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS user_profile_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profile_history_user
  ON user_profile_history(user_id, created_at DESC);

ALTER TABLE user_profile_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view profile history" ON user_profile_history
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

GRANT ALL ON user_profile_history TO service_role;

-- --------------------------------------------
-- Raw quiz answers, verbatim, re-scorable
-- --------------------------------------------
ALTER TABLE onboarding_responses ADD COLUMN IF NOT EXISTS responses JSONB;
ALTER TABLE onboarding_responses ADD COLUMN IF NOT EXISTS quiz_version INTEGER DEFAULT 1;

-- obstacles free-text question is removed from the flow; aligned_state is skippable
ALTER TABLE onboarding_responses ALTER COLUMN obstacles DROP NOT NULL;
ALTER TABLE onboarding_responses ALTER COLUMN aligned_state DROP NOT NULL;

-- --------------------------------------------
-- Lightweight drop-off tracking
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS onboarding_step_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  step TEXT NOT NULL,
  quiz_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_step_events_step
  ON onboarding_step_events(step, created_at DESC);

ALTER TABLE onboarding_step_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own step events" ON onboarding_step_events
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view step events" ON onboarding_step_events
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

GRANT ALL ON onboarding_step_events TO service_role;
