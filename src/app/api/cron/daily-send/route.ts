import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { sendSms } from "@/lib/sms";
import { generateMessageForUser, getAiProvider } from "@/lib/ai";
import { takePendingRecap } from "@/lib/ai/memory";
import { getUserSignals } from "@/lib/signals";
import {
  loadSilenceRecoveryConfig,
  decideSilenceRecovery,
  hasReconnectSinceLastReply,
  buildReconnectMessage,
  buildPauseMessage,
} from "@/lib/reconnect";
import { loadEntitlement } from "@/lib/billing/entitlement";
import {
  decideUpgradeNudge,
  getUpgradeMessagesSince,
  buildTrialEndMessage,
  buildUpgradeFollowupMessage,
  loadUpgradeTheme,
} from "@/lib/billing/upgrade";
import { buildUpgradeLink } from "@/lib/billing/token";

/**
 * Daily Send Cron: Send AI-generated messages to all active users
 * Runs daily at 7:45 AM Pacific via Vercel Cron
 *
 * Per user, in priority order:
 *  1. Entitlement gate — expired-trial users don't get the daily loop; they
 *     get the upgrade path (trial-end message, one follow-up, then quiet).
 *  2. Silence recovery — a reconnect nudge once the silence streak crosses
 *     the reconnect threshold; a farewell + auto-pause once it crosses the
 *     pause threshold (only ever after an unanswered reconnect).
 *  3. Weekly recap — if the Monday memory pass staged one, it replaces the
 *     regular prompt.
 *  4. The regular AI-generated daily prompt.
 *
 * Security: Protected by CRON_SECRET header (Vercel adds this automatically)
 */
