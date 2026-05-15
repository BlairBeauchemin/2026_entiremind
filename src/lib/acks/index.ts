import { createServiceRoleClient } from "../supabase";
import type { SoftAck } from "./types";

export type { SoftAck } from "./types";

const RECENT_ACK_EXCLUSION_COUNT = 5;

/**
 * Pick a soft acknowledgement phrase for the given user.
 * Excludes the user's last N soft-ack texts to avoid repetition.
 * Falls back to a hardcoded phrase if the library is empty or the query fails.
 */
export async function pickSoftAck(userId: string): Promise<string> {
  const supabase = createServiceRoleClient();

  const { data: library } = await supabase
    .from("soft_acks")
    .select("id, text, active")
    .eq("active", true);

  if (!library || library.length === 0) {
    return "Got that.";
  }

  const { data: recentAcks } = await supabase
    .from("messages")
    .select("text")
    .eq("user_id", userId)
    .eq("direction", "outbound")
    .eq("content_type", "ack")
    .eq("ai_generated", false)
    .order("created_at", { ascending: false })
    .limit(RECENT_ACK_EXCLUSION_COUNT);

  const recentTexts = new Set((recentAcks ?? []).map((r) => r.text));
  const candidates = (library as SoftAck[]).filter((a) => !recentTexts.has(a.text));

  const pool = candidates.length > 0 ? candidates : (library as SoftAck[]);
  return pool[Math.floor(Math.random() * pool.length)].text;
}
