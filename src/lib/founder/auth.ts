import { createClient } from "@/lib/supabase/server";

/**
 * Founder/admin gate for API routes. Authenticates with the cookie-based
 * client and checks the users.role column (which migration 017 locks against
 * self-escalation).
 */
export async function requireFounder(): Promise<
  { userId: string } | { error: "Not authenticated" | "Forbidden" }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" as const };

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "founder"].includes(profile.role ?? "")) {
    return { error: "Forbidden" as const };
  }
  return { userId: user.id };
}

/** Map a requireFounder error to its HTTP status. */
export function founderErrorStatus(
  error: "Not authenticated" | "Forbidden",
): number {
  return error === "Not authenticated" ? 401 : 403;
}
