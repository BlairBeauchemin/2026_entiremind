-- Migration: Create intentions table for user manifestation goals
-- Run this in your Supabase SQL Editor

CREATE TABLE intentions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE intentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own intentions" ON intentions
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX intentions_user_id_idx ON intentions(user_id);
