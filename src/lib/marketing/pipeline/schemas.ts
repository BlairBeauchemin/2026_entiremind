import { z } from "zod";
import { ALLOWED_CTAS } from "../types";
import { VIDEO_STYLES } from "../video-styles";

export const AdCopySchema = z.object({
  headline: z.string().min(1),
  body_copy: z.string().min(1),
  cta: z.enum(ALLOWED_CTAS),
  image_prompt: z.string().min(1),
});
export type AdCopy = z.infer<typeof AdCopySchema>;

export const OrganicPostSchema = z.object({
  caption: z.string().min(1),
  hashtags: z.array(z.string()),
  hook: z.string(),
  image_prompt: z.string().min(1),
});
export type OrganicPost = z.infer<typeof OrganicPostSchema>;

export const VideoScriptSchema = z.object({
  hook: z.string().min(1),
  script: z.string().min(1),
  scenes: z.array(
    z.object({
      visual: z.string(),
      voiceover: z.string(),
      duration_s: z.number(),
    }),
  ),
  video_prompt: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()),
  style_notes: z.string().default(""),
});
export type VideoScript = z.infer<typeof VideoScriptSchema>;

export const ExperimentVariableSchema = z.enum([
  "angle",
  "hook",
  "video_style",
  "format",
  "audience",
  "cta",
]);

export const CampaignPlanSchema = z.object({
  campaign: z.object({
    name: z.string().min(1),
    objective: z.string(),
    strategy: z.object({
      angles: z.array(z.string()),
      audience_hypotheses: z.array(z.string()),
      notes: z.string(),
    }),
  }),
  experiments: z
    .array(
      z.object({
        name: z.string().min(1),
        hypothesis: z.string().min(1),
        variable: ExperimentVariableSchema,
        min_impressions: z.number().int().min(100).max(100000).default(1000),
      }),
    )
    .default([]),
  pieces: z.array(
    z.object({
      target: z.enum(["ad", "organic"]),
      platform: z.enum(["meta_ads", "instagram", "tiktok", "youtube"]),
      format: z.enum([
        "image_ad",
        "video_ad",
        "carousel_ad",
        "post",
        "reel",
        "story",
        "short",
      ]),
      production_mode: z.enum(["ai_generated", "founder_filmed"]),
      video_style: z.enum(VIDEO_STYLES).nullable().default(null),
      angle: z.string(),
      headline_hint: z.string(),
      scheduled_offset_days: z.number().min(0).max(6),
      experiment_name: z.string().nullable().default(null),
      variant_label: z.string().nullable().default(null),
    }),
  ),
});
export type CampaignPlan = z.infer<typeof CampaignPlanSchema>;
export type PlannedPiece = CampaignPlan["pieces"][number];
export type PlannedExperiment = CampaignPlan["experiments"][number];

export const TrendResearchSchema = z.object({
  summary: z.string().min(1),
  delta_summary: z.string().min(1),
  insights: z.array(
    z.object({
      trend: z.string(),
      niche: z.string().default("general"),
      momentum: z.enum(["new", "rising", "steady", "fading"]),
      relevance: z.string(),
      suggested_angle: z.string(),
      hooks: z.array(z.string()),
      formats: z.array(z.string()),
      suggested_video_styles: z.array(z.string()).default([]),
    }),
  ),
});
export type TrendResearch = z.infer<typeof TrendResearchSchema>;
