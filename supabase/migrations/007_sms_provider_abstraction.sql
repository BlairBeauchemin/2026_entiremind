-- Migration: SMS provider abstraction
-- Supports multiple SMS providers (Telnyx, Twilio) with a common schema

-- Rename telnyx_message_id to external_message_id for provider-agnostic naming
ALTER TABLE messages RENAME COLUMN telnyx_message_id TO external_message_id;

-- Add provider column to track which SMS provider sent/received the message
ALTER TABLE messages ADD COLUMN provider TEXT DEFAULT 'telnyx' CHECK (provider IN ('telnyx', 'twilio'));

-- Update existing messages to explicitly set provider as telnyx
UPDATE messages SET provider = 'telnyx' WHERE provider IS NULL;

-- Make provider NOT NULL after backfill
ALTER TABLE messages ALTER COLUMN provider SET NOT NULL;

-- Drop old index and create new one with updated name
DROP INDEX IF EXISTS idx_messages_telnyx_id;
CREATE INDEX idx_messages_external_id ON messages(external_message_id);

-- Add composite index for provider + external_message_id for efficient lookups
CREATE INDEX idx_messages_provider_external_id ON messages(provider, external_message_id);
