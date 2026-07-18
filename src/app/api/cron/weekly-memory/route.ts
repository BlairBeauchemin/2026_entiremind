import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireCronAuth } from "@/lib/cron-auth";
import { getAiProvider } from "@/lib/ai";
import { compactUserMemory } from "@/lib/ai/memory";
import { loadEntitlement } from "@/lib/billing/entitlement";

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

  const authError = requireCronAuth(request);
  if (authError) return authError;

  const aiProvider = getAiProvider();
  const apiKeyEnvVar =
    aiProvider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
  if (!process.env[apiKeyEnvVar]) {
    console.error(`${apiKeyEnvVar} environment variable not set`);
    return NextResponse.json(
      { error: `AI provider (${aiProvider}) not configured` },
      { status: 500 },
    );
  }

  const supabase = createServiceRoleClient();

  // Exclude simulator test personas — the simulator compacts their memory
  // itself with a simulated-week reference time; the Monday cron would
  // double-compact with a real-now window.
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id")
    .eq("status", "active")
    .eq("onboarding_completed", true)
    .eq("is_test", false);

  if (usersError) {
    console.error("Failed to fetch users:", usersError);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
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
      // Expired-trial users are out of the daily loop — compacting their
      // memory (and staging recaps they'd never receive) wastes Sonnet spend.
      // Their memory resumes updating the week after they upgrade.
      const { entitlement } = await loadEntitlement(user.id);
      if (entitlement === "expired") {
        skipped++;
        continue;
      }

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
    `Weekly memory complete: ${compacted} compacted, ${skipped} skipped, ${errors.length} errored in ${duration}ms`,
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
