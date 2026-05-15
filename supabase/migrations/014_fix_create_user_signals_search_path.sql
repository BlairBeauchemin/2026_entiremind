-- Migration: Fix create_user_signals() so it works during Supabase Auth signup
--
-- Bug: handle_new_user() fires on auth.users INSERT and writes to public.users,
-- which fires on_user_created_create_signals -> create_user_signals(). The
-- original function used an unqualified `INSERT INTO user_signals`, and the
-- search_path of the GoTrue-internal session that runs the signup transaction
-- does not include `public`, so it failed with
--   relation "user_signals" does not exist (SQLSTATE 42P01)
-- which surfaced to OAuth clients as "Database error saving new user".
--
-- Fix: schema-qualify the insert and pin the function's search_path. Matches
-- the convention already used by handle_new_user().

CREATE OR REPLACE FUNCTION public.create_user_signals()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
BEGIN
  INSERT INTO public.user_signals (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$function$;
