import type { BrandRow, TrendSource } from "../types";

export interface TrendItem {
  trend: string;
  relevance: string;
  momentum?: "rising" | "steady";
  raw?: unknown;
}

export interface TrendSourceAdapter {
  source: TrendSource;
  /** Whether real credentials/config are present. */
  isConfigured(): boolean;
  fetchTrends(brand: BrandRow): Promise<TrendItem[]>;
}
