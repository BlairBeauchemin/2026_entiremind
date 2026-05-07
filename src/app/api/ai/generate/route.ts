import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { generateMessageForUser } from "@/lib/ai";

/**
 * POST /api/ai/generate
 * Generate an AI message for a user (founder-only)
 *
 * Body: { phone: string } - phone number to look up user
 * Returns: { message: string, contentType: string }
 */
export async function POST(request: Request) {
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

  // Parse request body
  const body = await request.json();
  const { phone } = body;

  if (!phone) {
    return NextResponse.json(
      { error: "Phone number is required" },
      { status: 400 }
    );
  }

  // Look up user by phone number
  const serviceSupabase = createServiceRoleClient();
  const { data: targetUser, error: userError } = await serviceSupabase
    .from("users")
    .select("id, name")
    .eq("phone", phone)
    .single();

  if (userError || !targetUser) {
    // If user not found, generate a generic message
    const genericMessage = {
      text: "Good morning. What's one thing you'd like to focus on today?",
      contentType: "reflection",
    };
    return NextResponse.json({
      message: genericMessage.text,
      contentType: genericMessage.contentType,
      note: "User not found - using generic message",
    });
  }

  try {
    // Generate personalized message for this user
    const generated = await generateMessageForUser(targetUser.id);

    return NextResponse.json({
      message: generated.text,
      contentType: generated.contentType,
      userName: targetUser.name,
    });
  } catch (error) {
    console.error("Failed to generate AI message:", error);
    return NextResponse.json(
      { error: "Failed to generate message" },
      { status: 500 }
    );
  }
}
