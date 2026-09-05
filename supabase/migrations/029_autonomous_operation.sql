-- ============================================
-- 029: Autonomous operation
--
-- Removes the founder-approval gates that were never protecting anything, and
-- turns on the message-mode axis that shipped dark in 026.
--
-- The gates that REMAIN are deliberate and are not touched here:
--   * paid ad launches      — unattended ad spend (pipeline/publish.ts)
--   * organic publishing    — brand_channels.publish_mode
--   * weekly email editions — pushed to the provider as a draft, never sent
--   * the user's intention  — see below; this is the important one
--
-- Intention shift detection previously wrote a 'pending' row and waited for the
-- founder to approve, and approving WROTE A NEW INTENTION ON THE USER'S BEHALF.
-- Both halves were wrong. Detection now records 'notified' and texts the *user*
-- a one-time nudge pointing them in-app. Nothing but the user ever writes an
-- intention — not the model, not the founder. This mirrors the rule already
-- stated in src/lib/ai/steer.ts for explicit topic steers.
-- ============================================

-- ============================================
-- Intention shift suggestions: 'notified' is the new terminal state for the
-- detection path. 'pending'/'approved' are kept for historical rows only —
-- nothing writes them any more.
-- ============================================
ALTER TABLE intention_shift_suggestions
  DROP CONSTRAINT IF EXISTS intention_shift_suggestions_status_check;
ALTER TABLE intention_shift_suggestions
  ADD CONSTRAINT intention_shift_suggestions_status_check
  CHECK (status IN ('pending', 'approved', 'dismissed', 'notified'));

-- When the user was texted about a detected shift. NULL for historical rows and
-- for detections where the nudge send failed (best-effort, never blocks memory).
ALTER TABLE intention_shift_suggestions
  ADD COLUMN IF NOT EXISTS notified_at TIMESTAMPTZ;

-- ============================================
-- Messages: the intention-shift nudge is its own content type so it can be kept
-- out of engagement metrics and out of daily-send suppression, exactly like
-- 'billing'. Adds 'intention_nudge' to the 020 list; everything else unchanged.
-- ============================================
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
    'testimonial_request',
    'recap',
    'reconnect',
    'billing',
    'upgrade',
    'intention_nudge'
  ));

-- ============================================
-- Content selection config
-- ============================================

-- Was hardcoded at 0.6 in src/lib/ai/memory.ts. Now that crossing it texts a
-- real person rather than filling a founder queue, it needs to be tunable
-- without a deploy. Raise it if nudges feel premature.
ALTER TABLE content_selection_config
  ADD COLUMN IF NOT EXISTS intention_shift_min_confidence DECIMAL(3,2)
    NOT NULL DEFAULT 0.60;
ALTER TABLE content_selection_config
  DROP CONSTRAINT IF EXISTS content_selection_config_intention_shift_min_confidence_check;
ALTER TABLE content_selection_config
  ADD CONSTRAINT content_selection_config_intention_shift_min_confidence_check
  CHECK (intention_shift_min_confidence >= 0 AND intention_shift_min_confidence <= 1);

-- Turn on the message-mode axis. 026 shipped mirror/callback/attunement fully
-- built but defaulted off pending a founder A/B, so selectMessageMode has been
-- returning 'question' on every send since. Flip the default and the live row.
ALTER TABLE content_selection_config
  ALTER COLUMN feeling_seen_enabled SET DEFAULT true;
UPDATE content_selection_config SET feeling_seen_enabled = true WHERE id = 1;
