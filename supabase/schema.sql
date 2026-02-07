-- Entiremind Database Schema
-- Run this in your Supabase SQL Editor

-- ===================
-- Phase 1: Leads Table (Pretotype)
-- ===================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  source TEXT DEFAULT 'landing_page',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can insert (for API routes)
CREATE POLICY "Service role can insert leads" ON leads
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Service role can read leads (for admin/founder review)
CREATE POLICY "Service role can read leads" ON leads
  FOR SELECT
  TO service_role
  USING (true);

-- ===================
-- Phase 2: Users Table
-- ===================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  phone TEXT UNIQUE,
  name TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT
  USING (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Policy: Service role can manage all users
CREATE POLICY "Service role can manage users" ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user profile on auth signup (email-based)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===================
-- Phase 2+ Tables (for later)
-- ===================

-- Messages table (uncomment when ready)
-- CREATE TABLE IF NOT EXISTS messages (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   user_id UUID REFERENCES users(id) ON DELETE CASCADE,
--   direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
--   body TEXT NOT NULL,
--   prompt_id UUID,
--   twilio_sid TEXT,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );

-- Prompts table (uncomment when ready)
-- CREATE TABLE IF NOT EXISTS prompts (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   content TEXT NOT NULL,
--   type TEXT CHECK (type IN ('welcome', 'intention', 'reflection', 'nudge')),
--   active BOOLEAN DEFAULT true,
--   created_at TIMESTAMPTZ DEFAULT NOW()
-- );
