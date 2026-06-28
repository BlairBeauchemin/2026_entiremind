/**
 * Pure routing decision for the session proxy (middleware).
 *
 * Given the request path and the user's auth/onboarding state, returns the path
 * to redirect to, or null to let the request through. Kept side-effect-free so
 * the auth-gating rules are unit-testable without mocking Next.js or Supabase.
 */
export function resolveRouteRedirect(opts: {
  pathname: string;
  isAuthed: boolean;
  isOnboarded: boolean;
}): string | null {
  const { pathname, isAuthed, isOnboarded } = opts;

  const isProtectedRoute = pathname.startsWith("/dashboard");
  const isOnboardingRoute = pathname.startsWith("/onboarding");
  // The shortened archetype retake flow is for ALREADY-onboarded users, so it
  // must be exempt from the "onboarded → dashboard" bounce below.
  const isArchetypeRoute = pathname.startsWith("/onboarding/archetype");
  const isAuthRoute = pathname.startsWith("/auth");
  const isCallback = pathname.includes("/callback");

  // The OAuth/magic-link callback must always pass through to exchange the code.
  if (isCallback) return null;

  // Unauthenticated users may not access protected or onboarding routes.
  if ((isProtectedRoute || isOnboardingRoute) && !isAuthed) {
    return "/auth";
  }

  if (!isAuthed) return null;

  // Authenticated user on /auth → send home or into onboarding.
  if (isAuthRoute) {
    return isOnboarded ? "/dashboard" : "/onboarding";
  }

  // Not-onboarded user on the dashboard → finish onboarding first.
  if (isProtectedRoute && !isOnboarded) {
    return "/onboarding";
  }

  // Onboarded user on the full onboarding flow → home. The archetype retake
  // flow is excluded so the dashboard banner / persona-card retake can reach it.
  if (isOnboardingRoute && isOnboarded && !isArchetypeRoute) {
    return "/dashboard";
  }

  return null;
}
