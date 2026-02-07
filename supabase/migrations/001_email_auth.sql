-- Migration: Switch from phone-based to email-based auth
-- Run this in your Supabase SQL Editor

-- 1. Alter users table: make phone optional, email required
ALTER TABLE users ALTER COLUMN phone DROP NOT NULL;
ALTER TABLE users ALTER COLUMN email SET NOT NULL;

-- 2. Update the trigger function to use email instead of phone
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
