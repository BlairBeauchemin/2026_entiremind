-- ============================================
-- 018: Weekly recap + silence recovery arc
--
-- Feature 1 (weekly recap): the Monday memory-compaction pass also writes a
-- short SMS-ready recap referencing the user's week. It's staged on
-- user_memory and delivered by the daily-send cron in place of that
-- morning's prompt, then cleared.
--
-- Feature 2 (silence recovery): when a user hits N consecutive silences the
-- daily-send cron sends a reconnect message instead of a prompt; if silence
-- continues to a higher threshold it sends a farewell and pauses messaging.
-- Thresholds are founder-tunable via content_selection_config.
-- ============================================

-- 1) Stage the pending recap on user_memory (written Monday ~4-5 AM Pacific
--    by weekly-memory, consumed ~7:45 AM Pacific by daily-send).
ALTER TABLE user_memory ADD COLUMN IF NOT EXISTS pending_recap TEXT;
ALTER TABLE user_memory ADD COLUMN IF NOT EXISTS recap_generated_at TIMESTAMPTZ;

-- 2) New outbound content types: 'recap' (weekly reflection recap) and
--    'reconnect' (silence-recovery messages, including the pause farewell).
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
    'ack',
    'recap',
    'reconnect'
  ));

-- 3) Founder-tunable silence-recovery thresholds.
--    reconnect_after_silences: consecutive silences before the reconnect nudge.
--    pause_after_silences: consecutive silences before auto-pause + farewell.
ALTER TABLE content_selection_config
  ADD COLUMN IF NOT EXISTS reconnect_after_silences INTEGER DEFAULT 5
    CHECK (reconnect_after_silences > 0);
ALTER TABLE content_selection_config
  ADD COLUMN IF NOT EXISTS pause_after_silences INTEGER DEFAULT 9
    CHECK (pause_after_silences > 0);
