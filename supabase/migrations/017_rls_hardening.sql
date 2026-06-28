-- ============================================
-- 017: RLS / grant hardening (security review remediation)
--
-- Fixes found during the 2026-06-28 security audit:
--   HIGH    — any authenticated user could self-escalate users.role to
--             'founder' via the Data API: the "Users can update own profile"
--             UPDATE policy had no WITH CHECK and `authenticated` held a
--             table-level UPDATE grant covering the `role` column. Promotion
--             unlocked is_admin() and every "Admins can view all ..." policy,
--             exposing all users' PII.
--   MEDIUM  — user_profiles "Users can update own profile" lacked WITH CHECK,
--             letting a user reassign their row's user_id to another (profile-
--             less) user and plant arbitrary persona data.
--   LOW     — onboarding_responses "Users can update own onboarding" had the
--             same missing-WITH-CHECK reassignment gap.
--   HARDEN  — pin search_path on SECURITY DEFINER / trigger functions.
-- ============================================

-- 1) Lock the privileged `role` column.
--    Column-level REVOKE is a no-op while a table-level UPDATE grant exists, so
--    drop the table-level grant and re-grant every column EXCEPT role. The app
--    never updates role via the user client, so no flow breaks.
REVOKE UPDATE ON public.users FROM authenticated;
GRANT UPDATE (
  id, phone, email, name, timezone, status, onboarding_completed,
  created_at, updated_at, preferences, focus_areas, preferred_send_hour,
  archetype_banner_dismissed_at
) ON public.users TO authenticated;

-- anon never legitimately writes users (RLS already blocks it); drop the grants.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.users FROM anon;

-- 2) Add WITH CHECK to the self-update policies so the owning id/user_id of a row
--    can never be reassigned to another account.
ALTER POLICY "Users can update own profile" ON public.users
  WITH CHECK (auth.uid() = id);

ALTER POLICY "Users can update own profile" ON public.user_profiles
  WITH CHECK (auth.uid() = user_id);

ALTER POLICY "Users can update own onboarding" ON public.onboarding_responses
  WITH CHECK (auth.uid() = user_id);

-- 3) Pin a non-mutable search_path on the flagged definer/trigger functions
--    (advisor 0011, function_search_path_mutable). pg_catalog first prevents
--    operator/function hijacking; public lets them still resolve app tables.
ALTER FUNCTION public.is_admin() SET search_path = pg_catalog, public;
ALTER FUNCTION public.handle_new_user() SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_updated_at_column() SET search_path = pg_catalog, public;
ALTER FUNCTION public.update_subscriptions_updated_at() SET search_path = pg_catalog, public;
