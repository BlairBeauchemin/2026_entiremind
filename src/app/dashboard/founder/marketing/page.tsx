export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase";
import type {
  BrandRow,
  BrandChannelRow,
  ContentPieceRow,
  MarketingCampaignRow,
  MarketingExperimentRow,
  MediaAssetRow,
  TrendSnapshotRow,
} from "@/lib/supabase";
import { BrandSelector } from "@/components/dashboard/marketing/brand-selector";
import { ContentReviewQueue } from "@/components/dashboard/marketing/content-review-queue";
import { FilmingQueue } from "@/components/dashboard/marketing/filming-queue";
import { CampaignList, type CampaignView } from "@/components/dashboard/marketing/campaign-list";
import { ContentScheduleTable } from "@/components/dashboard/marketing/content-schedule-table";
import { ChannelSettings } from "@/components/dashboard/marketing/channel-settings";
import { TrendPanel, type TrendSnapshotView, type TrendInsightView } from "@/components/dashboard/marketing/trend-panel";
import { TrendHistory, type TrendHistoryItem } from "@/components/dashboard/marketing/trend-history";
import { NicheEditor } from "@/components/dashboard/marketing/niche-editor";
import { ExperimentList } from "@/components/dashboard/marketing/experiment-list";
import { buildExperimentViews } from "@/lib/marketing/experiment-views";
import { ContentCreateDialog } from "@/components/dashboard/marketing/content-create-dialog";
import { MetricsSummary, type MetricsSummaryRow } from "@/components/dashboard/marketing/metrics-summary";
import type { ContentPieceView } from "@/components/dashboard/marketing/types";
import { FounderRefreshButton } from "@/components/dashboard/founder-refresh-button";

type PieceWithMedia = ContentPieceRow & { media_assets: MediaAssetRow[] | null };

function toPieceView(
  piece: PieceWithMedia,
  experimentNames?: Map<string, string>,
): ContentPieceView {
  const context = (piece.generation_context ?? {}) as { style_notes?: string };
  return {
    id: piece.id,
    target: piece.target,
    platform: piece.platform,
    format: piece.format,
    productionMode: piece.production_mode,
    videoStyle: piece.video_style,
    styleNotes: context.style_notes ?? null,
    variantLabel: piece.variant_label,
    experimentName:
      (piece.experiment_id ? experimentNames?.get(piece.experiment_id) : null) ?? null,
    status: piece.status,
    headline: piece.headline,
    bodyCopy: piece.body_copy,
    caption: piece.caption,
    script: piece.script,
    imagePrompt: piece.image_prompt,
    cta: piece.cta,
    hashtags: piece.hashtags ?? [],
    linkUrl: piece.link_url,
    angle: piece.angle,
    dailyBudgetCents: piece.daily_budget_cents,
    scheduledFor: piece.scheduled_for,
    publishedAt: piece.published_at,
    externalPostId: piece.external_post_id,
    lastError: piece.last_error,
    createdAt: piece.created_at,
    media: (piece.media_assets ?? [])
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
      .map((m) => ({
        id: m.id,
        kind: m.kind,
        generator: m.generator,
        status: m.status,
        publicUrl: m.public_url,
        mimeType: m.mime_type,
      })),
  };
}

