import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase";

/**
 * GET /api/users
 * Get all users with phone numbers (founder-only)
 *
 * Returns: { users: Array<{id, name, phone, email}> }
 */
export async function GET() {
  // Check authentication
  const supabase = await createClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if user is admin/founder
  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();

  if (!["admin", "founder"].includes(userProfile?.role ?? "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fetch all users with phone numbers
  const serviceSupabase = createServiceRoleClient();
  const { data: users, error } = await serviceSupabase
    .from("users")
    .select("id, name, phone, email")
    .not("phone", "is", null)
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }

  return NextResponse.json({ users: users || [] });
}
