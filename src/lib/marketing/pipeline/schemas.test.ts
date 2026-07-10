import { describe, it, expect } from "vitest";
import {
  AdCopySchema,
  OrganicPostSchema,
  VideoScriptSchema,
  CampaignPlanSchema,
} from "./schemas";

describe("AdCopySchema", () => {
  it("accepts a well-formed ad copy payload", () => {
    const result = AdCopySchema.safeParse({
      headline: "One text. Every morning.",
      body_copy: "A gentle daily nudge toward what you actually want.",
      cta: "SIGN_UP",
      image_prompt: "A soft sunrise over a calm bedroom, phone on nightstand",
    });
    expect(result.success).toBe(true);
  });

  it("rejects an unknown CTA", () => {
    const result = AdCopySchema.safeParse({
      headline: "x",
      body_copy: "y",
      cta: "BUY_NOW_LOUDLY",
      image_prompt: "z",
    });
    expect(result.success).toBe(false);
  });
});

describe("OrganicPostSchema", () => {
  it("accepts a well-formed post payload", () => {
    const result = OrganicPostSchema.safeParse({
      caption: "What would today look like if it were already working?",
      hashtags: ["manifestation", "intentionalliving"],
      hook: "What would today look like…",
      image_prompt: "Morning light through linen curtains",
    });
    expect(result.success).toBe(true);
  });
});

describe("VideoScriptSchema", () => {
  it("accepts a scene-level script", () => {
    const result = VideoScriptSchema.safeParse({
      hook: "I stopped chasing goals. Here's what happened.",
      script: "I stopped chasing goals. (pause) I started texting them instead.",
      scenes: [
        { visual: "Founder to camera", voiceover: "I stopped chasing goals.", duration_s: 4 },
        { visual: "Phone screen with a text", voiceover: "I started texting them.", duration_s: 5 },
      ],
      video_prompt: "A calm founder speaking to camera in soft morning light",
      caption: "The quietest habit change I ever made.",
      hashtags: ["manifestation"],
    });
    expect(result.success).toBe(true);
  });
});

describe("CampaignPlanSchema", () => {
  it("accepts a plan and enforces enum fields", () => {
    const result = CampaignPlanSchema.safeParse({
      campaign: {
        name: "Cold traffic test",
        objective: "Drive signups",
        strategy: { angles: ["a"], audience_hypotheses: ["b"], notes: "" },
      },
      pieces: [
        {
          target: "ad",
          platform: "meta_ads",
          format: "image_ad",
          production_mode: "ai_generated",
          angle: "pain-point framing",
          headline_hint: "Tired of vision boards?",
          scheduled_offset_days: 0,
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects out-of-range schedule offsets", () => {
    const result = CampaignPlanSchema.safeParse({
      campaign: {
        name: "x",
        objective: "",
        strategy: { angles: [], audience_hypotheses: [], notes: "" },
      },
      pieces: [
        {
          target: "ad",
          platform: "meta_ads",
          format: "image_ad",
          production_mode: "ai_generated",
          angle: "a",
          headline_hint: "h",
          scheduled_offset_days: 12,
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
