-- Migration: Add scheduled_messages table for SMS scheduling
-- Enables scheduling messages for later delivery via cron

-- Create scheduled_messages table
CREATE TABLE scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_phone TEXT NOT NULL,
  text TEXT NOT NULL,
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_message_id UUID REFERENCES messages(id),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient cron queries (find pending messages due for sending)
CREATE INDEX idx_scheduled_messages_pending ON scheduled_messages (scheduled_for)
  WHERE status = 'pending';

-- Index for user's scheduled messages
CREATE INDEX idx_scheduled_messages_user ON scheduled_messages (user_id, scheduled_for DESC);

-- Enable RLS
ALTER TABLE scheduled_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own scheduled messages
CREATE POLICY "Users can view own scheduled messages"
  ON scheduled_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Admins/founders can view all scheduled messages
CREATE POLICY "Admins can view all scheduled messages"
  ON scheduled_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'founder')
    )
  );

-- Policy: Admins/founders can insert scheduled messages
CREATE POLICY "Admins can insert scheduled messages"
  ON scheduled_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'founder')
    )
  );

-- Policy: Admins/founders can update scheduled messages
CREATE POLICY "Admins can update scheduled messages"
  ON scheduled_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role IN ('admin', 'founder')
    )
  );

-- Add updated_at trigger
CREATE TRIGGER update_scheduled_messages_updated_at
  BEFORE UPDATE ON scheduled_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant service role full access (for cron handler)
GRANT ALL ON scheduled_messages TO service_role;
