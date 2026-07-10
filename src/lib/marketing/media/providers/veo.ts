import type { MediaGeneratorAdapter, MediaGenerationRequest, MediaGenerationResult } from "../types";

/**
 * PLACEHOLDER: Veo video generation is not wired yet.
 *
 * The real implementation uses the same @google/genai client as gemini.ts:
 *   const op = await ai.models.generateVideos({
 *     model: process.env.VEO_MODEL || "veo-3.0-generate-001",
 *     prompt: req.prompt,
 *     config: { aspectRatio: req.aspectRatio, durationSeconds: req.durationSeconds },
 *   });
 *   // generateVideos is a long-running operation: poll ai.operations.getVideosOperation
 *   // until done, then download op.response.generatedVideos[0].video bytes.
 *
 * Long-running polling likely exceeds a single request window at longer
 * durations — when wiring for real, generate from the cron (maxDuration 300)
 * or split submit/poll across runs.
 */
export const veoAdapter: MediaGeneratorAdapter = {
  generator: "veo",
  supports: ["video"],

  async generate(req: MediaGenerationRequest): Promise<MediaGenerationResult> {
    if (req.kind !== "video") {
      return { success: false, error: "veo adapter only supports video" };
    }
    return {
      success: false,
      error: "veo provider not yet wired (placeholder)",
    };
  },
};
