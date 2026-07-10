import type { BrandRow } from "../types";

/**
 * Brand context block injected into every marketing prompt so multi-brand
 * support is prompt-level, not just schema-level.
 */
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
