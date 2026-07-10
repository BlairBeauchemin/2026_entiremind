/**
 * Technique Playbook types.
 *
 * A technique is a distilled thinking-tool stored as a prompt recipe that the
 * daily-SMS generation engine injects into the prompt, matched to a user's
 * cognitive-distortion profile and current emotional state. Internal-only —
 * never shown to end users.
 */

import type {
  Distortion,
  TonePreference,
  IntentionCategory,
} from "../persona/types";
import type { ContentType } from "../ai/types";

export const TECHNIQUE_STATUSES = ["draft", "active", "retired"] as const;
export type TechniqueStatus = (typeof TECHNIQUE_STATUSES)[number];

/** Sentiment vocabulary shared with enrichment insights. */
export type TechniqueSentiment = "positive" | "neutral" | "struggling";

export interface Technique {
  id: string;
  name: string;
  principle: string;
  prompt_recipe: string;
  content_types: ContentType[];
  target_distortions: Distortion[];
  target_sentiments: TechniqueSentiment[];
  tone_compatibility: TonePreference[];
  intention_categories: IntentionCategory[];
  gentle: boolean;
  priority: number;
  source_title: string | null;
  source_author: string | null;
  status: TechniqueStatus;
}
