import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { sendSms } from "@/lib/sms";

async function requireFounder() {
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

function buildTestimonialRequest(name: string | null): string {
  const greeting = name?.trim() ? `${name.trim()}, your` : "Your";
  return (
    `${greeting} reflections have meant a lot to this early chapter of Entiremind. ` +
    `Would you share one line about what this practice has done for you? ` +
    `If you're happy for us to share it (first name only), just say so in your reply.`
  );
}

/**
 * GET /api/founder/testimonials
 * List all testimonials with user info, newest first.
 */
export async function GET() {
  const auth = await requireFounder();
  if ("error" in auth) {
    const status = auth.error === "Not authenticated" ? 401 : 403;
    return NextResponse.json({ error: auth.error }, { status });
  }

  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select(
      `
      *,
      users:user_id (
        name,
        email
      )
    `,
    )
    .order("requested_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ testimonials: data ?? [] });
}

/**
 * POST /api/founder/testimonials
 *
 * Body variants:
 * - { action: "request", userId } — send the testimonial-ask SMS and open a
 *   'requested' row. Rejected if the user already has a non-dismissed row.
 * - { action: "approve", id, consent: true } — mark approved; the founder must
 *   confirm the user's reply granted permission to publish.
 * - { action: "dismiss", id }
 */
export async function POST(request: Request) {
  const auth = await requireFounder();
  if ("error" in auth) {
    const status = auth.error === "Not authenticated" ? 401 : 403;
    return NextResponse.json({ error: auth.error }, { status });
  }

  let body: {
    action?: unknown;
    userId?: unknown;
    id?: unknown;
    consent?: unknown;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  if (body.action === "request") {
    const userId = typeof body.userId === "string" ? body.userId : null;
    if (!userId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 });
    }

    const { data: existing } = await supabase
      .from("testimonials")
      .select("id, status")
      .eq("user_id", userId)
      .neq("status", "dismissed")
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: `User already has a ${existing.status} testimonial` },
        { status: 409 },
      );
    }

    const { data: targetUser, error: userError } = await supabase
      .from("users")
      .select("name, phone")
      .eq("id", userId)
      .single();

    if (userError || !targetUser?.phone) {
      return NextResponse.json(
        { error: "User not found or has no phone number" },
        { status: 404 },
      );
    }

    const smsResult = await sendSms(
      userId,
      targetUser.phone,
      buildTestimonialRequest(targetUser.name),
      { contentType: "testimonial_request" },
    );

    if (!smsResult.success) {
      return NextResponse.json(
        { error: smsResult.error || "Failed to send SMS" },
        { status: 500 },
      );
    }

    const { error: insertError } = await supabase.from("testimonials").insert({
      user_id: userId,
      request_message_id: smsResult.messageId ?? null,
      status: "requested",
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  if (body.action === "approve" || body.action === "dismiss") {
    const id = typeof body.id === "string" ? body.id : null;
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    if (body.action === "approve" && body.consent !== true) {
      return NextResponse.json(
        { error: "Approval requires confirming the user consented to sharing" },
        { status: 400 },
      );
    }

    const { data: row, error: fetchError } = await supabase
      .from("testimonials")
      .select("id, status")
      .eq("id", id)
      .single();

    if (fetchError || !row) {
      return NextResponse.json(
        { error: "Testimonial not found" },
        { status: 404 },
      );
    }

    const { error: updateError } = await supabase
      .from("testimonials")
      .update({
        status: body.action === "approve" ? "approved" : "dismissed",
        consent: body.action === "approve",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
