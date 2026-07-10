-- Migration: Curated quote library + weekly themed email editions
-- Feature 1: quotes table feeds the 'quote' SMS content type and the
--            dashboard "quote for today" card. Library is populated by
--            scripts/import-quotes.ts; the seed below is a small fallback
--            so the feature works before the first import runs.
-- Feature 2: weekly_editions records the AI-drafted weekly email pushed to
--            the email campaign provider (ActiveCampaign) as a draft.
--            Approval/sending/unsubscribe all live in the provider's UI.

-- ============================================
-- Quotes: curated, themed, attributed
-- ============================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL UNIQUE,
  author TEXT NOT NULL,
  theme TEXT NOT NULL CHECK (theme IN (
    'abundance',
    'confidence',
    'trusting-the-process',
    'gratitude',
    'resilience',
    'love',
    'purpose',
    'presence'
  )),
  source TEXT DEFAULT 'seed',
  source_tags TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_quotes_theme_active ON quotes(theme) WHERE active = true;

-- Fallback seed (public-domain authors, <= 120 chars so `"..." — Author`
-- fits a single SMS segment). The real library comes from the import script.
INSERT INTO quotes (text, author, theme) VALUES
  ('When you realize nothing is lacking, the whole world belongs to you.', 'Lao Tzu', 'abundance'),
  ('The soul should always stand ajar, ready to welcome the ecstatic experience.', 'Emily Dickinson', 'abundance'),
  ('Trust thyself: every heart vibrates to that iron string.', 'Ralph Waldo Emerson', 'confidence'),
  ('No one can make you feel inferior without your consent.', 'Eleanor Roosevelt', 'confidence'),
  ('What you seek is seeking you.', 'Rumi', 'trusting-the-process'),
  ('Nature does not hurry, yet everything is accomplished.', 'Lao Tzu', 'trusting-the-process'),
  ('Gratitude is not only the greatest of virtues, but the parent of all the others.', 'Cicero', 'gratitude'),
  ('He is a wise man who does not grieve for the things which he has not, but rejoices for those which he has.', 'Epictetus', 'gratitude'),
  ('The impediment to action advances action. What stands in the way becomes the way.', 'Marcus Aurelius', 'resilience'),
  ('We are shaped and fashioned by what we love.', 'Johann Wolfgang von Goethe', 'love'),
  ('Go confidently in the direction of your dreams. Live the life you have imagined.', 'Henry David Thoreau', 'purpose'),
  ('Forever is composed of nows.', 'Emily Dickinson', 'presence')
ON CONFLICT (text) DO NOTHING;

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Authenticated users read active quotes (dashboard quote-of-the-day card)
CREATE POLICY "Authenticated users can view active quotes" ON quotes
  FOR SELECT TO authenticated USING (active = true);

CREATE POLICY "Admins can manage quotes" ON quotes
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

GRANT ALL ON quotes TO service_role;

-- ============================================
-- Messages: which library quote a 'quote' SMS carried (repeat avoidance)
-- ============================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES quotes(id);

-- ============================================
-- Weekly editions: app-side record of drafted weekly emails.
-- Approval + sending state lives in the email campaign provider.
-- ============================================
CREATE TABLE IF NOT EXISTS weekly_editions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_start DATE NOT NULL UNIQUE,
  theme TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pushed', 'failed')),
  content JSONB NOT NULL,
  provider TEXT,
  provider_campaign_id TEXT,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_weekly_editions_week ON weekly_editions(week_start DESC);

ALTER TABLE weekly_editions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view weekly editions" ON weekly_editions
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

CREATE TRIGGER update_weekly_editions_updated_at
  BEFORE UPDATE ON weekly_editions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

GRANT ALL ON weekly_editions TO service_role;
