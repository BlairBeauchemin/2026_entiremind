import type { MediaKind } from "../types";

/** Generators that can produce media (excludes 'manual' founder uploads). */
export type GeneratingProvider = "gemini" | "veo";

export type MediaAspectRatio = "1:1" | "4:5" | "9:16" | "16:9";

export interface MediaGenerationRequest {
  prompt: string;
  kind: MediaKind;
  aspectRatio?: MediaAspectRatio;
  /** Video only. */
  durationSeconds?: number;
}

export interface MediaGenerationResult {
  success: boolean;
  /** Raw media bytes when success. */
  data?: Uint8Array;
  mimeType?: string;
  model?: string;
  error?: string;
}

export interface MediaGeneratorAdapter {
  generator: GeneratingProvider;
  supports: MediaKind[];
  generate(req: MediaGenerationRequest): Promise<MediaGenerationResult>;
}
