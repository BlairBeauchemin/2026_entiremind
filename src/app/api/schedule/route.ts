import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase";

/**
 * Schedule API: Founder-only endpoints for scheduling SMS messages
 *
 * POST: Schedule a new message
 * GET: List all scheduled messages
 */

// Helper to check admin/founder role
async function checkAdminRole() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    return { authorized: false, userId: null, error: "Not authenticated" };
  }

  // Fetch user profile with role from database
  const { data: userProfile } = await supabase
    .from("users")
    .select("role, phone")
    .eq("id", authUser.id)
    .single();

  const isAdmin = ["admin", "founder"].includes(userProfile?.role ?? "");

  if (!isAdmin) {
    return { authorized: false, userId: authUser.id, error: "Forbidden" };
  }

  return {
    authorized: true,
    userId: authUser.id,
    phone: userProfile?.phone,
    error: null,
  };
}

/**
 * POST /api/schedule
 * Schedule a new SMS message
 *
 * Body:
 * - text: string (required) - Message content
 * - scheduledFor: string (required) - ISO 8601 timestamp
 * - toPhone: string (optional) - Recipient phone. Defaults to founder's phone.
 * - userId: string (optional) - Target user ID. Defaults to authenticated user.
 */
export async function POST(request: Request) {
  const auth = await checkAdminRole();

  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.error === "Not authenticated" ? 401 : 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { text, scheduledFor, toPhone, userId } = body;

  // Validate required fields
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return NextResponse.json(
      { error: "text is required and must be a non-empty string" },
      { status: 400 }
    );
  }

  if (!scheduledFor || typeof scheduledFor !== "string") {
    return NextResponse.json(
      { error: "scheduledFor is required and must be an ISO 8601 timestamp" },
      { status: 400 }
    );
  }

  // Validate scheduledFor is a valid date
  const scheduledDate = new Date(scheduledFor);
  if (isNaN(scheduledDate.getTime())) {
    return NextResponse.json(
      { error: "scheduledFor must be a valid ISO 8601 timestamp" },
      { status: 400 }
    );
  }

  // Determine target phone number
  const targetPhone = toPhone || auth.phone;
  if (!targetPhone) {
    return NextResponse.json(
      {
        error:
          "toPhone is required (or founder must have phone number set in profile)",
      },
      { status: 400 }
    );
  }

  // Determine target user ID
  const targetUserId = userId || auth.userId;

  const supabase = createServiceRoleClient();

  const { data: scheduledMessage, error: insertError } = await supabase
    .from("scheduled_messages")
    .insert({
      user_id: targetUserId,
      to_phone: targetPhone,
      text: text.trim(),
      scheduled_for: scheduledDate.toISOString(),
      status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    console.error("Failed to schedule message:", insertError);
    return NextResponse.json(
      { error: "Failed to schedule message" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    scheduledMessage,
  });
}

/**
 * GET /api/schedule
 * List all scheduled messages
 *
 * Query params:
 * - status: 'pending' | 'sent' | 'failed' | 'cancelled' (optional)
 * - limit: number (optional, default 50)
 */
export async function GET(request: Request) {
  const auth = await checkAdminRole();

  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.error === "Not authenticated" ? 401 : 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

  const supabase = createServiceRoleClient();

  let query = supabase
    .from("scheduled_messages")
    .select(
      `
      *,
      users:user_id (
        name,
        email,
        phone
      )
    `
    )
    .order("scheduled_for", { ascending: false })
    .limit(limit);

  if (status) {
    query = query.eq("status", status);
  }

  const { data: scheduledMessages, error: fetchError } = await query;

  if (fetchError) {
    console.error("Failed to fetch scheduled messages:", fetchError);
    return NextResponse.json(
      { error: "Failed to fetch scheduled messages" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    scheduledMessages,
  });
}

/**
 * PATCH /api/schedule
 * Cancel a scheduled message
 *
 * Body:
 * - id: string (required) - Scheduled message ID to cancel
 */
export async function PATCH(request: Request) {
  const auth = await checkAdminRole();

  if (!auth.authorized) {
    return NextResponse.json(
      { error: auth.error },
      { status: auth.error === "Not authenticated" ? 401 : 403 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id } = body;

  if (!id || typeof id !== "string") {
    return NextResponse.json(
      { error: "id is required and must be a string" },
      { status: 400 }
    );
  }

  const supabase = createServiceRoleClient();

  // Only allow cancelling pending messages
  const { data: existing } = await supabase
    .from("scheduled_messages")
    .select("status")
    .eq("id", id)
    .single();

  if (!existing) {
    return NextResponse.json(
      { error: "Scheduled message not found" },
      { status: 404 }
    );
  }

  if (existing.status !== "pending") {
    return NextResponse.json(
      { error: `Cannot cancel message with status: ${existing.status}` },
      { status: 400 }
    );
  }

  const { data: updated, error: updateError } = await supabase
    .from("scheduled_messages")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError) {
    console.error("Failed to cancel message:", updateError);
    return NextResponse.json(
      { error: "Failed to cancel message" },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    scheduledMessage: updated,
  });
}
