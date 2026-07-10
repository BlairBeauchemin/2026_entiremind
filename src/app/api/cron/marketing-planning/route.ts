import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { loadEngineConfig } from "@/lib/marketing/config";
import { runTrendResearch } from "@/lib/marketing/trends";
import { planBrandContent } from "@/lib/marketing/pipeline/plan";

export const maxDuration = 300;

/**
 * Marketing Planning Cron (weekly, Monday): for each active brand, run
 * trend research and plan the coming week's content. Draft pieces drain
 * through the daily marketing-generate cron across the week.
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

  const supabase = createServiceRoleClient();
  const { data: brands, error: brandsError } = await supabase
    .from("brands")
    .select("id, name")
    .eq("status", "active");

  if (brandsError) {
    console.error("Failed to fetch brands:", brandsError);
    return NextResponse.json({ error: "Failed to fetch brands" }, { status: 500 });
  }

  let planned = 0;
  let failed = 0;
  const errors: Array<{ brandId: string; error: string }> = [];

  for (const brand of brands ?? []) {
    try {
      const research = await runTrendResearch(brand.id);
      if (!research.success) {
        console.error(`Trend research failed for ${brand.name}: ${research.error}`);
      }

      const plan = await planBrandContent(brand.id, {
        count: config.weekly_pieces_per_brand,
      });
      if (plan.success) {
        planned++;
      } else {
        failed++;
        if (plan.error) errors.push({ brandId: brand.id, error: plan.error });
      }
    } catch (err) {
      failed++;
      errors.push({
        brandId: brand.id,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  const duration = Date.now() - startTime;
  console.log(
    `Marketing planning complete: ${planned} brands planned, ${failed} failed in ${duration}ms`,
  );

  return NextResponse.json({
    success: true,
    processed: brands?.length ?? 0,
    planned,
    failed,
    duration_ms: duration,
    errors: errors.length > 0 ? errors : undefined,
  });
}
