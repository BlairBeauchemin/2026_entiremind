import { z } from "zod";
import { ALLOWED_CTAS } from "../types";

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
});
export type VideoScript = z.infer<typeof VideoScriptSchema>;

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
      angle: z.string(),
      headline_hint: z.string(),
      scheduled_offset_days: z.number().min(0).max(6),
    }),
  ),
});
export type CampaignPlan = z.infer<typeof CampaignPlanSchema>;
