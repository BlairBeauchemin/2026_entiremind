import type { createServiceRoleClient } from "./supabase";

/**
 * Cheap abuse brake for the public, unauthenticated lead-capture endpoints
 * (/api/leads, /api/quiz/lead). Serverless instances can't hold in-memory
 * counters, so the leads table itself is the sliding window: more than
 * LEAD_WRITE_LIMIT rows created in the last LEAD_WRITE_WINDOW_MINUTES means
 * something is flooding us and new writes get a 429. Organic traffic at
 * current scale never approaches this; revisit alongside paid acquisition.
 *
 * Fails open on query error — a broken counter must not block real signups.
 */
export const LEAD_WRITE_WINDOW_MINUTES = 10;
export const LEAD_WRITE_LIMIT = 30;

export async function isLeadWriteThrottled(
  supabase: ReturnType<typeof createServiceRoleClient>,
): Promise<boolean> {
  const windowStart = new Date(
    Date.now() - LEAD_WRITE_WINDOW_MINUTES * 60_000,
  ).toISOString();

  const { count, error } = await supabase
    .from("leads")
    .select("id", { count: "exact", head: true })
    .gte("created_at", windowStart);

  if (error) {
    console.error("Lead throttle check failed (failing open):", error);
    return false;
  }

  return (count ?? 0) >= LEAD_WRITE_LIMIT;
}
