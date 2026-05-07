-- Migration: Content Engine - Signal tracking and AI content support
-- Phase 1 of the autonomous content engine

-- ============================================
-- Signal Events: Individual behavioral events
-- ============================================
CREATE TABLE signal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'reply',           -- User replied to an outbound message
    'silence',         -- User did not reply within detection window
    'unprompted',      -- User sent a message without a recent outbound
    'quick_reply',     -- User replied within 5 minutes
    'long_reply',      -- Reply was >100 characters
    'stop_request'     -- User sent STOP keyword
  )),
  message_id UUID REFERENCES messages(id),           -- The inbound message (for reply events)
  outbound_message_id UUID REFERENCES messages(id),  -- The outbound message this responds to
  metadata JSONB DEFAULT '{}',  -- {reply_time_minutes, reply_length, etc.}
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE signal_events ENABLE ROW LEVEL SECURITY;

-- Users can view their own signal events
CREATE POLICY "Users can view own signal events" ON signal_events
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- User Signals: Computed aggregates for AI context
-- ============================================
CREATE TABLE user_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_messages_sent INTEGER DEFAULT 0,
  total_replies INTEGER DEFAULT 0,
  reply_rate DECIMAL(5,2),  -- Percentage 0.00 to 100.00
  avg_reply_time_minutes INTEGER,
  avg_reply_length INTEGER,
  last_reply_at TIMESTAMPTZ,
  last_message_sent_at TIMESTAMPTZ,
  consecutive_silences INTEGER DEFAULT 0,
  engagement_score DECIMAL(5,2) DEFAULT 50.00,  -- 0.00 to 100.00, starts at 50
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_signals ENABLE ROW LEVEL SECURITY;

-- Users can view their own signal aggregates
CREATE POLICY "Users can view own signals" ON user_signals
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- Add tracking columns to messages table
-- ============================================

-- Content type: what kind of message was sent
ALTER TABLE messages ADD COLUMN content_type TEXT CHECK (content_type IN (
  'reflection',   -- Daily reflection prompt
  'quote',        -- Curated quote
  'check-in',     -- Check-in question
  'action',       -- Action prompt
  'gratitude',    -- Gratitude prompt
  'welcome',      -- Welcome message
  'manual'        -- Manually composed
));

-- Whether the message was AI-generated
ALTER TABLE messages ADD COLUMN ai_generated BOOLEAN DEFAULT false;

-- Link inbound messages to the outbound message they're replying to
ALTER TABLE messages ADD COLUMN reply_to_message_id UUID REFERENCES messages(id);

-- ============================================
-- Indexes for efficient queries
-- ============================================
CREATE INDEX idx_signal_events_user ON signal_events(user_id, created_at DESC);
CREATE INDEX idx_signal_events_type ON signal_events(event_type, created_at DESC);
CREATE INDEX idx_user_signals_engagement ON user_signals(engagement_score DESC);
CREATE INDEX idx_messages_user_recent ON messages(user_id, created_at DESC);
CREATE INDEX idx_messages_reply_to ON messages(reply_to_message_id);
CREATE INDEX idx_messages_content_type ON messages(content_type);

-- ============================================
-- Function: Initialize user_signals row for new users
-- ============================================
CREATE OR REPLACE FUNCTION create_user_signals()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_signals (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user_signals when a user is created
CREATE TRIGGER on_user_created_create_signals
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_signals();

-- Backfill user_signals for existing users
INSERT INTO user_signals (user_id)
SELECT id FROM users
ON CONFLICT (user_id) DO NOTHING;
