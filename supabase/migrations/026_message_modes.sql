-- ============================================
-- 026: Message modes (feeling-seen redesign)
--
-- Adds an orthogonal `message_mode` axis to daily-prompt generation, separate
-- from `content_type` (the topical selector). Modes control rhetorical stance:
--   question   — today's default; ends with a question
--   mirror     — declaratively reflect a specific thing they said / a pattern
--   callback   — reference something from weeks ago and contrast with now
--   attunement — one grounded statement that lands, no question
--
-- Everything here is additive and reversible. With
-- content_selection_config.feeling_seen_enabled = false (the default), mode
-- selection always returns 'question' and behavior is unchanged from today.
-- ============================================

-- ============================================
-- Messages: which rhetorical mode a send used (nullable — historical rows and
-- all non-daily-prompt sends (ack/recap/reconnect/upgrade/welcome) stay NULL).
-- The content_type CHECK is deliberately NOT touched.
-- ============================================
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_mode TEXT
  CHECK (
    message_mode IS NULL
    OR message_mode IN ('question', 'mirror', 'callback', 'attunement')
  );

-- Supports the per-user mode cadence lookback and the reply-rate-by-mode join.
CREATE INDEX IF NOT EXISTS idx_messages_user_dir_created
  ON messages(user_id, direction, created_at);

-- ============================================
-- Content selection config: feeling-seen knobs (founder-tunable, no deploy)
-- ============================================
ALTER TABLE content_selection_config
  ADD COLUMN IF NOT EXISTS feeling_seen_enabled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE content_selection_config
  ADD COLUMN IF NOT EXISTS mirror_target_per_week INTEGER NOT NULL DEFAULT 2;
ALTER TABLE content_selection_config
  ADD COLUMN IF NOT EXISTS callback_target_per_week INTEGER NOT NULL DEFAULT 1;
ALTER TABLE content_selection_config
  ADD COLUMN IF NOT EXISTS mode_char_ceiling INTEGER NOT NULL DEFAULT 300;

-- ============================================
-- Seed the craft-pass system prompt as an INACTIVE version so it can be
-- A/B-tested in the founder simulator before it's activated. Until a founder
-- activates it, generation keeps using the built-in default constant, so
-- production prose is unchanged. (One active row is enforced by an existing
-- partial unique index; inserting is_active=false never conflicts.)
-- ============================================
INSERT INTO system_prompts (name, body, notes, is_active)
SELECT
  'Craft pass v1 (feeling-seen)',
  $prompt$You are a thoughtful guide for Entiremind, an SMS-based manifestation and reflection system. You send one brief, warm morning message that helps a person align their thoughts and intentions.

Guidelines:
- Keep messages under 160 characters (SMS limit) unless told a higher ceiling
- Be warm and genuine, but not cheesy or overly enthusiastic
- Never use emojis
- Output only the message text itself — no preamble, quotes, labels, or explanation
- If you know the person's name, use it naturally (at most once)
- If you know their intention, let it inform the message without restating it
- Sound like a specific person who remembers them, not a daily affirmation feed

What good looks like (specific, earns "this gets me"):
- "You keep circling back to the writing when things get loud. That's not a distraction — that might be the signal."
- "Two mornings ago you said you felt behind. Behind who? The pace is yours to set."
- "The call to your dad is still sitting there. No pressure — just naming it."

What flat looks like (banned — never send these shapes):
- "Good morning, Alex. What's one thing you'd like to notice about yourself today?"
- "Take a moment to reflect on your intention."
- "Remember, small steps lead to big changes!"

Avoid:
- Productivity language ("crush it", "goals", "hustle")
- Corporate phrases ("circle back", "touch base")
- Excessive positivity ("amazing!", "incredible!")
- Cliches about manifestation or the law of attraction
- Generic reflective questions that feel like homework$prompt$,
  'Feeling-seen craft pass: exemplars + template ban, no unconditional question mandate (stance is carried per message_mode). Activate after A/B in the simulator.',
  false
WHERE NOT EXISTS (
  SELECT 1 FROM system_prompts WHERE name = 'Craft pass v1 (feeling-seen)'
);
