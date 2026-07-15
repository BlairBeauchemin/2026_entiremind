import type { BrandRow, TrendSnapshotRow } from "../types";
import { VIDEO_STYLES, VIDEO_STYLE_GUIDANCE } from "../video-styles";
import { buildBrandBlock } from "./shared";

const STYLE_LIST = VIDEO_STYLES.map(
  (s) => `"${s}" (${VIDEO_STYLE_GUIDANCE[s].description})`,
).join(", ");

export const CAMPAIGN_PLAN_SYSTEM_PROMPT = `You are a growth strategist planning a week of marketing content for a small brand. Paid ads on Meta are the top priority; organic posts support them. You think in testable angles, not vague themes, and you structure the week as controlled experiments.

Return a single JSON object with this exact shape:
{
  "campaign": {
    "name": string,
    "objective": string,
    "strategy": {
      "angles": string[],
      "audience_hypotheses": string[],
      "notes": string
    }
  },
  "experiments": [
    {
      "name": string,
      "hypothesis": string,
      "variable": "angle" | "hook" | "video_style" | "format" | "audience" | "cta",
      "min_impressions": number
    }
  ],
  "pieces": [
    {
      "target": "ad" | "organic",
      "platform": "meta_ads" | "instagram" | "tiktok" | "youtube",
      "format": "image_ad" | "video_ad" | "carousel_ad" | "post" | "reel" | "story" | "short",
      "production_mode": "ai_generated" | "founder_filmed",
      "video_style": string | null,
      "angle": string,
      "headline_hint": string,
      "scheduled_offset_days": number,
      "experiment_name": string | null,
      "variant_label": string | null
    }
  ]
}

Rules:
- "target": "ad" pieces MUST use platform "meta_ads". Organic pieces use instagram, tiktok, or youtube.
- Ads come first: at least a third of pieces should be ads unless told otherwise.
- "production_mode": use "founder_filmed" for talking-head style content (personal stories, direct-to-camera reels/shorts) where a real face builds trust; use "ai_generated" for everything else. Only reel, short, and video_ad formats may be founder_filmed.
- "video_style": REQUIRED (non-null) for video_ad, reel, and short formats; null for all other formats. Pick from: ${STYLE_LIST}.
- "angle": one sentence naming the strategic hypothesis this piece tests (e.g. "pain-point relief framing beats aspiration framing for cold traffic").
- "headline_hint": a rough working headline or hook, refined later by the copywriter.
- "scheduled_offset_days": 0-6, spreading pieces across the week.
- Experiments: structure the week as 1-2 experiments. Each experiment has 2-4 variant pieces on the SAME platform and target, differing ONLY in the tested variable:
  - variable "hook": variants share the same angle and differ in headline_hint.
  - variable "angle": variants share format/style and differ in angle.
  - variable "video_style": variants share angle and headline_hint and differ in video_style.
  - variable "format" / "audience" / "cta": variants share angle and headline_hint.
  Give each variant a distinct "variant_label" ("A", "B", "C") and set "experiment_name" to its experiment's name. Pieces outside experiments use null for both.
- "min_impressions": how many impressions each variant needs before judging (default 1000).
- If video formats are disallowed (stated in the request), only use image_ad, carousel_ad, post, and story for ai_generated pieces.
- Respect the requested piece count exactly.

Return only the JSON object. No prose before or after.`;

export function buildCampaignPlanPrompt(
  brand: BrandRow,
  trendSnapshot: TrendSnapshotRow | null,
  opts: {
    count: number;
    videoEnabled: boolean;
    performanceNotes?: string | null;
    brief?: string | null;
  },
): string {
  const lines = [buildBrandBlock(brand)];

  if (trendSnapshot) {
    lines.push(
      `Recent trend research (${trendSnapshot.source}):\n${trendSnapshot.summary}`,
    );
    if (trendSnapshot.insights.length > 0) {
      lines.push(
        `Trend insights:\n${JSON.stringify(trendSnapshot.insights, null, 2)}`,
      );
    }
  }

  if (opts.performanceNotes) {
    lines.push(`What has worked so far:\n${opts.performanceNotes}`);
  }

  if (opts.brief) {
    lines.push(`Founder brief: ${opts.brief}`);
  }

  if (!opts.videoEnabled) {
    lines.push(
      "AI video generation is disabled: ai_generated pieces must not use video_ad, reel, or short formats. founder_filmed pieces may still use them.",
    );
  }

  lines.push(`Plan exactly ${opts.count} content pieces for the coming week.`);
  return lines.join("\n\n");
}
