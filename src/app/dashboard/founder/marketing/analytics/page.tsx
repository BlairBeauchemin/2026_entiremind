export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase";
import type { BrandRow } from "@/lib/supabase";
import {
  aggregateByDimension,
  buildDailySeries,
  hasPlaceholderData,
  type AnalyticsMetric,
  type AnalyticsPiece,
} from "@/lib/marketing/analytics";
import { buildExperimentViews } from "@/lib/marketing/experiment-views";
import { BrandSelector } from "@/components/dashboard/marketing/brand-selector";
import { DailySeries } from "@/components/dashboard/marketing/analytics/daily-series";
import { DimensionBreakdown } from "@/components/dashboard/marketing/analytics/dimension-breakdown";
import { ExperimentList } from "@/components/dashboard/marketing/experiment-list";

const LOOKBACK_DAYS = 30;

export default async function MarketingAnalyticsPage({
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
    redirect("/dashboard/founder/marketing");
  }

  const selectedBrand = brands.find((b) => b.id === brandParam || b.slug === brandParam) ?? brands[0];

  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [piecesRes, metricsRes] = await Promise.all([
    serviceSupabase
      .from("content_pieces")
      .select("id, angle, video_style, format, platform, target")
      .eq("brand_id", selectedBrand.id),
    serviceSupabase
      .from("content_metrics")
      .select(
        "content_piece_id, metric_date, impressions, clicks, spend_cents, conversions, likes, comments, shares, raw",
      )
      .eq("brand_id", selectedBrand.id)
      .gte("metric_date", since),
  ]);

  const pieces = (piecesRes.data ?? []) as AnalyticsPiece[];
  const metrics = (metricsRes.data ?? []) as AnalyticsMetric[];
  const experimentViews = await buildExperimentViews(selectedBrand.id);

  const placeholder = hasPlaceholderData(metrics);
  const series = buildDailySeries(metrics, LOOKBACK_DAYS);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-navy font-medium">
            Marketing Analytics
          </h1>
          <p className="text-muted-foreground mt-2">
            Last {LOOKBACK_DAYS} days of performance for{" "}
            <span className="text-navy font-medium">{selectedBrand.name}</span>. Feeds back into
            next week&apos;s planning automatically.
          </p>
          <Link
            href={`/dashboard/founder/marketing?brand=${selectedBrand.id}`}
            className="text-sm text-em-purple-400 hover:underline mt-1 inline-block"
          >
            ← Back to Marketing Engine
          </Link>
        </div>
        <BrandSelector
          brands={brands.map((b) => ({ id: b.id, name: b.name, slug: b.slug }))}
          selectedId={selectedBrand.id}
        />
      </div>

      {placeholder && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50/70 px-4 py-3 text-sm text-amber-900">
          Placeholder data — platform credentials aren&apos;t connected yet, so these numbers are
          deterministic samples. Real reporting replaces them automatically once credentials are
          wired.
        </div>
      )}

      {metrics.length === 0 ? (
        <div className="text-sm text-muted-foreground italic">
          No performance data yet. Metrics arrive daily once content is published or launched.
        </div>
      ) : (
        <>
          <DailySeries points={series} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <DimensionBreakdown
              title="By angle"
              rows={aggregateByDimension(pieces, metrics, "angle")}
            />
            <DimensionBreakdown
              title="By video style"
              rows={aggregateByDimension(pieces, metrics, "video_style")}
            />
            <DimensionBreakdown
              title="By format"
              rows={aggregateByDimension(pieces, metrics, "format")}
            />
            <DimensionBreakdown
              title="By platform"
              rows={aggregateByDimension(pieces, metrics, "platform")}
              showEngagement
            />
            <DimensionBreakdown
              title="Ads vs organic"
              rows={aggregateByDimension(pieces, metrics, "target")}
            />
          </div>
        </>
      )}

      <div>
        <h2 className="font-serif text-2xl text-navy font-medium mb-2">Experiment Outcomes</h2>
        <p className="text-sm text-muted-foreground mb-4">
          What the controlled tests found. Act on them from the Marketing Engine page.
        </p>
        <ExperimentList experiments={experimentViews} readOnly />
      </div>
    </div>
  );
}
