import type { BrandRow } from "../types";

/**
 * Brand context block injected into every marketing prompt so multi-brand
 * support is prompt-level, not just schema-level.
 */
export interface ExperimentContext {
  name: string;
  variable: string;
  variant_label: string;
}

/**
 * Told to the copywriter when a piece is an experiment variant: hold
 * everything constant except the tested variable.
 */
export function buildExperimentBlock(ctx: ExperimentContext | null | undefined): string | null {
  if (!ctx) return null;
  return `This piece is variant ${ctx.variant_label} of the experiment "${ctx.name}", which tests the variable "${ctx.variable}". Keep every creative choice EXCEPT the ${ctx.variable} consistent with the stated angle and hint; make the ${ctx.variable} clearly distinct from what other variants would do. Follow the provided angle and headline hint exactly.`;
}

export function buildBrandBlock(brand: BrandRow): string {
  return [
    `Brand: ${brand.name}`,
    `Product: ${brand.product_summary}`,
    `Voice: ${brand.brand_voice}`,
    `Audience: ${brand.target_audience}`,
    brand.website_url ? `Website: ${brand.website_url}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}
