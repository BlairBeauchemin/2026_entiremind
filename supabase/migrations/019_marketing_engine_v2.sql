-- Migration: Marketing Engine v2 - niches, trend deltas, video styles,
-- experiments (testing plans). Run AFTER 018_marketing_engine.sql.
--
-- Unlike 018 (fresh tables), this migration alters existing tables, so every
-- policy/trigger is wrapped in DROP ... IF EXISTS to keep re-runs safe.
--
-- NOTE: the video_style CHECK list must stay in sync with VIDEO_STYLES in
-- src/lib/marketing/video-styles.ts (the TS side derives everything from
-- that const; only this SQL list can drift).

-- ============================================
-- Brands: followed niches
-- ============================================
ALTER TABLE brands ADD COLUMN IF NOT EXISTS niches TEXT[] NOT NULL DEFAULT '{}';

UPDATE brands
SET niches = ARRAY['manifestation','law of attraction','morning routines','mindfulness','intentional living']
WHERE slug = 'entiremind' AND niches = '{}';

-- ============================================
-- Trend snapshots: comparability over time
-- ============================================
ALTER TABLE trend_snapshots ADD COLUMN IF NOT EXISTS niches TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE trend_snapshots ADD COLUMN IF NOT EXISTS previous_snapshot_id UUID REFERENCES trend_snapshots(id) ON DELETE SET NULL;
-- { summary, new_trends[], continued_trends[], dropped_trends[] }
ALTER TABLE trend_snapshots ADD COLUMN IF NOT EXISTS delta JSONB;

-- ============================================
-- Content pieces: video style (nullable; video formats only, enforced in code)
-- ============================================
ALTER TABLE content_pieces ADD COLUMN IF NOT EXISTS video_style TEXT
  CHECK (video_style IS NULL OR video_style IN (
    'talking_head',
    'ugc_testimonial',
    'b_roll_voiceover',
    'pov',
    'text_on_screen',
    'greenscreen_react',
    'slideshow',
    'tutorial_demo'
  ));

-- ============================================
-- Marketing experiments: structured testing plans.
-- Variants are content_pieces sharing an experiment_id, differing only in
-- the tested variable. Winners are recommended, never auto-promoted.
-- ============================================
CREATE TABLE IF NOT EXISTS marketing_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  parent_experiment_id UUID REFERENCES marketing_experiments(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  variable TEXT NOT NULL CHECK (variable IN ('angle','hook','video_style','format','audience','cta')),
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned','running','concluded','cancelled')),
  min_impressions INTEGER NOT NULL DEFAULT 1000,
  primary_metric TEXT NOT NULL DEFAULT 'auto' CHECK (primary_metric IN ('auto','ctr','conversions','engagement_rate')),
  winner_piece_id UUID REFERENCES content_pieces(id) ON DELETE SET NULL,
  conclusion TEXT,
  concluded_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_experiments_brand
  ON marketing_experiments(brand_id, status);

ALTER TABLE marketing_experiments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view marketing experiments" ON marketing_experiments;
CREATE POLICY "Admins can view marketing experiments" ON marketing_experiments
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

DROP TRIGGER IF EXISTS update_marketing_experiments_updated_at ON marketing_experiments;
CREATE TRIGGER update_marketing_experiments_updated_at
  BEFORE UPDATE ON marketing_experiments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

GRANT ALL ON marketing_experiments TO service_role;

-- ============================================
-- Content pieces: experiment variant linkage
-- (must come after marketing_experiments exists)
-- ============================================
ALTER TABLE content_pieces ADD COLUMN IF NOT EXISTS experiment_id UUID REFERENCES marketing_experiments(id) ON DELETE SET NULL;
ALTER TABLE content_pieces ADD COLUMN IF NOT EXISTS variant_label TEXT;

CREATE INDEX IF NOT EXISTS idx_content_pieces_experiment
  ON content_pieces(experiment_id);
