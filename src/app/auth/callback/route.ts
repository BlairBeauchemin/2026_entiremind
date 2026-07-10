import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Only allow same-site relative paths as post-auth destinations. Anything
 * else ("//evil.com", absolute URLs, backslash tricks) is an open-redirect
 * vector and falls back to the default.
 */
function sanitizeNextPath(next: string | null): string {
  if (
    next &&
    next.startsWith("/") &&
    !next.startsWith("//") &&
    !next.includes("\\")
  ) {
    return next;
  }
  return "/onboarding";
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = sanitizeNextPath(searchParams.get("next"));

  const supabase = await createClient();
  let error = null;

  // Handle PKCE flow (code parameter)
  if (code) {
    const result = await supabase.auth.exchangeCodeForSession(code);
    error = result.error;
  }
  // Handle magic link / email OTP flow (token_hash parameter)
  else if (tokenHash && type) {
    const result = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as "email" | "magiclink",
    });
    error = result.error;
  }

  if (!error) {
    const forwardedHost = request.headers.get("x-forwarded-host");
    const isLocalEnv = process.env.NODE_ENV === "development";

    if (isLocalEnv) {
      return NextResponse.redirect(`${origin}${next}`);
    } else if (forwardedHost) {
      return NextResponse.redirect(`https://${forwardedHost}${next}`);
    } else {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${origin}/auth?error=auth_callback_error`);
}
