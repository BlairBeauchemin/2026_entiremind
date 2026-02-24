-- Add SMS consent tracking columns to leads table
-- Required for TCPA compliance and Twilio A2P 10DLC audit trail

ALTER TABLE leads ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sms_consent_timestamp TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sms_consent_ip TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sms_consent_language TEXT;

-- Index for consent audit queries
CREATE INDEX IF NOT EXISTS idx_leads_sms_consent ON leads(sms_consent);
