import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { requireCronAuth } from "@/lib/cron-auth";
import {
  enrichInboundReply,
  loadKnownPatterns,
  persistEnrichment,
} from "@/lib/ai/enrich";

/**
 * Reconcile-Enrichment Cron: re-enrich any recent inbound reply that was left
 * with fully-null insights, or with the deterministic fallback (enriched:false)
 * because the live enrich call failed. This is the safety net that guarantees no
 * reply is ever permanently lost from the learning loop, even if the webhook's
 * background job was killed mid-run.
 *
 * NOT YET WIRED INTO vercel.json — the current Vercel plan's cron-slot limit is
 * full. Add a schedule entry (suggested: "0 8 * * *", i.e. ~1 AM Pacific, after
 * the day's inbound traffic) once a slot frees up. Until then it is manually
 * triggerable (it backfills the existing gaps in one run):
 *
 *   curl -H "Authorization: Bearer $CRON_SECRET" \
 *     https://www.entiremind.com/api/cron/reconcile-enrichment
 *
 * Security: Protected by CRON_SECRET header.
 */

// How far back to look for un-enriched replies, and how many to process per run.
const RECONCILE_LOOKBACK_DAYS = 14;
const RECONCILE_MAX_PER_RUN = 100;

export const maxDuration = 60;

interface UnenrichedRow {
  id: string;
  user_id: string;
  text: string | null;
}

export async function GET(request: Request) {
  const startTime = Date.now();

  const authError = requireCronAuth(request);
  if (authError) return authError;

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("ANTHROPIC_API_KEY environment variable not set");
    return NextResponse.json(
      { error: "AI provider not configured" },
      { status: 500 },
    );
  }

  const supabase = createServiceRoleClient();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RECONCILE_LOOKBACK_DAYS);

  const { data, error } = await supabase
    .from("messages")
    .select("id, user_id, text")
    .eq("direction", "inbound")
    .gte("created_at", cutoff.toISOString())
    .or("insights.is.null,insights->>enriched.eq.false")
    .not("user_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(RECONCILE_MAX_PER_RUN);

  if (error) {
    console.error("Failed to fetch un-enriched messages:", error);
    return NextResponse.json(
      { error: "Failed to fetch messages" },
      { status: 500 },
    );
  }

  const rows = (data as UnenrichedRow[]) ?? [];
  if (rows.length === 0) {
    return NextResponse.json({
      success: true,
      candidates: 0,
      reconciled: 0,
      stillFailed: 0,
      message: "No un-enriched replies in window",
    });
  }

  let reconciled = 0;
  let stillFailed = 0;

  for (const row of rows) {
    const text = (row.text ?? "").trim();
    if (!text) {
      continue;
    }
    try {
      const knownPatterns = await loadKnownPatterns(supabase, row.user_id);
      const enrichment = await enrichInboundReply(text, knownPatterns);
      if (enrichment) {
        await persistEnrichment(supabase, {
          userId: row.user_id,
          inboundMessageId: row.id,
          enrichment,
        });
        reconciled++;
      } else {
        // Leave the fallback insights in place; a future run retries it.
        stillFailed++;
      }
    } catch (err) {
      stillFailed++;
      console.error(`Reconcile failed for message ${row.id}:`, err);
    }
    // Be polite to the Anthropic API between calls.
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  const duration = Date.now() - startTime;
  console.log(
    `Reconcile-enrichment complete: ${reconciled} reconciled, ${stillFailed} still failed of ${rows.length} candidates in ${duration}ms`,
  );

  return NextResponse.json({
    success: true,
    candidates: rows.length,
    reconciled,
    stillFailed,
    duration_ms: duration,
  });
}
