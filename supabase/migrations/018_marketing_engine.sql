-- Migration: Marketing Content & Ads Engine
-- Multi-brand AI content engine for paid ads (Meta-first) and organic social
-- (Instagram, TikTok, YouTube). Ads always require founder approval; organic
-- channels can opt into auto-publish per channel.

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
-- Brands: each project/product is a row, not code
-- ============================================
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  product_summary TEXT NOT NULL DEFAULT '',
  brand_voice TEXT NOT NULL DEFAULT '',
  target_audience TEXT NOT NULL DEFAULT '',
  visual_style TEXT NOT NULL DEFAULT '',
  website_url TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view brands" ON brands
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

GRANT ALL ON brands TO service_role;

INSERT INTO brands (slug, name, description, product_summary, brand_voice, target_audience, visual_style, website_url)
VALUES (
  'entiremind',
  'Entiremind',
  'Lightly magical SMS-based manifestation system',
  'Entiremind is an SMS-first manifestation companion. Users state what they want to manifest and receive one thoughtful daily text that helps them align their thoughts, intentions, and actions. It listens, remembers, and adapts to each reply.',
  'Calm, warm, lightly magical. Inspiring without hype. No hustle-culture language, no productivity theater. Speaks like a trusted guide, not a coach.',
  'Adults interested in manifestation, mindfulness, and intentional living who prefer gentle daily nudges over apps and dashboards.',
  'Soft, dreamy, calm. Dark teal (#204147), soft purple (#cbbbe3), warm yellow (#f9d97a) accents. Minimal, airy compositions with natural light. No busy collages, no loud gradients.',
  'https://www.entiremind.com'
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- Brand channels: one row per brand x platform
-- publish_mode is ignored for meta_ads — paid ads ALWAYS require approval
-- (enforced in application code).
-- ============================================
CREATE TABLE IF NOT EXISTS brand_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('meta_ads', 'instagram', 'tiktok', 'youtube')),
  publish_mode TEXT NOT NULL DEFAULT 'require_approval'
    CHECK (publish_mode IN ('require_approval', 'auto_publish')),
  connected BOOLEAN NOT NULL DEFAULT false,
  external_account_id TEXT,
  credentials JSONB NOT NULL DEFAULT '{}',
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (brand_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_brand_channels_brand ON brand_channels(brand_id);

ALTER TABLE brand_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view brand channels" ON brand_channels
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

CREATE POLICY "Admins can update brand channels" ON brand_channels
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

CREATE TRIGGER update_brand_channels_updated_at
  BEFORE UPDATE ON brand_channels
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

GRANT ALL ON brand_channels TO service_role;

INSERT INTO brand_channels (brand_id, platform)
SELECT b.id, p.platform
FROM brands b
CROSS JOIN (VALUES ('meta_ads'), ('instagram'), ('tiktok'), ('youtube')) AS p(platform)
WHERE b.slug = 'entiremind'
ON CONFLICT (brand_id, platform) DO NOTHING;

-- ============================================
-- Trend snapshots: research inputs for planning
-- ============================================
CREATE TABLE IF NOT EXISTS trend_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('ai_research', 'google_trends', 'tiktok_creative_center', 'manual')),
  summary TEXT NOT NULL,
  insights JSONB NOT NULL DEFAULT '[]',
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_trend_snapshots_brand
  ON trend_snapshots(brand_id, created_at DESC);

ALTER TABLE trend_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view trend snapshots" ON trend_snapshots
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

GRANT ALL ON trend_snapshots TO service_role;

-- ============================================
-- Marketing campaigns
-- ============================================
CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  objective TEXT NOT NULL DEFAULT '',
  campaign_type TEXT NOT NULL DEFAULT 'paid_ads'
    CHECK (campaign_type IN ('paid_ads', 'organic', 'mixed')),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'planning', 'active', 'paused', 'completed', 'archived')),
  brief TEXT,
  strategy JSONB NOT NULL DEFAULT '{}',
  trend_snapshot_id UUID REFERENCES trend_snapshots(id),
  total_budget_cents INTEGER,
  daily_budget_cents INTEGER,
  currency TEXT NOT NULL DEFAULT 'USD',
  targeting JSONB NOT NULL DEFAULT '{}',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  meta_campaign_id TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_brand
  ON marketing_campaigns(brand_id, status);

ALTER TABLE marketing_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view marketing campaigns" ON marketing_campaigns
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

CREATE TRIGGER update_marketing_campaigns_updated_at
  BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

GRANT ALL ON marketing_campaigns TO service_role;

