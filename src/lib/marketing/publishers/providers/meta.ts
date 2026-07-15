import { randomUUID } from "crypto";
import { buildPlaceholderDailyMetrics } from "../../metrics/placeholder";
import type {
  PublisherAdapter,
  PublishPostRequest,
  PublishResult,
  LaunchAdRequest,
  LaunchAdResult,
  MetricsRequest,
  MetricsResult,
} from "../types";

/**
 * Meta (Facebook/Instagram) publisher.
 *
 * Request payloads match the real Marketing API (campaign -> adset ->
 * adimage -> adcreative -> ad) so wiring real credentials later is only a
 * matter of setting the env vars below. Until then every call is a
 * PLACEHOLDER: the would-be request is logged and a stub id returned.
 *
 * Real launch additionally requires a Meta app with ads_management,
 * pages_manage_ads, and instagram_content_publish permissions plus
 * Business verification.
 */

const API_VERSION = () => process.env.META_API_VERSION || "v21.0";
const GRAPH = () => `https://graph.facebook.com/${API_VERSION()}`;

function metaEnv() {
  return {
    accessToken: process.env.META_ACCESS_TOKEN,
    adAccountId: process.env.META_AD_ACCOUNT_ID,
    pageId: process.env.META_PAGE_ID,
    igBusinessId: process.env.META_IG_BUSINESS_ID,
  };
}

function adsConfigured(): boolean {
  const env = metaEnv();
  return Boolean(env.accessToken && env.adAccountId && env.pageId);
}

function igConfigured(): boolean {
  const env = metaEnv();
  return Boolean(env.accessToken && env.igBusinessId);
}

/**
 * Execute a Graph API POST — or, when credentials are missing, log the
 * would-be request and return a stub id so the pipeline stays exercisable.
 */
