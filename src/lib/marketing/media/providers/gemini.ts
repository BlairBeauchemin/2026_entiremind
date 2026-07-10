import { GoogleGenAI } from "@google/genai";
import type { MediaGeneratorAdapter, MediaGenerationRequest, MediaGenerationResult } from "../types";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (client) return client;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable not set");
  }

  client = new GoogleGenAI({ apiKey });
  return client;
}

/**
 * Gemini image generation ("Nano Banana", gemini-2.5-flash-image).
 * Returns failure results rather than throwing so a blocked or empty
 * response never crashes a cron loop.
 */
export const geminiAdapter: MediaGeneratorAdapter = {
  generator: "gemini",
  supports: ["image"],

  async generate(req: MediaGenerationRequest): Promise<MediaGenerationResult> {
    if (req.kind !== "image") {
      return { success: false, error: "gemini adapter only supports images" };
    }

    const model = process.env.GEMINI_IMAGE_MODEL || "gemini-2.5-flash-image";

    try {
      const ai = getClient();
      const prompt = req.aspectRatio
        ? `${req.prompt}\n\nAspect ratio: ${req.aspectRatio}`
        : req.prompt;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
      });

      const parts = response.candidates?.[0]?.content?.parts ?? [];
      for (const part of parts) {
        if (part.inlineData?.data) {
          return {
            success: true,
            data: Uint8Array.from(Buffer.from(part.inlineData.data, "base64")),
            mimeType: part.inlineData.mimeType || "image/png",
            model,
          };
        }
      }

      return {
        success: false,
        error: "Gemini returned no image data (possibly blocked)",
        model,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown Gemini error",
        model,
      };
    }
  },
};