export async function GET(request: Request) {
  const startTime = Date.now();

  // Verify cron secret for security
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error("CRON_SECRET environment variable not set");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 },
    );
  }

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.error("Invalid cron authorization");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check if AI provider is configured
  const aiProvider = getAiProvider();
  const apiKeyEnvVar =
    aiProvider === "openai" ? "OPENAI_API_KEY" : "ANTHROPIC_API_KEY";
  if (!process.env[apiKeyEnvVar]) {
    console.error(`${apiKeyEnvVar} environment variable not set`);
    return NextResponse.json(
      { error: `AI provider (${aiProvider}) not configured` },
      { status: 500 },
    );
  }

  console.log(`Using AI provider: ${aiProvider}`);

  const supabase = createServiceRoleClient();

  // Get all active users with phone numbers who have completed onboarding.
  // Test personas (is_test) belong to the founder simulator and must never
  // receive real sends.
  const { data: activeUsers, error: usersError } = await supabase
    .from("users")
    .select("id, phone, name, status")
    .eq("status", "active")
    .eq("onboarding_completed", true)
    .eq("is_test", false)
    .not("phone", "is", null);

  if (usersError) {
    console.error("Failed to fetch active users:", usersError);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }

  if (!activeUsers || activeUsers.length === 0) {
    console.log("No active users to send messages to");
    return NextResponse.json({
      success: true,
      processed: 0,
      sent: 0,
      failed: 0,
      message: "No active users with phone numbers",
    });
  }

  console.log(`Processing ${activeUsers.length} active users for daily send`);

  const recoveryConfig = await loadSilenceRecoveryConfig();

  let sent = 0;
  let failed = 0;
  let reconnects = 0;
  let paused = 0;
  let recaps = 0;
  let upgrades = 0;
  let gated = 0;
  const errors: Array<{ userId: string; error: string }> = [];

  // Process users sequentially to avoid rate limits
  for (const user of activeUsers) {
    if (!user.phone) continue;

    try {
      // Check if we already sent a daily prompt to this user today.
      // Exclude 'ack' (reactive responses to replies) and 'billing'
      // (payment notices) — neither should block the morning prompt.
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const { data: todayMessages } = await supabase
        .from("messages")
        .select("id")
        .eq("user_id", user.id)
        .eq("direction", "outbound")
        .or("content_type.not.in.(ack,billing),content_type.is.null")
        .gte("created_at", todayStart.toISOString())
        .limit(1);

      if (todayMessages && todayMessages.length > 0) {
        console.log(
          `User ${user.id} already received a message today, skipping`,
        );
        continue;
      }

      // 1) Entitlement gate: expired-trial users leave the daily loop and
      //    enter the upgrade path — at most two messages, then quiet.
      //    Inbound acks continue for everyone via the webhook.
      const { entitlement, trialEndsAt } = await loadEntitlement(user.id);
      if (entitlement === "expired") {
        gated++;
        const nudge = decideUpgradeNudge({
          upgradeSentAts: trialEndsAt
            ? await getUpgradeMessagesSince(user.id, trialEndsAt)
            : [],
        });

        if (nudge !== "none") {
          // Tokenized one-tap checkout link; falls back to the settings URL
          // inside the builders if UPGRADE_LINK_SECRET isn't configured.
          const link = buildUpgradeLink(user.id, "upgrade");
          const text =
            nudge === "send-first"
              ? buildTrialEndMessage(
                  user.name,
                  await loadUpgradeTheme(user.id),
                  link,
                )
              : buildUpgradeFollowupMessage(user.name, link);
          const result = await sendSms(user.id, user.phone, text, {
            contentType: "upgrade",
          });
          if (result.success) {
            sent++;
            upgrades++;
            console.log(`Sent ${nudge} upgrade message to user ${user.id}`);
          } else {
            failed++;
            errors.push({ userId: user.id, error: result.error || "Unknown error" });
          }
        }
        continue;
      }

      // 2) Silence recovery: reconnect or pause instead of prompting into
      //    the void. A reply to anything resets the streak via the webhook.
      const signals = await getUserSignals(user.id);
      const consecutiveSilences = signals?.consecutiveSilences ?? 0;

      if (consecutiveSilences >= recoveryConfig.reconnectAfterSilences) {
        const action = decideSilenceRecovery({
          consecutiveSilences,
          config: recoveryConfig,
          reconnectSentSinceLastReply: await hasReconnectSinceLastReply(
            user.id,
            signals?.lastReplyAt ?? null,
          ),
        });

        if (action === "pause") {
          const farewell = buildPauseMessage(user.name);
          const result = await sendSms(user.id, user.phone, farewell, {
            contentType: "reconnect",
          });
          if (result.success) {
            const { error: pauseError } = await supabase
              .from("users")
              .update({ status: "paused" })
              .eq("id", user.id);
            if (pauseError) {
              console.error(`Failed to pause user ${user.id}:`, pauseError);
            } else {
              paused++;
              console.log(
                `Paused user ${user.id} after ${consecutiveSilences} consecutive silences`,
              );
            }
            sent++;
          } else {
            failed++;
            errors.push({ userId: user.id, error: result.error || "Unknown error" });
          }
          continue;
        }

        if (action === "reconnect") {
          const result = await sendSms(
            user.id,
            user.phone,
            buildReconnectMessage(user.name),
            { contentType: "reconnect" },
          );
          if (result.success) {
            sent++;
            reconnects++;
            console.log(
              `Sent reconnect to user ${user.id} (${consecutiveSilences} consecutive silences)`,
            );
          } else {
            failed++;
            errors.push({ userId: user.id, error: result.error || "Unknown error" });
          }
          continue;
        }
        // action === "none": reconnect already sent this stretch but the
        // pause threshold isn't reached — fall through to the regular prompt.
      }

      // 3) Weekly recap: if the Monday memory pass staged one, send it in
      //    place of the regular prompt (claiming it also clears it).
      const recap = await takePendingRecap(user.id);
      if (recap) {
        const result = await sendSms(user.id, user.phone, recap, {
          contentType: "recap",
          aiGenerated: true,
        });
        if (result.success) {
          sent++;
          recaps++;
          console.log(`Sent weekly recap to user ${user.id}`);
        } else {
          failed++;
          errors.push({ userId: user.id, error: result.error || "Unknown error" });
        }
        continue;
      }

      // 4) Generate AI message for this user
      const generatedMessage = await generateMessageForUser(user.id);

      // Send the SMS
      const result = await sendSms(user.id, user.phone, generatedMessage.text, {
        contentType: generatedMessage.contentType,
        aiGenerated: !generatedMessage.quoteId,
        quoteId: generatedMessage.quoteId,
        techniqueId: generatedMessage.techniqueId,
      });

      if (result.success) {
        sent++;
        console.log(
          `Sent daily message to user ${user.id}: "${generatedMessage.text.substring(0, 50)}..."`,
        );
      } else {
        failed++;
        errors.push({
          userId: user.id,
          error: result.error || "Unknown error",
        });
        console.error(`Failed to send to user ${user.id}:`, result.error);
      }

      // Small delay between sends to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      failed++;
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      errors.push({ userId: user.id, error: errorMessage });
      console.error(`Exception sending to user ${user.id}:`, error);
    }
  }

  const duration = Date.now() - startTime;
  console.log(
    `Daily send complete: ${sent} sent (${recaps} recaps, ${reconnects} reconnects, ${paused} paused, ${upgrades} upgrades, ${gated} gated), ${failed} failed in ${duration}ms`,
  );

  return NextResponse.json({
    success: true,
    processed: activeUsers.length,
    sent,
    failed,
    recaps,
    reconnects,
    paused,
    upgrades,
    gated,
    duration_ms: duration,
    errors: errors.length > 0 ? errors : undefined,
  });
}
