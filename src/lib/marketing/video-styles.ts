import type { VideoStyle } from "./types";

/**
 * Video style taxonomy. The SQL CHECK in migration 019 must list the same
 * values — the zod enums and TS union all derive from this const, so only
 * the SQL side can drift.
 */
export const VIDEO_STYLES = [
  "talking_head",
  "ugc_testimonial",
  "b_roll_voiceover",
  "pov",
  "text_on_screen",
  "greenscreen_react",
  "slideshow",
  "tutorial_demo",
] as const;

export interface VideoStyleGuidance {
  label: string;
  description: string;
  /** Shot-list / framing tips shown in the filming queue. */
  filmingTips: string[];
  /** Notes injected into AI video generation prompts. */
  aiGenerationNotes: string;
  /** Whether a founder with a phone can film this style. */
  founderFilmable: boolean;
}

export const VIDEO_STYLE_GUIDANCE: Record<VideoStyle, VideoStyleGuidance> = {
  talking_head: {
    label: "Talking head",
    description: "You speaking directly to camera — the trust builder.",
    filmingTips: [
      "Camera at eye level, arm's length away (or a cheap tripod)",
      "Natural window light on your face, not behind you",
      "Deliver the hook in the first 3 seconds, then breathe",
      "One take is fine — small stumbles read as authentic",
      "Leave 1s of silence at the start and end for trimming",
    ],
    aiGenerationNotes:
      "A single person speaking directly to camera, medium close-up, natural lighting, minimal background.",
    founderFilmable: true,
  },
  ugc_testimonial: {
    label: "UGC-style testimonial",
    description: "Casual, handheld, feels like a real user sharing an experience.",
    filmingTips: [
      "Handheld phone, slightly imperfect framing — polish kills the format",
      "Film in a lived-in space (kitchen, car, walk outside)",
      "Speak like you're telling a friend, not presenting",
      "Mention the specific moment things changed for you",
    ],
    aiGenerationNotes:
      "Handheld selfie-style video, casual setting, authentic unpolished feel, person sharing an experience.",
    founderFilmable: true,
  },
  b_roll_voiceover: {
    label: "B-roll + voiceover",
    description: "Atmospheric footage with your voice carrying the message.",
    filmingTips: [
      "Record the voiceover first, calm and unhurried",
      "Collect 5-8 short clips: morning light, coffee, journaling, walking",
      "Each clip 2-4 seconds, slow movements only",
      "No faces needed — hands and environments work",
    ],
    aiGenerationNotes:
      "Cinematic b-roll sequence: soft morning light, calm domestic scenes, slow camera movement, no dialogue on screen.",
    founderFilmable: true,
  },
  pov: {
    label: "POV",
    description: "First-person framing — the viewer is the protagonist.",
    filmingTips: [
      "Hold the phone as your eyes: walking to the window, opening the journal",
      "Keep motion smooth and slow",
      "Pair with an on-screen text hook ('POV: you stopped forcing it')",
    ],
    aiGenerationNotes:
      "First-person point-of-view shot, hands visible, immersive framing, smooth slow movement.",
    founderFilmable: true,
  },
  text_on_screen: {
    label: "Text on screen",
    description: "A calm background clip with the message delivered as text.",
    filmingTips: [
      "Pure edit style — background clip + text overlays in CapCut or similar",
      "One thought per text card, 2-3 seconds each",
      "Keep the background footage minimal so text stays readable",
    ],
    aiGenerationNotes:
      "Calm looping background (clouds, water, soft light) designed for large text overlays, no people.",
    founderFilmable: false,
  },
  greenscreen_react: {
    label: "Greenscreen react",
    description: "You commenting over a screenshot/article using the greenscreen effect.",
    filmingTips: [
      "Use the in-app greenscreen effect over a screenshot or headline",
      "Point at the thing you're reacting to in the first second",
      "Keep the reaction under 30 seconds",
    ],
    aiGenerationNotes:
      "Person superimposed over a document or screenshot background, commentary style framing.",
    founderFilmable: true,
  },
  slideshow: {
    label: "Slideshow",
    description: "Image carousel with music — high saves, zero filming.",
    filmingTips: [
      "Pure edit style — 5-8 images with one line of text each",
      "First slide is the hook; last slide is the CTA",
      "Reuse generated brand images for the slides",
    ],
    aiGenerationNotes:
      "A sequence of calm, cohesive still images suitable for a slideshow with text captions.",
    founderFilmable: false,
  },
  tutorial_demo: {
    label: "Tutorial / demo",
    description: "Step-by-step walkthrough of a practice or the product.",
    filmingTips: [
      "Number the steps out loud ('three things, here's the first')",
      "Show the phone screen or the practice, not just your face",
      "End with what changes when they do it daily",
    ],
    aiGenerationNotes:
      "Instructional step-by-step demonstration, clear framing on hands or screen, numbered progression.",
    founderFilmable: true,
  },
};

export function isVideoStyle(value: unknown): value is VideoStyle {
  return typeof value === "string" && (VIDEO_STYLES as readonly string[]).includes(value);
}
