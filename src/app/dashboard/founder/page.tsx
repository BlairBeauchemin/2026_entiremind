export const dynamic = "force-dynamic";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { redirect } from "next/navigation";
import { FounderMessageTable } from "@/components/dashboard/founder-message-table";
import { SchedulingSection } from "@/components/dashboard/scheduling-section";
import { UserSignalsTable } from "@/components/dashboard/user-signals-table";
import {
  IntentionShiftReview,
  type IntentionShiftItem,
} from "@/components/dashboard/intention-shift-review";
import {
  FounderUserInsights,
  type FounderUserInsight,
} from "@/components/dashboard/founder-user-insights";
import { logAdminViewedMessages } from "@/lib/audit";
import { FounderRefreshButton } from "@/components/dashboard/founder-refresh-button";

const INSIGHT_LOOKBACK_DAYS = 30;
const SENTIMENT_LOOKBACK_DAYS = 14;

export default async function FounderPage() {
  const supabase = await createClient();

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser) {
    redirect("/auth");
  }

  // Fetch user profile with role from database
  const { data: userProfile } = await supabase
    .from("users")
    .select("role")
    .eq("id", authUser.id)
    .single();

  // Check if the current user has admin/founder role
  const isAdmin = ["admin", "founder"].includes(userProfile?.role ?? "");
  if (!isAdmin) {
    redirect("/dashboard");
  }

  // Use service role client for admin queries (bypasses RLS)
  const serviceSupabase = createServiceRoleClient();

  // Fetch all messages with user info
  const { data: messages, error } = await serviceSupabase
    .from("messages")
    .select(
      `
      *,
      users:user_id (
        name,
        email,
        phone
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching messages:", error);
  }
  const { data: scheduledMessages, error: scheduledError } = await serviceSupabase
    .from("scheduled_messages")
    .select("*")
    .order("scheduled_for", { ascending: false })
    .limit(50);

  if (scheduledError) {
    console.error("Error fetching scheduled messages:", scheduledError);
  }

  // Fetch user signals with user info
  const { data: userSignals, error: signalsError } = await serviceSupabase
    .from("user_signals")
    .select(
      `
      *,
      users:user_id (
        name,
        email
      )
    `
    )
    .order("engagement_score", { ascending: false })
    .limit(50);

  if (signalsError) {
    console.error("Error fetching user signals:", signalsError);
  }

  // Pending intention shift suggestions
  const { data: shiftsRaw } = await serviceSupabase
    .from("intention_shift_suggestions")
    .select(
      `
      *,
      users:user_id (
        name,
        email
      )
    `
    )
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  type ShiftRow = {
    id: string;
    current_intention: string;
    proposed_intention: string;
    confidence: number | null;
    rationale: string | null;
    created_at: string;
    users: { name: string | null; email: string } | null;
  };

  const intentionShifts: IntentionShiftItem[] = (
    (shiftsRaw as ShiftRow[] | null) ?? []
  ).map((row) => ({
    id: row.id,
    userName: row.users?.name ?? null,
    userEmail: row.users?.email ?? "Unknown",
    currentIntention: row.current_intention,
    proposedIntention: row.proposed_intention,
    confidence: row.confidence !== null ? Number(row.confidence) : null,
    rationale: row.rationale,
    createdAt: row.created_at,
  }));

  // Per-user insights: memory + recent themes + sentiment trend + reply-rate-by-type
  const insights = await buildUserInsights(serviceSupabase);

  // Transform user signals for display
  const formattedSignals =
    userSignals?.map((signal) => ({
      userId: signal.user_id,
      userName: (signal.users as { name: string | null })?.name || null,
      userEmail: (signal.users as { email: string })?.email || "Unknown",
      totalMessagesSent: signal.total_messages_sent,
      totalReplies: signal.total_replies,
      replyRate: signal.reply_rate,
      avgReplyTimeMinutes: signal.avg_reply_time_minutes,
      consecutiveSilences: signal.consecutive_silences,
      engagementScore: signal.engagement_score,
      lastReplyAt: signal.last_reply_at,
    })) || [];

  // Transform scheduled messages for display
  const formattedScheduledMessages =
    scheduledMessages?.map((msg) => ({
      id: msg.id,
      toPhone: msg.to_phone,
      text: msg.text,
      scheduledFor: msg.scheduled_for,
      status: msg.status,
      createdAt: msg.created_at,
    })) || [];

  // Log audit entry for admin viewing messages
  await logAdminViewedMessages(authUser.id, messages?.length ?? 0);

  // Transform messages for display
  const formattedMessages =
    messages?.map((msg) => ({
      id: msg.id,
      direction: msg.direction,
      text: msg.text,
      status: msg.status,
      createdAt: msg.created_at,
      fromNumber: msg.from_number,
      toNumber: msg.to_number,
      userName: (msg.users as { name: string | null })?.name || "Unknown",
      userPhone: (msg.users as { phone: string | null })?.phone || msg.from_number,
    })) || [];

  return (
    <div className="space-y-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl md:text-4xl text-navy font-medium">
            Founder Review
          </h1>
          <p className="text-muted-foreground mt-2">
            View all user messages to understand patterns and improve the experience.
          </p>
        </div>
        <FounderRefreshButton />
      </div>

      <div>
        <h2 className="font-serif text-2xl text-navy font-medium mb-2">
          Intention Shift Suggestions
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Detected by the weekly memory pass. Approve to update the user&apos;s active intention; dismiss to keep the current one.
        </p>
        <IntentionShiftReview items={intentionShifts} />
      </div>

      <div>
        <h2 className="font-serif text-2xl text-navy font-medium mb-2">
          Per-User Insights
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Memory blob, recent themes, sentiment trend, and reply rate by content type for each user. Click to expand.
        </p>
        <FounderUserInsights insights={insights} />
      </div>

      <SchedulingSection initialMessages={formattedScheduledMessages} />

      <div>
        <h2 className="font-serif text-2xl text-navy font-medium mb-4">
          User Engagement Signals
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Engagement scores and behavioral signals for all users. Higher scores indicate more engaged users.
        </p>
        <UserSignalsTable signals={formattedSignals} />
      </div>

      <div>
        <h2 className="font-serif text-2xl text-navy font-medium mb-4">
          User Messages
        </h2>
        <FounderMessageTable messages={formattedMessages} />
      </div>
    </div>
  );
}

type ServiceClient = ReturnType<typeof createServiceRoleClient>;

async function buildUserInsights(
  supabase: ServiceClient
): Promise<FounderUserInsight[]> {
  // Pull every user that has a memory row OR has signal activity.
  const { data: memoryRows } = await supabase
    .from("user_memory")
    .select(
      `
      user_id,
      summary,
      updated_at,
      users:user_id ( name, email )
    `
    )
    .order("updated_at", { ascending: false });

  type MemoryRow = {
    user_id: string;
    summary: FounderUserInsight["memory"];
    updated_at: string;
    users: { name: string | null; email: string } | null;
  };

  const rows = (memoryRows as MemoryRow[] | null) ?? [];
  if (rows.length === 0) return [];

  const userIds = rows.map((r) => r.user_id);

  // Themes (last 30 days)
  const themeCutoff = new Date();
  themeCutoff.setDate(themeCutoff.getDate() - INSIGHT_LOOKBACK_DAYS);

  const { data: themeRows } = await supabase
    .from("message_themes")
    .select("user_id, theme, category")
    .in("user_id", userIds)
    .gte("created_at", themeCutoff.toISOString());

  type ThemeRow = { user_id: string; theme: string; category: string };
  const themesByUser = new Map<string, Map<string, { category: string; count: number }>>();
  for (const t of (themeRows as ThemeRow[] | null) ?? []) {
    const bucket = themesByUser.get(t.user_id) ?? new Map();
    const existing = bucket.get(t.theme);
    bucket.set(t.theme, {
      category: t.category,
      count: (existing?.count ?? 0) + 1,
    });
    themesByUser.set(t.user_id, bucket);
  }

  // Sentiment trend (last 14 days, from messages.insights)
  const sentimentCutoff = new Date();
  sentimentCutoff.setDate(sentimentCutoff.getDate() - SENTIMENT_LOOKBACK_DAYS);

  const { data: sentimentRows } = await supabase
    .from("messages")
    .select("user_id, insights")
    .in("user_id", userIds)
    .eq("direction", "inbound")
    .gte("created_at", sentimentCutoff.toISOString());

  type SentimentRow = {
    user_id: string;
    insights: { sentiment?: "positive" | "neutral" | "struggling" } | null;
  };
  const sentimentByUser = new Map<
    string,
    { positive: number; neutral: number; struggling: number }
  >();
  for (const s of (sentimentRows as SentimentRow[] | null) ?? []) {
    const bucket = sentimentByUser.get(s.user_id) ?? {
      positive: 0,
      neutral: 0,
      struggling: 0,
    };
    const sentiment = s.insights?.sentiment;
    if (sentiment === "positive") bucket.positive++;
    else if (sentiment === "struggling") bucket.struggling++;
    else if (sentiment === "neutral") bucket.neutral++;
    sentimentByUser.set(s.user_id, bucket);
  }

  // Reply-rate-by-type (last 30 days)
  const rateCutoff = new Date();
  rateCutoff.setDate(rateCutoff.getDate() - INSIGHT_LOOKBACK_DAYS);

  const { data: outboundRows } = await supabase
    .from("messages")
    .select("id, user_id, content_type")
    .in("user_id", userIds)
    .eq("direction", "outbound")
    .gte("created_at", rateCutoff.toISOString());

  type OutboundForRate = { id: string; user_id: string; content_type: string | null };
  const outbounds = (outboundRows as OutboundForRate[] | null) ?? [];
  const outboundIds = outbounds.map((o) => o.id);

  const repliedIds = new Set<string>();
  if (outboundIds.length > 0) {
    const { data: inboundRows } = await supabase
      .from("messages")
      .select("reply_to_message_id")
      .in("reply_to_message_id", outboundIds);
    type InboundRow = { reply_to_message_id: string | null };
    for (const r of (inboundRows as InboundRow[] | null) ?? []) {
      if (r.reply_to_message_id) repliedIds.add(r.reply_to_message_id);
    }
  }

  const ratesByUser = new Map<
    string,
    Record<string, { sends: number; replies: number; rate: number }>
  >();
  for (const o of outbounds) {
    if (!o.content_type || o.content_type === "ack" || o.content_type === "welcome") {
      continue;
    }
    const userMap = ratesByUser.get(o.user_id) ?? {};
    const stat = userMap[o.content_type] ?? { sends: 0, replies: 0, rate: 0 };
    stat.sends++;
    if (repliedIds.has(o.id)) stat.replies++;
    userMap[o.content_type] = stat;
    ratesByUser.set(o.user_id, userMap);
  }
  for (const userMap of ratesByUser.values()) {
    for (const stat of Object.values(userMap)) {
      stat.rate = stat.sends > 0 ? stat.replies / stat.sends : 0;
    }
  }

  return rows.map((row) => {
    const themeMap = themesByUser.get(row.user_id) ?? new Map();
    const recentThemes = Array.from(themeMap.entries())
      .map(([theme, v]) => ({ theme, category: v.category, count: v.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);
    return {
      userId: row.user_id,
      userName: row.users?.name ?? null,
      userEmail: row.users?.email ?? "Unknown",
      memory: row.summary,
      memoryUpdatedAt: row.updated_at,
      recentThemes,
      sentimentTrend:
        sentimentByUser.get(row.user_id) ?? {
          positive: 0,
          neutral: 0,
          struggling: 0,
        },
      replyRateByType: ratesByUser.get(row.user_id) ?? {},
    };
  });
}
