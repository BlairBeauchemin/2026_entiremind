import { NextResponse } from "next/server";
import { requireCronAuth } from "@/lib/cron-auth";
import { createServiceRoleClient } from "@/lib/supabase";
import { loadEngineConfig } from "@/lib/marketing/config";
import { publishContentPiece } from "@/lib/marketing/pipeline/publish";

export const maxDuration = 300;

/**
 * Marketing Publish Cron: push scheduled pieces whose time has come —
 * organic posts via platform adapters, ads via the Meta launch chain.
 * The ad review hard-guard lives inside publishContentPiece.
 *
 * Security: Protected by CRON_SECRET header.
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  const authError = requireCronAuth(request);
  if (authError) return authError;

  const config = await loadEngineConfig();
  if (!config.enabled) {
    return NextResponse.json({
      success: true,
      processed: 0,
      message: "Engine disabled",
    });
  }

  const supabase = createServiceRoleClient();
  const { data: due, error: dueError } = await supabase
    .from("content_pieces")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_for", new Date().toISOString())
    .order("scheduled_for", { ascending: true })
    .limit(config.max_publishes_per_run);

  if (dueError) {
    console.error("Failed to fetch scheduled pieces:", dueError);
    return NextResponse.json(
      { error: "Failed to fetch scheduled pieces" },
      { status: 500 },
    );
  }

  let published = 0;
  let failed = 0;
  const errors: Array<{ pieceId: string; error: string }> = [];

  for (const piece of due ?? []) {
    try {
      const result = await publishContentPiece(piece.id);
      if (result.success) {
        published++;
      } else {
        failed++;
        if (result.error)
          errors.push({ pieceId: piece.id, error: result.error });
      }
    } catch (err) {
      failed++;
      errors.push({
        pieceId: piece.id,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const duration = Date.now() - startTime;
  console.log(
    `Marketing publish complete: ${published} published, ${failed} failed in ${duration}ms`,
  );

  return NextResponse.json({
    success: true,
    processed: due?.length ?? 0,
    published,
    failed,
    duration_ms: duration,
    errors: errors.length > 0 ? errors : undefined,
  });
}
