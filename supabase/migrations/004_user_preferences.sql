-- Add preferences and focus areas columns to users table
-- Run this migration in your Supabase SQL Editor

-- Add preferences column (JSONB for message frequency, preferred time, etc.)
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Add focus areas column (TEXT array for multi-select focus areas)
ALTER TABLE users ADD COLUMN IF NOT EXISTS focus_areas TEXT[] DEFAULT '{}';

-- Update the handle_new_user function to extract name from OAuth metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    -- Extract name from OAuth provider metadata (Google provides 'full_name')
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      NULL
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate trigger (it already exists, just updating the function is sufficient)
-- But we'll recreate it to ensure it uses the updated function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