async function metaFetch(
  path: string,
  body: Record<string, unknown>,
  configured: boolean,
): Promise<{ id: string; placeholder: boolean }> {
  if (!configured) {
    // PLACEHOLDER: no credentials — log the exact request we would send
    console.log(`[meta placeholder] POST ${GRAPH()}${path}`, JSON.stringify(body));
    return { id: `stub_meta_${randomUUID()}`, placeholder: true };
  }

  const { accessToken } = metaEnv();
  const response = await fetch(`${GRAPH()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...body, access_token: accessToken }),
  });

  const json = (await response.json()) as { id?: string; error?: { message?: string } };
  if (!response.ok || !json.id) {
    throw new Error(json.error?.message ?? `Meta API error (${response.status})`);
  }
  return { id: json.id, placeholder: false };
}

function ctaOrDefault(cta: string | null): string {
  return cta || "LEARN_MORE";
}

async function launchAd(req: LaunchAdRequest): Promise<LaunchAdResult> {
  const configured = adsConfigured();
  const env = metaEnv();
  const account = `/act_${env.adAccountId ?? "AD_ACCOUNT_ID"}`;
  const { piece, campaign } = req;

  try {
    // 1. Campaign (reuse the external id if this campaign already launched)
    let metaCampaignId = campaign?.meta_campaign_id ?? null;
    let placeholder = false;
    if (!metaCampaignId) {
      const created = await metaFetch(
        `${account}/campaigns`,
        {
          name: campaign?.name ?? `Campaign for ${piece.id}`,
          objective: "OUTCOME_TRAFFIC",
          status: "PAUSED",
          special_ad_categories: [],
        },
        configured,
      );
      metaCampaignId = created.id;
      placeholder = created.placeholder;
    }

    // 2. Ad set: budget + targeting live here
    const adset = await metaFetch(
      `${account}/adsets`,
      {
        name: `${piece.headline ?? piece.id} — adset`,
        campaign_id: metaCampaignId,
        daily_budget: piece.daily_budget_cents ?? 2000,
        billing_event: "IMPRESSIONS",
        optimization_goal: "LINK_CLICKS",
        bid_strategy: "LOWEST_COST_WITHOUT_CAP",
        targeting: piece.targeting ?? campaign?.targeting ?? {
          geo_locations: { countries: ["US"] },
          age_min: 18,
        },
        status: "PAUSED",
      },
      configured,
    );

    // 3. Upload the creative image by URL -> image hash
    const imageUrl = req.media.find((m) => m.kind === "image" && m.public_url)?.public_url;
    const adimage = await metaFetch(
      `${account}/adimages`,
      { url: imageUrl ?? "https://placeholder.invalid/creative.png" },
      configured,
    );

    // 4. Ad creative: page post spec with copy + CTA
    const creative = await metaFetch(
      `${account}/adcreatives`,
      {
        name: `${piece.headline ?? piece.id} — creative`,
        object_story_spec: {
          page_id: env.pageId ?? "PAGE_ID",
          link_data: {
            message: piece.body_copy ?? "",
            name: piece.headline ?? "",
            link: piece.link_url ?? "https://www.entiremind.com",
            image_hash: adimage.id,
            call_to_action: { type: ctaOrDefault(piece.cta) },
          },
        },
      },
      configured,
    );

    // 5. The ad itself — PAUSED by default so nothing spends until the
    // founder flips it on in Ads Manager (or ads_launch_paused is disabled)
    const ad = await metaFetch(
      `${account}/ads`,
      {
        name: piece.headline ?? piece.id,
        adset_id: adset.id,
        creative: { creative_id: creative.id },
        status: req.launchPaused ? "PAUSED" : "ACTIVE",
      },
      configured,
    );

    return {
      success: true,
      metaCampaignId,
      adSetId: adset.id,
      creativeId: creative.id,
      adId: ad.id,
      placeholder: placeholder || adset.placeholder,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Meta ad launch failed",
    };
  }
}

async function publishInstagramPost(req: PublishPostRequest): Promise<PublishResult> {
  const configured = igConfigured();
  const env = metaEnv();
  const ig = `/${env.igBusinessId ?? "IG_BUSINESS_ID"}`;
  const { piece } = req;

  const imageUrl = req.media.find((m) => m.public_url)?.public_url;
  if (!imageUrl && configured) {
    return { success: false, error: "No ready media asset with a public URL" };
  }

  const caption = [piece.caption ?? "", piece.hashtags.map((h) => `#${h}`).join(" ")]
    .filter(Boolean)
    .join("\n\n");

  try {
    // Two-step IG publish: create media container, then publish it
    const container = await metaFetch(
      `${ig}/media`,
      { image_url: imageUrl ?? "https://placeholder.invalid/post.png", caption },
      configured,
    );
    const published = await metaFetch(
      `${ig}/media_publish`,
      { creation_id: container.id },
      configured,
    );

    return {
      success: true,
      externalPostId: published.id,
      placeholder: published.placeholder,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Instagram publish failed",
    };
  }
}

async function getMetrics(req: MetricsRequest): Promise<MetricsResult> {
  // PLACEHOLDER: real implementation is
  //   GET /{ad_id}/insights?fields=impressions,clicks,spend,actions
  //     &time_increment=1&time_range={since,until}
  // for ads, and GET /{media_id}/insights for organic IG posts.
  if (!adsConfigured() && !igConfigured()) {
    // Deterministic fake data keeps analytics/experiments exercisable;
    // rows are flagged placeholder and replaced once real creds report.
    return {
      success: true,
      daily: buildPlaceholderDailyMetrics(req.piece, req.since, new Date().toISOString().slice(0, 10)),
      placeholder: true,
    };
  }
  return { success: false, error: "Meta metrics not yet implemented for live credentials" };
}

export const metaAdsAdapter: PublisherAdapter = {
  platform: "meta_ads",
  isConfigured: adsConfigured,
  // meta_ads is the paid channel: organic publishPost is not supported
  async publishPost(): Promise<PublishResult> {
    return { success: false, error: "meta_ads is ads-only; use launchAd" };
  },
  launchAd,
  getMetrics,
};

export const instagramAdapter: PublisherAdapter = {
  platform: "instagram",
  isConfigured: igConfigured,
  publishPost: publishInstagramPost,
  getMetrics,
};
