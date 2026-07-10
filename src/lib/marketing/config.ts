import { createServiceRoleClient } from "../supabase";
import type { MarketingEngineConfigRow } from "../supabase";

export const DEFAULT_ENGINE_CONFIG: MarketingEngineConfigRow = {
  id: 1,
  enabled: true,
  weekly_pieces_per_brand: 7,
  max_generations_per_run: 5,
  max_publishes_per_run: 10,
  default_daily_budget_cents: 2000,
  ads_launch_paused: true,
  video_enabled: false,
  image_provider: "gemini",
  video_provider: "veo",
  updated_at: new Date(0).toISOString(),
};

/**
 * Load the singleton marketing engine config, falling back to defaults if
 * the row is missing (pre-migration) or the read fails.
 */
export async function loadEngineConfig(): Promise<MarketingEngineConfigRow> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("marketing_engine_config")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("Failed to load marketing config:", error);
    return DEFAULT_ENGINE_CONFIG;
  }
  return data as MarketingEngineConfigRow;
}