export default async function MarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ brand?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) {
    redirect("/auth");
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();

  const isAdmin = ["admin", "founder"].includes(userProfile?.role ?? "");
  if (!isAdmin) {
    redirect("/dashboard");
  }

  const serviceSupabase = createServiceRoleClient();
  const { brand: brandParam } = await searchParams;

  const { data: brandsData } = await serviceSupabase
    .from("brands")
    .select("*")
    .order("created_at", { ascending: true });
  const brands = (brandsData ?? []) as BrandRow[];

  if (brands.length === 0) {
    return (
      <div className="space-y-4">
        <h1 className="font-serif text-3xl text-navy font-medium">Marketing Engine</h1>
        <p className="text-muted-foreground">
          No brands found. Run migration 018_marketing_engine.sql to seed the Entiremind brand.
        </p>
      </div>
    );
  }

  const selectedBrand = brands.find((b) => b.id === brandParam || b.slug === brandParam) ?? brands[0];

  const [channelsRes, campaignsRes, piecesRes, snapshotRes] = await Promise.all([
    serviceSupabase
      .from("brand_channels")
      .select("*")
      .eq("brand_id", selectedBrand.id)
      .order("platform"),
    serviceSupabase
      .from("marketing_campaigns")
      .select("*")
      .eq("brand_id", selectedBrand.id)
      .order("created_at", { ascending: false })
      .limit(20),
    serviceSupabase
      .from("content_pieces")
      .select("*, media_assets(*)")
      .eq("brand_id", selectedBrand.id)
      .order("created_at", { ascending: false })
      .limit(100),
    serviceSupabase
      .from("trend_snapshots")
      .select("*")
      .eq("brand_id", selectedBrand.id)
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const channels = (channelsRes.data ?? []) as BrandChannelRow[];
  const campaigns = (campaignsRes.data ?? []) as MarketingCampaignRow[];

  const { data: experimentRows } = await serviceSupabase
    .from("marketing_experiments")
    .select("*")
    .eq("brand_id", selectedBrand.id)
    .order("created_at", { ascending: false })
    .limit(20);
  const experiments = (experimentRows ?? []) as MarketingExperimentRow[];
  const experimentNames = new Map(experiments.map((e) => [e.id, e.name]));
  const experimentViews = await buildExperimentViews(selectedBrand.id);

  const pieces = ((piecesRes.data ?? []) as PieceWithMedia[]).map((p) =>
    toPieceView(p, experimentNames),
  );
  const snapshots = (snapshotRes.data ?? []) as TrendSnapshotRow[];
  const snapshot = snapshots[0] ?? null;

  const trendHistory: TrendHistoryItem[] = snapshots.map((s) => {
    const delta = (s.delta ?? {}) as {
      summary?: string;
      new_trends?: string[];
      dropped_trends?: string[];
    };
    return {
      id: s.id,
      source: s.source,
      deltaSummary: delta.summary ?? null,
      newTrends: delta.new_trends ?? [],
      droppedTrends: delta.dropped_trends ?? [],
      insightCount: (s.insights ?? []).length,
      createdAt: s.created_at,
    };
  });

  const reviewQueue = pieces.filter((p) => p.status === "pending_review");
  const filmingQueue = pieces.filter((p) => p.status === "awaiting_footage");
  const scheduleRows = pieces.filter((p) =>
    ["approved", "scheduled", "publishing", "published", "launched", "failed"].includes(p.status),
  );
  const draftCount = pieces.filter((p) => ["draft", "generating"].includes(p.status)).length;

  const pieceCountByCampaign = new Map<string, number>();
  const { data: countRows } = await serviceSupabase
    .from("content_pieces")
    .select("campaign_id")
    .eq("brand_id", selectedBrand.id);
  for (const row of (countRows ?? []) as Array<{ campaign_id: string | null }>) {
    if (!row.campaign_id) continue;
    pieceCountByCampaign.set(row.campaign_id, (pieceCountByCampaign.get(row.campaign_id) ?? 0) + 1);
  }

  const campaignViews: CampaignView[] = campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    objective: c.objective,
    campaignType: c.campaign_type,
    status: c.status,
    totalBudgetCents: c.total_budget_cents,
    dailyBudgetCents: c.daily_budget_cents,
    pieceCount: pieceCountByCampaign.get(c.id) ?? 0,
    createdAt: c.created_at,
  }));

  const snapshotView: TrendSnapshotView | null = snapshot
    ? {
        id: snapshot.id,
        source: snapshot.source,
        summary: snapshot.summary,
        insights: (snapshot.insights ?? []) as unknown as TrendInsightView[],
        createdAt: snapshot.created_at,
      }
    : null;

  // Per-campaign metric totals
  const { data: metricRows } = await serviceSupabase
    .from("content_metrics")
    .select("content_piece_id, impressions, clicks, spend_cents, conversions")
    .eq("brand_id", selectedBrand.id);

  const campaignByPiece = new Map<string, string | null>();
  const { data: pieceCampaignRows } = await serviceSupabase
    .from("content_pieces")
    .select("id, campaign_id")
    .eq("brand_id", selectedBrand.id);
  for (const row of (pieceCampaignRows ?? []) as Array<{ id: string; campaign_id: string | null }>) {
    campaignByPiece.set(row.id, row.campaign_id);
  }

  const metricsByCampaign = new Map<string, MetricsSummaryRow>();
  for (const m of (metricRows ?? []) as Array<{
    content_piece_id: string;
    impressions: number;
    clicks: number;
    spend_cents: number;
    conversions: number;
  }>) {
    const campaignId = campaignByPiece.get(m.content_piece_id);
    const campaign = campaigns.find((c) => c.id === campaignId);
    const key = campaign?.id ?? "uncategorized";
    const agg = metricsByCampaign.get(key) ?? {
      campaignName: campaign?.name ?? "Uncategorized",
      impressions: 0,
      clicks: 0,
      spendCents: 0,
      conversions: 0,
    };
    agg.impressions += m.impressions;
    agg.clicks += m.clicks;
    agg.spendCents += m.spend_cents;
    agg.conversions += m.conversions;
    metricsByCampaign.set(key, agg);
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-navy font-medium">
            Marketing Engine
          </h1>
          <p className="text-muted-foreground mt-2">
            Plan, generate, review, and publish ads and social content for{" "}
            <span className="text-navy font-medium">{selectedBrand.name}</span>.
            {draftCount > 0 && ` ${draftCount} piece${draftCount === 1 ? "" : "s"} queued for generation.`}
          </p>
          <div className="flex gap-4">
            <Link
              href="/dashboard/founder"
              className="text-sm text-em-purple-400 hover:underline mt-1 inline-block"
            >
              ← Back to Founder Review
            </Link>
            <Link
              href={`/dashboard/founder/marketing/analytics?brand=${selectedBrand.id}`}
              className="text-sm text-em-purple-400 hover:underline mt-1 inline-block"
            >
              Analytics →
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <BrandSelector
            brands={brands.map((b) => ({ id: b.id, name: b.name, slug: b.slug }))}
            selectedId={selectedBrand.id}
          />
          <ContentCreateDialog brandId={selectedBrand.id} />
          <FounderRefreshButton />
        </div>
      </div>

      <div>
        <h2 className="font-serif text-2xl text-navy font-medium mb-2">Review Queue</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Approve, edit, or reject before anything publishes. Paid ads always stop here.
        </p>
        <ContentReviewQueue pieces={reviewQueue} />
      </div>

      <div>
        <h2 className="font-serif text-2xl text-navy font-medium mb-2">Awaiting Your Footage</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Scripts ready for you to film. Upload the footage and the piece moves to review.
        </p>
        <FilmingQueue pieces={filmingQueue} />
      </div>

      <div>
        <h2 className="font-serif text-2xl text-navy font-medium mb-2">Campaigns</h2>
        <p className="text-sm text-muted-foreground mb-4">
          &quot;Plan content now&quot; researches trends and drafts a week of pieces; the daily cron
          generates them one batch at a time.
        </p>
        <CampaignList brandId={selectedBrand.id} campaigns={campaignViews} />
      </div>

      <div>
        <h2 className="font-serif text-2xl text-navy font-medium mb-2">Experiments</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Controlled tests the planner set up — one variable at a time. Winners are recommended,
          never auto-promoted.
        </p>
        <ExperimentList experiments={experimentViews} />
      </div>

      <div>
        <h2 className="font-serif text-2xl text-navy font-medium mb-2">Schedule &amp; Published</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Approved content waits for the publish cron — or push it out immediately.
        </p>
        <ContentScheduleTable pieces={scheduleRows} />
      </div>

      <div>
        <h2 className="font-serif text-2xl text-navy font-medium mb-2">Performance</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Per-campaign totals from the daily metrics pull. Feeds back into next week&apos;s planning.
        </p>
        <MetricsSummary rows={Array.from(metricsByCampaign.values())} />
      </div>

      <div>
        <h2 className="font-serif text-2xl text-navy font-medium mb-2">Followed Niches</h2>
        <p className="text-sm text-muted-foreground mb-4">
          The topics trend research tracks for this brand. Edit anytime — the next research run
          picks them up.
        </p>
        <NicheEditor brandId={selectedBrand.id} niches={selectedBrand.niches ?? []} />
      </div>

      <div>
        <h2 className="font-serif text-2xl text-navy font-medium mb-2">Trend Research</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Latest research snapshot feeding campaign planning. AI-sourced until live trend APIs are wired.
        </p>
        <TrendPanel snapshot={snapshotView} />
      </div>

      <div>
        <h2 className="font-serif text-2xl text-navy font-medium mb-2">Trend History</h2>
        <p className="text-sm text-muted-foreground mb-4">
          How the landscape shifted snapshot to snapshot — what appeared, what faded.
        </p>
        <TrendHistory items={trendHistory} />
      </div>

      <div>
        <h2 className="font-serif text-2xl text-navy font-medium mb-2">Channels</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Organic channels can auto-publish or require approval. Paid ads always require approval.
        </p>
        <ChannelSettings
          channels={channels.map((c) => ({
            id: c.id,
            platform: c.platform,
            publishMode: c.publish_mode,
            connected: c.connected,
          }))}
        />
      </div>
    </div>
  );
}