-- ============================================
-- Content pieces: the central workflow row
-- Status lifecycle:
--   draft -> generating -> [awaiting_footage ->] pending_review
--     -> approved/rejected -> scheduled -> publishing
--     -> published (organic) | launched (ad) | failed
-- ============================================
CREATE TABLE IF NOT EXISTS content_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES marketing_campaigns(id) ON DELETE SET NULL,
  target TEXT NOT NULL CHECK (target IN ('ad', 'organic')),
  platform TEXT NOT NULL CHECK (platform IN ('meta_ads', 'instagram', 'tiktok', 'youtube')),
  format TEXT NOT NULL CHECK (format IN ('image_ad', 'video_ad', 'carousel_ad', 'post', 'reel', 'story', 'short')),
  production_mode TEXT NOT NULL DEFAULT 'ai_generated'
    CHECK (production_mode IN ('ai_generated', 'founder_filmed')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'generating',
    'awaiting_footage',
    'pending_review',
    'approved',
    'rejected',
    'scheduled',
    'publishing',
    'published',
    'launched',
    'failed'
  )),
  -- creative fields (all founder-editable pre-publish)
  headline TEXT,
  body_copy TEXT,
  caption TEXT,
  script TEXT,
  image_prompt TEXT,
  cta TEXT,
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  link_url TEXT,
  angle TEXT,
  generation_context JSONB NOT NULL DEFAULT '{}',
  -- ad-only fields
  daily_budget_cents INTEGER,
  targeting JSONB,
  meta_adset_id TEXT,
  meta_ad_id TEXT,
  meta_creative_id TEXT,
  -- review audit
  review_note TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  -- publish
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  external_post_id TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_pieces_brand_status
  ON content_pieces(brand_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_pieces_scheduled
  ON content_pieces(status, scheduled_for);
CREATE INDEX IF NOT EXISTS idx_content_pieces_campaign
  ON content_pieces(campaign_id);

ALTER TABLE content_pieces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view content pieces" ON content_pieces
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

CREATE POLICY "Admins can update content pieces" ON content_pieces
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

CREATE TRIGGER update_content_pieces_updated_at
  BEFORE UPDATE ON content_pieces
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

GRANT ALL ON content_pieces TO service_role;

-- ============================================
-- Media assets: generated or founder-uploaded creative
-- ============================================
CREATE TABLE IF NOT EXISTS media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  content_piece_id UUID REFERENCES content_pieces(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('image', 'video')),
  generator TEXT NOT NULL CHECK (generator IN ('gemini', 'veo', 'manual')),
  model TEXT,
  prompt TEXT NOT NULL DEFAULT '',
  storage_path TEXT,
  public_url TEXT,
  mime_type TEXT,
  width INTEGER,
  height INTEGER,
  duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'generating', 'ready', 'failed')),
  error TEXT,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_assets_piece ON media_assets(content_piece_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_brand
  ON media_assets(brand_id, created_at DESC);

ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view media assets" ON media_assets
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

CREATE TRIGGER update_media_assets_updated_at
  BEFORE UPDATE ON media_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

GRANT ALL ON media_assets TO service_role;

-- ============================================
-- Content metrics: daily performance per published piece
-- ============================================
CREATE TABLE IF NOT EXISTS content_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_piece_id UUID NOT NULL REFERENCES content_pieces(id) ON DELETE CASCADE,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  metric_date DATE NOT NULL,
  impressions BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  spend_cents BIGINT NOT NULL DEFAULT 0,
  conversions BIGINT NOT NULL DEFAULT 0,
  likes BIGINT NOT NULL DEFAULT 0,
  comments BIGINT NOT NULL DEFAULT 0,
  shares BIGINT NOT NULL DEFAULT 0,
  views BIGINT NOT NULL DEFAULT 0,
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (content_piece_id, metric_date)
);

CREATE INDEX IF NOT EXISTS idx_content_metrics_brand
  ON content_metrics(brand_id, metric_date DESC);

ALTER TABLE content_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view content metrics" ON content_metrics
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

GRANT ALL ON content_metrics TO service_role;

-- ============================================
-- Marketing engine config: founder-tunable singleton
-- ============================================
CREATE TABLE IF NOT EXISTS marketing_engine_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled BOOLEAN NOT NULL DEFAULT true,
  weekly_pieces_per_brand INTEGER NOT NULL DEFAULT 7,
  max_generations_per_run INTEGER NOT NULL DEFAULT 5,
  max_publishes_per_run INTEGER NOT NULL DEFAULT 10,
  default_daily_budget_cents INTEGER NOT NULL DEFAULT 2000,
  ads_launch_paused BOOLEAN NOT NULL DEFAULT true,
  video_enabled BOOLEAN NOT NULL DEFAULT false,
  image_provider TEXT NOT NULL DEFAULT 'gemini',
  video_provider TEXT NOT NULL DEFAULT 'veo',
  updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO marketing_engine_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE marketing_engine_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view marketing config" ON marketing_engine_config
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

CREATE POLICY "Admins can update marketing config" ON marketing_engine_config
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

CREATE TRIGGER update_marketing_engine_config_updated_at
  BEFORE UPDATE ON marketing_engine_config
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

GRANT ALL ON marketing_engine_config TO service_role;

-- ============================================
-- Storage: public bucket for generated/uploaded creative.
-- Public because Meta/IG APIs must be able to fetch creative URLs.
-- Writes are service-role only (no INSERT policy for authenticated).
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('marketing-media', 'marketing-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public read marketing media" ON storage.objects;
CREATE POLICY "Public read marketing media" ON storage.objects
  FOR SELECT USING (bucket_id = 'marketing-media');
