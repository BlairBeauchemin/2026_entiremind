import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isProtectedRoute = pathname.startsWith("/dashboard");
  const isOnboardingRoute = pathname.startsWith("/onboarding");
  const isAuthRoute = pathname.startsWith("/auth");

  // Unauthenticated users trying to access protected routes → redirect to /auth
  if ((isProtectedRoute || isOnboardingRoute) && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    return NextResponse.redirect(url);
  }

  // For authenticated users, check onboarding status
  if (user && (isProtectedRoute || isOnboardingRoute || isAuthRoute)) {
    // Skip callback route
    if (pathname.includes("/callback")) {
      return supabaseResponse;
    }

    // Fetch user profile to check onboarding status
    const { data: profile } = await supabase
      .from("users")
      .select("onboarding_completed")
      .eq("id", user.id)
      .single();

    const isOnboarded = profile?.onboarding_completed ?? false;

    // Authenticated user on /auth → redirect based on onboarding status
    if (isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = isOnboarded ? "/dashboard" : "/onboarding";
      return NextResponse.redirect(url);
    }

    // User on /dashboard but not onboarded → redirect to /onboarding
    if (isProtectedRoute && !isOnboarded) {
      const url = request.nextUrl.clone();
      url.pathname = "/onboarding";
      return NextResponse.redirect(url);
    }

    // User on /onboarding but already onboarded → redirect to /dashboard
    if (isOnboardingRoute && isOnboarded) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
