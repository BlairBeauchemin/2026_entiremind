import { createServiceRoleClient } from "../supabase";
import { SYSTEM_PROMPT } from "./prompts";

export interface ResolvedSystemPrompt {
  /** system_prompts.id, or null when using the built-in default constant. */
  id: string | null;
  name: string;
  body: string;
}

export const BUILT_IN_PROMPT_NAME = "Built-in default";

function builtInDefault(): ResolvedSystemPrompt {
  return { id: null, name: BUILT_IN_PROMPT_NAME, body: SYSTEM_PROMPT };
}

/**
 * Load the active system prompt version. Falls back to the hardcoded default
 * when no version has been activated (or on any read error), so production
 * behavior is unchanged until the founder explicitly activates a version.
 */
export async function loadActiveSystemPrompt(): Promise<ResolvedSystemPrompt> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("system_prompts")
      .select("id, name, body")
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (error || !data?.body) return builtInDefault();
    return { id: data.id, name: data.name, body: data.body };
  } catch {
    return builtInDefault();
  }
}

/**
 * Load a specific prompt version (the simulator pins runs to a version so a
 * mid-week activation doesn't silently change a running experiment).
 * Falls back to the active prompt when the id doesn't resolve.
 */
export async function loadSystemPromptById(
  id: string,
): Promise<ResolvedSystemPrompt> {
  try {
    const supabase = createServiceRoleClient();
    const { data, error } = await supabase
      .from("system_prompts")
      .select("id, name, body")
      .eq("id", id)
      .maybeSingle();
    if (error || !data?.body) return loadActiveSystemPrompt();
    return { id: data.id, name: data.name, body: data.body };
  } catch {
    return builtInDefault();
  }
}
