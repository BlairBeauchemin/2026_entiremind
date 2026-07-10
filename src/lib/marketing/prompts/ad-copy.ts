import type { BrandRow, MarketingCampaignRow } from "../types";
import { ALLOWED_CTAS } from "../types";
import { buildBrandBlock } from "./shared";

export const AD_COPY_SYSTEM_PROMPT = `You are a direct-response copywriter for paid social ads (Meta/Instagram). You write scroll-stopping, emotionally honest ad copy that never feels like hype.

Return a single JSON object with this exact shape:
{
  "headline": string,
  "body_copy": string,
  "cta": ${ALLOWED_CTAS.map((c) => `"${c}"`).join(" | ")},
  "image_prompt": string
}

Field guidance:
- "headline": max 40 characters. Concrete benefit or curiosity hook. No clickbait, no ALL CAPS.
- "body_copy": 1-3 short sentences (max 125 characters ideal for Meta primary text). Speak to one person. Lead with the feeling or problem, land on the promise.
- "cta": pick the single best fit from the allowed list.
- "image_prompt": a vivid, specific description of a single image that would stop the scroll for this ad. Describe subject, mood, lighting, and composition. Do not mention text overlays or logos.

Style:
- Match the brand voice exactly. If the voice is calm, do not shout.
- No emojis unless the brand voice invites them.
- Never make medical, financial, or guaranteed-outcome claims.

Return only the JSON object. No prose before or after.`;

export function buildAdCopyPrompt(
  brand: BrandRow,
  campaign: MarketingCampaignRow | null,
  angle: string | null,
): string {
  const lines = [buildBrandBlock(brand)];
  if (campaign) {
    lines.push(`Campaign: ${campaign.name}`);
    if (campaign.objective) lines.push(`Objective: ${campaign.objective}`);
    if (campaign.brief) lines.push(`Brief: ${campaign.brief}`);
  }
  if (angle) lines.push(`Angle to test: ${angle}`);
  lines.push("Write one image ad for this brand.");
  return lines.join("\n\n");
}
