-- Migration: Create messages table for SMS communication
-- Run this in your Supabase SQL Editor

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  from_number TEXT NOT NULL,
  to_number TEXT NOT NULL,
  text TEXT NOT NULL,
  telnyx_message_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'received')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view their own messages
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() = user_id);

-- Service role can insert messages (for webhooks and server-side operations)
-- Note: Service role bypasses RLS, so no explicit insert policy needed for server operations

-- Indexes for efficient queries
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_telnyx_id ON messages(telnyx_message_id);
CREATE INDEX idx_messages_from_number ON messages(from_number);
