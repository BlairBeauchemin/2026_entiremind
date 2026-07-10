import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Marketing engine enums (shared by Database types and src/lib/marketing)
export type MarketingPlatform = "meta_ads" | "instagram" | "tiktok" | "youtube";
export type ContentTarget = "ad" | "organic";
export type ContentFormat =
  | "image_ad"
  | "video_ad"
  | "carousel_ad"
  | "post"
  | "reel"
  | "story"
  | "short";
export type ProductionMode = "ai_generated" | "founder_filmed";
export type ContentPieceStatus =
  | "draft"
  | "generating"
  | "awaiting_footage"
  | "pending_review"
  | "approved"
  | "rejected"
  | "scheduled"
  | "publishing"
  | "published"
  | "launched"
  | "failed";
export type MediaKind = "image" | "video";
export type MediaGenerator = "gemini" | "veo" | "manual";
export type MediaAssetStatus = "pending" | "generating" | "ready" | "failed";
export type TrendSource =
  | "ai_research"
  | "google_trends"
  | "tiktok_creative_center"
  | "manual";
export type CampaignType = "paid_ads" | "organic" | "mixed";
export type CampaignStatus =
  | "draft"
  | "planning"
  | "active"
  | "paused"
  | "completed"
  | "archived";
export type PublishMode = "require_approval" | "auto_publish";

