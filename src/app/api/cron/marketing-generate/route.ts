import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { loadEngineConfig } from "@/lib/marketing/config";
import {
  generateContentPiece,
  reapStaleGenerating,
} from "@/lib/marketing/pipeline/generate";

export const maxDuration = 300;

/**
 * Marketing Generate Cron: drain draft content pieces through AI copy +
 * image generation, up to max_generations_per_run per day. Pieces stuck in
 * 'generating' from a timed-out run are reset first.
 *
 * Security: Protected by CRON_SECRET header.
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET environment variable not set");
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error("Invalid cron authorization");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const config = await loadEngineConfig();
  if (!config.enabled) {
    return NextResponse.json({ success: true, processed: 0, message: "Engine disabled" });
  }

  const reaped = await reapStaleGenerating();

  const supabase = createServiceRoleClient();
  const { data: drafts, error: draftsError } = await supabase
    .from("content_pieces")
    .select("id")
    .eq("status", "draft")
    .order("created_at", { ascending: true })
    .limit(config.max_generations_per_run);

  if (draftsError) {
    console.error("Failed to fetch draft pieces:", draftsError);
    return NextResponse.json({ error: "Failed to fetch drafts" }, { status: 500 });
  }

  let generated = 0;
  let failed = 0;
  const errors: Array<{ pieceId: string; error: string }> = [];

  for (const draft of drafts ?? []) {
    try {
      const result = await generateContentPiece(draft.id);
      if (result.success) {
        generated++;
      } else {
        failed++;
        if (result.error) errors.push({ pieceId: draft.id, error: result.error });
      }
    } catch (err) {
      failed++;
      errors.push({
        pieceId: draft.id,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }

    // Small inter-piece delay to stay polite with AI providers
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  const duration = Date.now() - startTime;
  console.log(
    `Marketing generate complete: ${generated} generated, ${failed} failed, ${reaped} reaped in ${duration}ms`,
  );

  return NextResponse.json({
    success: true,
    processed: drafts?.length ?? 0,
    generated,
    failed,
    reaped,
    duration_ms: duration,
    errors: errors.length > 0 ? errors : undefined,
  });
}
