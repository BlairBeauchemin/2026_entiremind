-- Migration: Technique Playbook — distilled thinking-tools as prompt recipes
-- Internal-only library. The daily-SMS generation engine selects a technique
-- matched to the user's cognitive-distortion profile + current state and
-- injects its recipe into the prompt. Never shown to end users. Founder feeds
-- new techniques via scripts/digest-techniques.ts (draft) and curates in the
-- founder dashboard. Every send is tagged messages.technique_id so per-technique
-- reply rates fall out of the existing signal machinery.

-- ============================================
-- Techniques: curated, targeted prompt recipes
-- ============================================
CREATE TABLE IF NOT EXISTS techniques (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,                          -- house name (e.g. "The Weather Report")
  principle TEXT NOT NULL,                            -- 1-2 sentence distillation, house voice
  prompt_recipe TEXT NOT NULL,                        -- instruction injected into buildUserPrompt
  content_types TEXT[] NOT NULL DEFAULT '{}',         -- subset of reflection/check-in/action/gratitude ('{}' = any)
  target_distortions TEXT[] NOT NULL DEFAULT '{}',    -- subset of the 7 distortions ('{}' = any)
  target_sentiments TEXT[] NOT NULL DEFAULT '{}',     -- subset of positive/neutral/struggling ('{}' = any)
  tone_compatibility TEXT[] NOT NULL DEFAULT '{}',    -- subset of gentle/direct/socratic/celebratory ('{}' = all)
  intention_categories TEXT[] NOT NULL DEFAULT '{}',  -- subset of IntentionCategory ('{}' = all)
  gentle BOOLEAN NOT NULL DEFAULT false,              -- safe for struggling / high-silence users
  priority SMALLINT NOT NULL DEFAULT 0,               -- founder hand-boost added to score (pre-data lever)
  source_title TEXT,                                  -- internal-only lineage
  source_author TEXT,                                 -- internal-only lineage
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'retired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_techniques_active ON techniques(status) WHERE status = 'active';

ALTER TABLE techniques ENABLE ROW LEVEL SECURITY;

-- Internal-only table: admins/founders manage; no end-user policy.
CREATE POLICY "Admins manage techniques" ON techniques
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role IN ('admin', 'founder')
    )
  );

GRANT ALL ON techniques TO service_role;

CREATE TRIGGER update_techniques_updated_at
  BEFORE UPDATE ON techniques
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Messages: which technique a send used (repeat avoidance + signal)
-- ============================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS technique_id UUID REFERENCES techniques(id);

-- ============================================
-- Content selection config: technique knobs (founder-tunable, no deploy)
-- ============================================
ALTER TABLE content_selection_config
  ADD COLUMN IF NOT EXISTS technique_apply_probability DECIMAL(3,2) NOT NULL DEFAULT 0.50
    CHECK (technique_apply_probability >= 0 AND technique_apply_probability <= 1);
ALTER TABLE content_selection_config
  ADD COLUMN IF NOT EXISTS technique_no_repeat_count INTEGER NOT NULL DEFAULT 10;

-- ============================================
-- Seed: 10 starter techniques (active). Distilled ideas in house voice —
-- original wording, house names, no reproduced branded exercises. Source
-- fields are internal lineage only and never surfaced to users.
-- ============================================
INSERT INTO techniques
  (name, principle, prompt_recipe, content_types, target_distortions, target_sentiments, tone_compatibility, gentle, source_title, source_author, status)
VALUES
  (
    'The Weather Report',
    'A heavy thought is passing mental weather, not a fact or a command.',
    'Invite them to notice a worried thought as weather moving through — something they can watch rather than obey. One question that creates a little distance from the thought.',
    '{reflection,check-in}', '{catastrophizing,mind_reading}', '{neutral,struggling}', '{gentle,socratic}', true,
    'Don''t Believe Everything You Think', 'Joseph Nguyen', 'active'
  ),
  (
    'Prototype the Day',
    'You move forward by trying one small reversible step, not by thinking it all through.',
    'Invite them to design one tiny, low-stakes experiment toward their intention today — something to try, not commit to. Ask what small thing they could prototype.',
    '{action,reflection}', '{all_or_nothing,worthiness}', '{positive,neutral}', '{}', false,
    'Designing Your Life', 'Burnett & Evans', 'active'
  ),
  (
    'The Data Point',
    'A stumble is information, not a verdict about who you are.',
    'If they have named a setback, invite them to read it as data — one question about what it taught, not what it proved about them.',
    '{reflection,check-in}', '{all_or_nothing,discounting_positive}', '{neutral,struggling}', '{}', true,
    'Designing Your Life', 'Burnett & Evans', 'active'
  ),
  (
    'Name the Pattern',
    'Self-sabotage is a protective pattern; naming it kindly loosens its grip.',
    'Gently invite them to notice a recurring pattern that gets in their way and name it with curiosity, not judgment. One question, no diagnosis.',
    '{reflection}', '{worthiness,should_statements}', '{neutral,struggling}', '{gentle,socratic}', true,
    'The Mountain Is You', 'Brianna Wiest', 'active'
  ),
  (
    'Already There',
    'Vividly occupying the aligned future primes attention and action toward it.',
    'Invite them to picture the version of themselves already living their intention — one sensory question about what that self notices or does differently today.',
    '{reflection,action}', '{worthiness,catastrophizing}', '{positive,neutral}', '{celebratory,gentle}', false,
    'Neuroscience of Manifestation', NULL, 'active'
  ),
  (
    'Should to Could',
    'Swapping should for could turns an obligation back into a choice.',
    'If they have voiced a "should", invite them to try it as a "could" or a "want to" — one question that hands the choice back to them.',
    '{reflection,check-in}', '{should_statements}', '{neutral,struggling}', '{}', true,
    'Don''t Believe Everything You Think', 'Joseph Nguyen', 'active'
  ),
  (
    'Story vs. Evidence',
    'An assumed thought is a story, not a fact.',
    'If they have assumed what someone thinks or how something will go, gently invite them to separate the story from what they actually know — one soft question, not an interrogation.',
    '{reflection,check-in}', '{mind_reading,catastrophizing}', '{neutral,struggling}', '{socratic,gentle}', true,
    'Don''t Believe Everything You Think', 'Joseph Nguyen', 'active'
  ),
  (
    'Collect the Win',
    'Naming small wins trains attention toward progress.',
    'Invite them to name one small thing that went right or that they handled well — something they might otherwise wave off. One warm question.',
    '{gratitude,reflection}', '{discounting_positive}', '{positive,neutral,struggling}', '{}', true,
    'Neuroscience of Manifestation', NULL, 'active'
  ),
  (
    'Ten and Ten',
    'Zooming out in time shrinks a fear to its real size.',
    'If something feels heavy, invite them to ask whether it will matter in ten days, ten months, ten years — one gentle question of perspective.',
    '{reflection,check-in}', '{catastrophizing}', '{neutral,struggling}', '{}', true,
    'Perspective-taking', NULL, 'active'
  ),
  (
    'Yours to Move',
    'Separate what is yours to own from what is not, without self-blame.',
    'If they are carrying blame for something outside their control, gently invite them to find the one small part that is actually theirs to move — and set down the rest.',
    '{reflection,check-in}', '{personalization}', '{neutral,struggling}', '{gentle}', true,
    'The Mountain Is You', 'Brianna Wiest', 'active'
  )
ON CONFLICT (name) DO NOTHING;
