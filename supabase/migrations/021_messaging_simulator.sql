-- ============================================
-- 018: Founder messaging simulator
--
-- Test personas are real rows in the real tables, flagged users.is_test, so
-- the simulator exercises the actual production pipeline (context building,
-- content selection, enrichment, signals, memory) without ever sending SMS.
-- Adds versioned system prompts (one active row drives production generation)
-- and the simulator's run/day ledger with per-day debug payloads.
-- ============================================

-- ============================================
-- Users: test-persona flag
-- Note: 017 re-granted authenticated UPDATE on an explicit column list, so
-- is_test is not user-writable — only the service role sets it.
-- ============================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_test BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_is_test ON users(is_test) WHERE is_test = true;

-- ============================================
-- Messages: allow simulator-originated rows
-- provider CHECK (007) only allows telnyx/twilio; simulated messages carry
-- their own provider value so they are unmistakable in the data.
-- ============================================
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_provider_check;
ALTER TABLE messages ADD CONSTRAINT messages_provider_check
  CHECK (provider IN ('telnyx', 'twilio', 'simulator'));

-- ============================================
-- System prompts: versioned, at most one active.
-- No seed row: when none is active, generation falls back to the hardcoded
-- default constant, so production behavior is byte-identical until the
-- founder explicitly activates a version.
-- ============================================
CREATE TABLE IF NOT EXISTS system_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  body TEXT NOT NULL,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT false,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS system_prompts_one_active
  ON system_prompts (is_active) WHERE is_active;

ALTER TABLE system_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view system prompts" ON system_prompts
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

CREATE TRIGGER update_system_prompts_updated_at
  BEFORE UPDATE ON system_prompts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

GRANT ALL ON system_prompts TO service_role;

-- ============================================
-- Sim runs: one simulated week per row. One non-archived run per persona;
-- archived runs (plus text snapshots on sim_days) keep prior weeks comparable
-- for prompt A/B even after their messages are wiped.
-- ============================================
CREATE TABLE IF NOT EXISTS sim_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'awaiting_review', 'completed', 'archived')),
  start_date DATE NOT NULL,
  current_day INTEGER NOT NULL DEFAULT 0,
  total_days INTEGER NOT NULL DEFAULT 7,
  pinned_prompt_id UUID REFERENCES system_prompts(id) ON DELETE SET NULL,
  persona_brief TEXT NOT NULL,
  reply_style TEXT NOT NULL DEFAULT 'realistic'
    CHECK (reply_style IN ('eager', 'realistic', 'terse', 'flaky', 'silent')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sim_runs_user ON sim_runs(user_id, created_at DESC);

ALTER TABLE sim_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sim runs" ON sim_runs
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

CREATE TRIGGER update_sim_runs_updated_at
  BEFORE UPDATE ON sim_runs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

GRANT ALL ON sim_runs TO service_role;

-- ============================================
-- Sim days: per-day ledger with full debug payload.
-- debug JSONB holds: exact built user prompt, system prompt id/name + body
-- snapshot, fallback/truncation flags, content-type selection reasoning,
-- persona model decision + reasoning, founder-edited flag, enrichment JSON,
-- and the ack that would have been sent.
-- ============================================
CREATE TABLE IF NOT EXISTS sim_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES sim_runs(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL CHECK (day_number >= 1),
  sim_date DATE NOT NULL,
  outbound_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  inbound_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  outbound_text TEXT,
  inbound_text TEXT,
  persona_action TEXT CHECK (persona_action IN ('reply', 'silence')),
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'committed')),
  debug JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (run_id, day_number)
);

CREATE INDEX IF NOT EXISTS idx_sim_days_run ON sim_days(run_id, day_number);

ALTER TABLE sim_days ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view sim days" ON sim_days
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

GRANT ALL ON sim_days TO service_role;
