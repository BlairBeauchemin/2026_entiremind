-- Add name column to leads table
-- This supports the waitlist modal which collects name, email, and phone

ALTER TABLE leads ADD COLUMN IF NOT EXISTS name TEXT;

-- Update existing rows to have empty string for consistency
UPDATE leads SET name = '' WHERE name IS NULL;

-- Note: Keeping name nullable for backwards compatibility with existing data
-- and because the landing page form may still work without name in some flows
