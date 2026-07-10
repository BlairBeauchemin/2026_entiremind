import type { BrandRow } from "../types";

/**
 * Wrap a piece-level image idea in the brand's visual guardrails so every
 * generated image stays on-style regardless of which prompt produced it.
 */
export function buildImagePrompt(brand: BrandRow, imageIdea: string): string {
  const parts = [imageIdea.trim()];
  if (brand.visual_style) {
    parts.push(`Visual style: ${brand.visual_style}`);
  }
  parts.push(
    "No text overlays, no watermarks, no logos. Photographic or soft illustrated quality suitable for a paid social ad.",
  );
  return parts.join("\n\n");
}
