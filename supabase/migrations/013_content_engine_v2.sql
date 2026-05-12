-- Migration: Content Engine v2 - Reply enrichment, user memory, smarter content selection
-- See: docs/prds/2026-05-12-content-engine-v2.md
-- See: docs/plans/2026-05-12-content-engine-v2.md (Milestone 1)

-- ============================================
-- Shared updated_at trigger function (idempotent; safe to replace)
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Messages: enrichment + ack tracking
-- ============================================

-- Per-inbound enrichment payload (sentiment, themes, modality, etc.)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS insights JSONB;

-- Whether an acknowledgement SMS has been sent for this inbound
ALTER TABLE messages ADD COLUMN IF NOT EXISTS ack_sent BOOLEAN DEFAULT false;

-- Extend content_type to include 'ack' (sent in response to a reply)
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
    'ack'
  ));

CREATE INDEX IF NOT EXISTS idx_messages_insights_gin ON messages USING GIN (insights);

-- ============================================
-- Message themes: open tags + required category per inbound
-- ============================================
CREATE TABLE IF NOT EXISTS message_themes (
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  theme TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'career','health','relationships','money','identity',
    'creative','family','spiritual','other'
  )),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (message_id, theme)
);

CREATE INDEX IF NOT EXISTS idx_message_themes_user_recent
  ON message_themes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_themes_category
  ON message_themes(category, created_at DESC);

ALTER TABLE message_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own message themes" ON message_themes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all message themes" ON message_themes
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

GRANT ALL ON message_themes TO service_role;

-- ============================================
-- User memory: per-user compacted memory blob
-- ============================================
CREATE TABLE IF NOT EXISTS user_memory (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  summary JSONB NOT NULL DEFAULT '{}',
  version INTEGER DEFAULT 1,
  token_count INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE user_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all user memory" ON user_memory
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

GRANT ALL ON user_memory TO service_role;

-- Historical snapshots so we can see how memory evolved
CREATE TABLE IF NOT EXISTS user_memory_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  summary JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_memory_history_user
  ON user_memory_history(user_id, created_at DESC);

ALTER TABLE user_memory_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all memory history" ON user_memory_history
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

GRANT ALL ON user_memory_history TO service_role;

-- ============================================
-- Onboarding responses: seed data from web onboarding form
-- ============================================
CREATE TABLE IF NOT EXISTS onboarding_responses (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  intention TEXT NOT NULL,
  vision TEXT NOT NULL,
  obstacles TEXT NOT NULL,
  aligned_state TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE onboarding_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding" ON onboarding_responses
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding" ON onboarding_responses
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding" ON onboarding_responses
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all onboarding" ON onboarding_responses
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

CREATE TRIGGER update_onboarding_responses_updated_at
  BEFORE UPDATE ON onboarding_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

GRANT ALL ON onboarding_responses TO service_role;

-- ============================================
-- Intention shift suggestions: founder-reviewed intention updates
-- ============================================
CREATE TABLE IF NOT EXISTS intention_shift_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_intention TEXT NOT NULL,
  proposed_intention TEXT NOT NULL,
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  rationale TEXT,
  supporting_message_ids UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'dismissed')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intention_shifts_pending
  ON intention_shift_suggestions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_intention_shifts_user
  ON intention_shift_suggestions(user_id, created_at DESC);

ALTER TABLE intention_shift_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view intention shifts" ON intention_shift_suggestions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

CREATE POLICY "Admins can update intention shifts" ON intention_shift_suggestions
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

GRANT ALL ON intention_shift_suggestions TO service_role;

-- ============================================
-- Content selection config: founder-tunable singleton
-- ============================================
CREATE TABLE IF NOT EXISTS content_selection_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  no_repeat_days INTEGER DEFAULT 1,
  earned_reply_bias DECIMAL(3,2) DEFAULT 0.60 CHECK (earned_reply_bias >= 0 AND earned_reply_bias <= 1),
  earned_reply_min_sends INTEGER DEFAULT 5,
  earned_reply_lookback_days INTEGER DEFAULT 30,
  quote_max_per_week INTEGER DEFAULT 1,
  silence_threshold INTEGER DEFAULT 3,
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO content_selection_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE content_selection_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view content config" ON content_selection_config
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

CREATE POLICY "Admins can update content config" ON content_selection_config
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

CREATE TRIGGER update_content_selection_config_updated_at
  BEFORE UPDATE ON content_selection_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

GRANT ALL ON content_selection_config TO service_role;

-- ============================================
-- Soft acks: rotating library of short acknowledgement phrases
-- ============================================
CREATE TABLE IF NOT EXISTS soft_acks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_soft_acks_active ON soft_acks(active) WHERE active = true;

INSERT INTO soft_acks (text) VALUES
  ('Got that.'),
  ('Holding this.'),
  ('Thank you.'),
  ('Sitting with that.'),
  ('Hearing you.'),
  ('Noted.'),
  ('Got it. Talk soon.'),
  ('Received. Thank you.'),
  ('That landed.'),
  ('Thanks for sharing.'),
  ('Holding what you said.'),
  ('Carrying that with me.'),
  ('Heard.'),
  ('Got you.'),
  ('Thanks, friend.')
ON CONFLICT (text) DO NOTHING;

ALTER TABLE soft_acks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view soft acks" ON soft_acks
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

CREATE POLICY "Admins can manage soft acks" ON soft_acks
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

GRANT ALL ON soft_acks TO service_role;

-- ============================================
-- Users: preferred send hour (stored now, honored after Vercel Pro upgrade)
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_send_hour INTEGER DEFAULT 7
  CHECK (preferred_send_hour >= 0 AND preferred_send_hour <= 23);
