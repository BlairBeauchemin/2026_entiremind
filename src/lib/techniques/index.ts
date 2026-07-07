import { createServiceRoleClient } from "../supabase";
import type { UserContext, ContentType } from "../ai/types";
import type {
  Distortion,
  TonePreference,
  IntentionCategory,
} from "../persona/types";
import type { Technique, TechniqueSentiment } from "./types";

export type { Technique, TechniqueStatus, TechniqueSentiment } from "./types";
export { TECHNIQUE_STATUSES } from "./types";

interface TechniqueConfig {
  apply_probability: number;
  no_repeat_count: number;
  silence_threshold: number;
}

const DEFAULT_TECHNIQUE_CONFIG: TechniqueConfig = {
  apply_probability: 0.5,
  no_repeat_count: 10,
  silence_threshold: 3,
};

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

async function loadTechniqueConfig(
  supabase: ServiceClient,
): Promise<TechniqueConfig> {
  const { data } = await supabase
    .from("content_selection_config")
    .select(
      "technique_apply_probability, technique_no_repeat_count, silence_threshold",
    )
    .eq("id", 1)
    .single();
  if (!data) return DEFAULT_TECHNIQUE_CONFIG;
  return {
    apply_probability: Number(data.technique_apply_probability ?? 0.5),
    no_repeat_count: data.technique_no_repeat_count ?? 10,
    silence_threshold: data.silence_threshold ?? 3,
  };
}

// ---------------------------------------------------------------------------
// Pure filtering + scoring (exported for tests)
// ---------------------------------------------------------------------------

export interface TechniqueFilterContext {
  contentType: ContentType;
  tonePreference: TonePreference | null;
  /** true when the user is struggling or silent — restrict to gentle techniques */
  isFragile: boolean;
  recentTechniqueIds: Set<string>;
}

/**
 * Hard eligibility filters. A technique survives only if it can ride this
 * content type, is gentle when the user is fragile, is tone-compatible (when
 * the user has a tone preference), and wasn't used recently.
 */
export function filterEligible(
  techniques: Technique[],
  ctx: TechniqueFilterContext,
): Technique[] {
  return techniques.filter((t) => {
    if (
      t.content_types.length > 0 &&
      !t.content_types.includes(ctx.contentType)
    )
      return false;
    if (ctx.isFragile && !t.gentle) return false;
    if (
      t.tone_compatibility.length > 0 &&
      ctx.tonePreference &&
      !t.tone_compatibility.includes(ctx.tonePreference)
    )
      return false;
    if (ctx.recentTechniqueIds.has(t.id)) return false;
    return true;
  });
}

export interface TechniqueScoreContext {
  distortions: Distortion[];
  sentiment: TechniqueSentiment;
  intentionCategory: IntentionCategory | null;
  /** injectable for deterministic tests; defaults to Math.random */
  random?: () => number;
}

/**
 * Score an eligible technique. Distortion match dominates (this is the whole
 * point of the matcher), then sentiment fit, then category, plus the founder's
 * hand-boost and a small jitter for rotation among ties.
 */
export function scoreTechnique(
  t: Technique,
  ctx: TechniqueScoreContext,
): number {
  let score = 0;
  if (
    t.target_distortions.length > 0 &&
    t.target_distortions.some((d) => ctx.distortions.includes(d))
  ) {
    score += 3;
  }
  if (
    t.target_sentiments.length === 0 ||
    t.target_sentiments.includes(ctx.sentiment)
  ) {
    score += 2;
  }
  if (
    t.intention_categories.length === 0 ||
    (ctx.intentionCategory &&
      t.intention_categories.includes(ctx.intentionCategory))
  ) {
    score += 1;
  }
  score += t.priority;
  score += (ctx.random ?? Math.random)() * 0.5;
  return score;
}

// ---------------------------------------------------------------------------
// Selection
// ---------------------------------------------------------------------------

/**
 * Pick a technique for a user's daily message, matched to their persona and
 * current state. Returns null when no technique applies (probability roll,
 * empty library, or no eligible match) — the caller then runs the generic
 * prompt path, so there is zero regression.
 */
export async function pickTechniqueForUser(
  context: UserContext,
  contentType: ContentType,
): Promise<Technique | null> {
  const supabase = createServiceRoleClient();
  const config = await loadTechniqueConfig(supabase);

  // Roll first: only some sends carry a technique. 0 disables the feature.
  if (Math.random() >= config.apply_probability) return null;

  const { data: rows } = await supabase
    .from("techniques")
    .select("*")
    .eq("status", "active");
  if (!rows || rows.length === 0) return null;
  const techniques = rows as Technique[];

  const { data: recent } = await supabase
    .from("messages")
    .select("technique_id")
    .eq("user_id", context.userId)
    .eq("direction", "outbound")
    .not("technique_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(config.no_repeat_count);
  const recentIds = new Set(
    (recent ?? []).map((r) => r.technique_id as string),
  );

  const isFragile =
    context.recentReply?.sentiment === "struggling" ||
    context.consecutiveSilences >= config.silence_threshold;

  const eligible = filterEligible(techniques, {
    contentType,
    tonePreference: context.profile?.tone_preference ?? null,
    isFragile,
    recentTechniqueIds: recentIds,
  });
  if (eligible.length === 0) return null;

  const distortions = [
    context.profile?.primary_distortion,
    context.profile?.secondary_distortion,
  ].filter((d): d is Distortion => Boolean(d));

  const scoreCtx: TechniqueScoreContext = {
    distortions,
    sentiment: context.recentReply?.sentiment ?? "neutral",
    intentionCategory: context.profile?.intention_category ?? null,
  };

  let best: Technique | null = null;
  let bestScore = -Infinity;
  for (const t of eligible) {
    const s = scoreTechnique(t, scoreCtx);
    if (s > bestScore) {
      bestScore = s;
      best = t;
    }
  }
  return best;
}
