/** View models shared by the founder marketing components. */

export interface MediaAssetView {
  id: string;
  kind: "image" | "video";
  generator: string;
  status: string;
  publicUrl: string | null;
  mimeType: string | null;
}

export interface ContentPieceView {
  id: string;
  target: "ad" | "organic";
  platform: string;
  format: string;
  productionMode: "ai_generated" | "founder_filmed";
  status: string;
  headline: string | null;
  bodyCopy: string | null;
  caption: string | null;
  script: string | null;
  imagePrompt: string | null;
  cta: string | null;
  hashtags: string[];
  linkUrl: string | null;
  angle: string | null;
  dailyBudgetCents: number | null;
  scheduledFor: string | null;
  publishedAt: string | null;
  externalPostId: string | null;
  lastError: string | null;
  createdAt: string;
  media: MediaAssetView[];
}

export function formatBudget(cents: number | null): string {
  if (cents == null) return "—";
  return `$${(cents / 100).toFixed(2)}/day`;
}

export function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function latestReadyImage(piece: ContentPieceView): MediaAssetView | null {
  return piece.media.find((m) => m.status === "ready" && m.publicUrl) ?? null;
}
