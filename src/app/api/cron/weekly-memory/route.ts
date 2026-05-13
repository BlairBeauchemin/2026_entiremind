import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { compactUserMemory } from "@/lib/ai/memory";

/**
 * Weekly Memory Cron: Compact each active user's recent replies into a
 * structured memory blob that the daily-send prompt will inject.
 *
 * Runs Monday morning before daily-send. Sequential, with a small inter-user
 * delay to stay polite with the Anthropic API.
 *
 * Security: Protected by CRON_SECRET header.
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET environment variable not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error("Invalid cron authorization");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY not set");
    return NextResponse.json(
      { error: "AI provider not configured" },
      { status: 500 }
    );
  }

  const supabase = createServiceRoleClient();

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id")
    .eq("status", "active")
    .eq("onboarding_completed", true);

  if (usersError) {
    console.error("Failed to fetch users:", usersError);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }

  if (!users || users.length === 0) {
    return NextResponse.json({
      success: true,
      processed: 0,
      compacted: 0,
      skipped: 0,
      message: "No active onboarded users",
    });
  }

  let compacted = 0;
  let skipped = 0;
  const errors: Array<{ userId: string; error: string }> = [];

  for (const user of users) {
    try {
      const summary = await compactUserMemory(user.id);
      if (summary) {
        compacted++;
        console.log(`Compacted memory for user ${user.id}`);
      } else {
        skipped++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      errors.push({ userId: user.id, error: message });
      console.error(`Memory compaction failed for user ${user.id}:`, err);
    }

    // Be polite to Anthropic — small inter-user delay
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const duration = Date.now() - startTime;
  console.log(
    `Weekly memory complete: ${compacted} compacted, ${skipped} skipped, ${errors.length} errored in ${duration}ms`
  );

  return NextResponse.json({
    success: true,
    processed: users.length,
    compacted,
    skipped,
    errored: errors.length,
    duration_ms: duration,
    errors: errors.length > 0 ? errors : undefined,
  });
}