// Database types
export type Database = {
  public: {
    Tables: {
      leads: {
        Row: {
          id: string;
          name: string | null;
          email: string;
          phone: string | null;
          source: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name?: string | null;
          email: string | null;
          phone?: string | null;
          source?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string | null;
          email?: string | null;
          phone?: string | null;
          source?: string | null;
          created_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          email: string;
          phone: string | null;
          name: string | null;
          timezone: string;
          preferred_send_hour: number;
          status: "active" | "paused" | "cancelled";
          role: "user" | "admin" | "founder";
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          phone?: string | null;
          name?: string | null;
          timezone?: string;
          preferred_send_hour?: number;
          status?: "active" | "paused" | "cancelled";
          role?: "user" | "admin" | "founder";
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          phone?: string | null;
          name?: string | null;
          timezone?: string;
          preferred_send_hour?: number;
          status?: "active" | "paused" | "cancelled";
          role?: "user" | "admin" | "founder";
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      intentions: {
        Row: {
          id: string;
          user_id: string;
          text: string;
          status: "active" | "completed" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          text: string;
          status?: "active" | "completed" | "archived";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          text?: string;
          status?: "active" | "completed" | "archived";
          created_at?: string;
          updated_at?: string;
        };
      };
      messages: {
        Row: {
          id: string;
          user_id: string;
          direction: "inbound" | "outbound";
          from_number: string;
          to_number: string;
          text: string;
          external_message_id: string | null;
          provider: "telnyx" | "twilio";
          status: "pending" | "sent" | "delivered" | "failed" | "received";
          content_type: "reflection" | "quote" | "check-in" | "action" | "gratitude" | "welcome" | "manual" | null;
          ai_generated: boolean;
          reply_to_message_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          direction: "inbound" | "outbound";
          from_number: string;
          to_number: string;
          text: string;
          external_message_id?: string | null;
          provider?: "telnyx" | "twilio";
          status?: "pending" | "sent" | "delivered" | "failed" | "received";
          content_type?: "reflection" | "quote" | "check-in" | "action" | "gratitude" | "welcome" | "manual" | null;
          ai_generated?: boolean;
          reply_to_message_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          direction?: "inbound" | "outbound";
          from_number?: string;
          to_number?: string;
          text?: string;
          external_message_id?: string | null;
          provider?: "telnyx" | "twilio";
          status?: "pending" | "sent" | "delivered" | "failed" | "received";
          content_type?: "reflection" | "quote" | "check-in" | "action" | "gratitude" | "welcome" | "manual" | null;
          ai_generated?: boolean;
          reply_to_message_id?: string | null;
          created_at?: string;
        };
      };
      signal_events: {
        Row: {
          id: string;
          user_id: string;
          event_type: "reply" | "silence" | "unprompted" | "quick_reply" | "long_reply" | "stop_request";
          message_id: string | null;
          outbound_message_id: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          event_type: "reply" | "silence" | "unprompted" | "quick_reply" | "long_reply" | "stop_request";
          message_id?: string | null;
          outbound_message_id?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          event_type?: "reply" | "silence" | "unprompted" | "quick_reply" | "long_reply" | "stop_request";
          message_id?: string | null;
          outbound_message_id?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
      };
      user_signals: {
        Row: {
          id: string;
          user_id: string;
          total_messages_sent: number;
          total_replies: number;
          reply_rate: number | null;
          avg_reply_time_minutes: number | null;
          avg_reply_length: number | null;
          last_reply_at: string | null;
          last_message_sent_at: string | null;
          consecutive_silences: number;
          engagement_score: number;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_messages_sent?: number;
          total_replies?: number;
          reply_rate?: number | null;
          avg_reply_time_minutes?: number | null;
          avg_reply_length?: number | null;
          last_reply_at?: string | null;
          last_message_sent_at?: string | null;
          consecutive_silences?: number;
          engagement_score?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_messages_sent?: number;
          total_replies?: number;
          reply_rate?: number | null;
          avg_reply_time_minutes?: number | null;
          avg_reply_length?: number | null;
          last_reply_at?: string | null;
          last_message_sent_at?: string | null;
          consecutive_silences?: number;
          engagement_score?: number;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          resource_type: string;
          resource_id: string | null;
          metadata: Record<string, unknown>;
          ip_address: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          resource_type: string;
          resource_id?: string | null;
          metadata?: Record<string, unknown>;
          ip_address?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          resource_type?: string;
          resource_id?: string | null;
          metadata?: Record<string, unknown>;
          ip_address?: string | null;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          plan: "free" | "monthly" | "yearly";
          status: "active" | "paused" | "cancelled" | "past_due" | "trialing";
          current_period_end: string | null;
          cancel_at_period_end: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: "free" | "monthly" | "yearly";
          status?: "active" | "paused" | "cancelled" | "past_due" | "trialing";
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          plan?: "free" | "monthly" | "yearly";
          status?: "active" | "paused" | "cancelled" | "past_due" | "trialing";
          current_period_end?: string | null;
          cancel_at_period_end?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      scheduled_messages: {
        Row: {
          id: string;
          user_id: string;
          to_phone: string;
          text: string;
          scheduled_for: string;
          status: "pending" | "sent" | "failed" | "cancelled";
          sent_message_id: string | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          to_phone: string;
          text: string;
          scheduled_for: string;
          status?: "pending" | "sent" | "failed" | "cancelled";
          sent_message_id?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          to_phone?: string;
          text?: string;
          scheduled_for?: string;
          status?: "pending" | "sent" | "failed" | "cancelled";
          sent_message_id?: string | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      brands: {
        Row: {
          id: string;
          name: string;
          slug: string;
          description: string | null;
          product_summary: string;
          brand_voice: string;
          target_audience: string;
          visual_style: string;
          website_url: string | null;
          status: "active" | "paused";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          description?: string | null;
          product_summary?: string;
          brand_voice?: string;
          target_audience?: string;
          visual_style?: string;
          website_url?: string | null;
          status?: "active" | "paused";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          description?: string | null;
          product_summary?: string;
          brand_voice?: string;
          target_audience?: string;
          visual_style?: string;
          website_url?: string | null;
          status?: "active" | "paused";
          created_at?: string;
          updated_at?: string;
        };
      };
      brand_channels: {
        Row: {
          id: string;
          brand_id: string;
          platform: MarketingPlatform;
          publish_mode: PublishMode;
          connected: boolean;
          external_account_id: string | null;
          credentials: Record<string, unknown>;
          config: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          platform: MarketingPlatform;
          publish_mode?: PublishMode;
          connected?: boolean;
          external_account_id?: string | null;
          credentials?: Record<string, unknown>;
          config?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          platform?: MarketingPlatform;
          publish_mode?: PublishMode;
          connected?: boolean;
          external_account_id?: string | null;
          credentials?: Record<string, unknown>;
          config?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
      trend_snapshots: {
        Row: {
          id: string;
          brand_id: string;
          source: TrendSource;
          summary: string;
          insights: Array<Record<string, unknown>>;
          raw: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          source: TrendSource;
          summary: string;
          insights?: Array<Record<string, unknown>>;
          raw?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          source?: TrendSource;
          summary?: string;
          insights?: Array<Record<string, unknown>>;
          raw?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
      marketing_campaigns: {
        Row: {
          id: string;
          brand_id: string;
          name: string;
          objective: string;
          campaign_type: CampaignType;
          status: CampaignStatus;
          brief: string | null;
          strategy: Record<string, unknown>;
          trend_snapshot_id: string | null;
          total_budget_cents: number | null;
          daily_budget_cents: number | null;
          currency: string;
          targeting: Record<string, unknown>;
          starts_at: string | null;
          ends_at: string | null;
          meta_campaign_id: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          name: string;
          objective?: string;
          campaign_type?: CampaignType;
          status?: CampaignStatus;
          brief?: string | null;
          strategy?: Record<string, unknown>;
          trend_snapshot_id?: string | null;
          total_budget_cents?: number | null;
          daily_budget_cents?: number | null;
          currency?: string;
          targeting?: Record<string, unknown>;
          starts_at?: string | null;
          ends_at?: string | null;
          meta_campaign_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          name?: string;
          objective?: string;
          campaign_type?: CampaignType;
          status?: CampaignStatus;
          brief?: string | null;
          strategy?: Record<string, unknown>;
          trend_snapshot_id?: string | null;
          total_budget_cents?: number | null;
          daily_budget_cents?: number | null;
          currency?: string;
          targeting?: Record<string, unknown>;
          starts_at?: string | null;
          ends_at?: string | null;
          meta_campaign_id?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      content_pieces: {
        Row: {
          id: string;
          brand_id: string;
          campaign_id: string | null;
          target: ContentTarget;
          platform: MarketingPlatform;
          format: ContentFormat;
          production_mode: ProductionMode;
          status: ContentPieceStatus;
          headline: string | null;
          body_copy: string | null;
          caption: string | null;
          script: string | null;
          image_prompt: string | null;
          cta: string | null;
          hashtags: string[];
          link_url: string | null;
          angle: string | null;
          generation_context: Record<string, unknown>;
          daily_budget_cents: number | null;
          targeting: Record<string, unknown> | null;
          meta_adset_id: string | null;
          meta_ad_id: string | null;
          meta_creative_id: string | null;
          review_note: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          scheduled_for: string | null;
          published_at: string | null;
          external_post_id: string | null;
          last_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          campaign_id?: string | null;
          target: ContentTarget;
          platform: MarketingPlatform;
          format: ContentFormat;
          production_mode?: ProductionMode;
          status?: ContentPieceStatus;
          headline?: string | null;
          body_copy?: string | null;
          caption?: string | null;
          script?: string | null;
          image_prompt?: string | null;
          cta?: string | null;
          hashtags?: string[];
          link_url?: string | null;
          angle?: string | null;
          generation_context?: Record<string, unknown>;
          daily_budget_cents?: number | null;
          targeting?: Record<string, unknown> | null;
          meta_adset_id?: string | null;
          meta_ad_id?: string | null;
          meta_creative_id?: string | null;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          scheduled_for?: string | null;
          published_at?: string | null;
          external_post_id?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          campaign_id?: string | null;
          target?: ContentTarget;
          platform?: MarketingPlatform;
          format?: ContentFormat;
          production_mode?: ProductionMode;
          status?: ContentPieceStatus;
          headline?: string | null;
          body_copy?: string | null;
          caption?: string | null;
          script?: string | null;
          image_prompt?: string | null;
          cta?: string | null;
          hashtags?: string[];
          link_url?: string | null;
          angle?: string | null;
          generation_context?: Record<string, unknown>;
          daily_budget_cents?: number | null;
          targeting?: Record<string, unknown> | null;
          meta_adset_id?: string | null;
          meta_ad_id?: string | null;
          meta_creative_id?: string | null;
          review_note?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          scheduled_for?: string | null;
          published_at?: string | null;
          external_post_id?: string | null;
          last_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      media_assets: {
        Row: {
          id: string;
          brand_id: string;
          content_piece_id: string | null;
          kind: MediaKind;
          generator: MediaGenerator;
          model: string | null;
          prompt: string;
          storage_path: string | null;
          public_url: string | null;
          mime_type: string | null;
          width: number | null;
          height: number | null;
          duration_seconds: number | null;
          status: MediaAssetStatus;
          error: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          brand_id: string;
          content_piece_id?: string | null;
          kind: MediaKind;
          generator: MediaGenerator;
          model?: string | null;
          prompt?: string;
          storage_path?: string | null;
          public_url?: string | null;
          mime_type?: string | null;
          width?: number | null;
          height?: number | null;
          duration_seconds?: number | null;
          status?: MediaAssetStatus;
          error?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          brand_id?: string;
          content_piece_id?: string | null;
          kind?: MediaKind;
          generator?: MediaGenerator;
          model?: string | null;
          prompt?: string;
          storage_path?: string | null;
          public_url?: string | null;
          mime_type?: string | null;
          width?: number | null;
          height?: number | null;
          duration_seconds?: number | null;
          status?: MediaAssetStatus;
          error?: string | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
      };
      content_metrics: {
        Row: {
          id: string;
          content_piece_id: string;
          brand_id: string;
          platform: string;
          metric_date: string;
          impressions: number;
          clicks: number;
          spend_cents: number;
          conversions: number;
          likes: number;
          comments: number;
          shares: number;
          views: number;
          raw: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          content_piece_id: string;
          brand_id: string;
          platform: string;
          metric_date: string;
          impressions?: number;
          clicks?: number;
          spend_cents?: number;
          conversions?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          views?: number;
          raw?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          content_piece_id?: string;
          brand_id?: string;
          platform?: string;
          metric_date?: string;
          impressions?: number;
          clicks?: number;
          spend_cents?: number;
          conversions?: number;
          likes?: number;
          comments?: number;
          shares?: number;
          views?: number;
          raw?: Record<string, unknown> | null;
          created_at?: string;
        };
      };
      marketing_engine_config: {
        Row: {
          id: number;
          enabled: boolean;
          weekly_pieces_per_brand: number;
          max_generations_per_run: number;
          max_publishes_per_run: number;
          default_daily_budget_cents: number;
          ads_launch_paused: boolean;
          video_enabled: boolean;
          image_provider: string;
          video_provider: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          enabled?: boolean;
          weekly_pieces_per_brand?: number;
          max_generations_per_run?: number;
          max_publishes_per_run?: number;
          default_daily_budget_cents?: number;
          ads_launch_paused?: boolean;
          video_enabled?: boolean;
          image_provider?: string;
          video_provider?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          enabled?: boolean;
          weekly_pieces_per_brand?: number;
          max_generations_per_run?: number;
          max_publishes_per_run?: number;
          default_daily_budget_cents?: number;
          ads_launch_paused?: boolean;
          video_enabled?: boolean;
          image_provider?: string;
          video_provider?: string;
          updated_at?: string;
        };
      };
    };
  };
};

export type DbUser = Database["public"]["Tables"]["users"]["Row"];
export type Lead = Database["public"]["Tables"]["leads"]["Row"];
export type Intention = Database["public"]["Tables"]["intentions"]["Row"];
export type DbMessage = Database["public"]["Tables"]["messages"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type DbSubscription = Database["public"]["Tables"]["subscriptions"]["Row"];
export type ScheduledMessage = Database["public"]["Tables"]["scheduled_messages"]["Row"];
export type SignalEvent = Database["public"]["Tables"]["signal_events"]["Row"];
export type UserSignals = Database["public"]["Tables"]["user_signals"]["Row"];
export type BrandRow = Database["public"]["Tables"]["brands"]["Row"];
export type BrandChannelRow = Database["public"]["Tables"]["brand_channels"]["Row"];
export type TrendSnapshotRow = Database["public"]["Tables"]["trend_snapshots"]["Row"];
export type MarketingCampaignRow = Database["public"]["Tables"]["marketing_campaigns"]["Row"];
export type ContentPieceRow = Database["public"]["Tables"]["content_pieces"]["Row"];
export type MediaAssetRow = Database["public"]["Tables"]["media_assets"]["Row"];
export type ContentMetricRow = Database["public"]["Tables"]["content_metrics"]["Row"];
export type MarketingEngineConfigRow = Database["public"]["Tables"]["marketing_engine_config"]["Row"];

// Lazy-initialized browser client
let browserClient: SupabaseClient | null = null;

/**
 * @deprecated Use `createClient` from `@/lib/supabase/client` for client components
 * or `createClient` from `@/lib/supabase/server` for server components
 */
export function getSupabaseClient() {
  if (browserClient) return browserClient;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Supabase environment variables are not set");
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}

// Server-side client with service role key (for API routes)
export function createServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase environment variables are not set");
  }

  return createClient(supabaseUrl, serviceRoleKey);
}

/**
 * @deprecated Use `createServiceRoleClient` instead
 */
export const createServerClient = createServiceRoleClient;
