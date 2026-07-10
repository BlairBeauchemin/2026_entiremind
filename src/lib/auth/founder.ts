import { createClient } from "@/lib/supabase/server";

export type FounderAuthResult =
  | { error: "Not authenticated" | "Forbidden" }
  | { userId: string };

/**
 * Verify the request comes from an authenticated admin/founder.
 * Auth + role check runs on the cookie-scoped client; callers then use
 * createServiceRoleClient() for privileged data access.
 */
export async function requireFounder(): Promise<FounderAuthResult> {
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

/** Map a failed FounderAuthResult to its HTTP status. */
export function founderErrorStatus(error: "Not authenticated" | "Forbidden"): number {
  return error === "Not authenticated" ? 401 : 403;
}
