import { createServiceRoleClient } from "../supabase";
import { generateMessageForUser, buildUserContext } from "../ai";
import {
  enrichInboundReply,
  loadKnownPatterns,
  persistEnrichment,
} from "../ai/enrich";
import { compactUserMemory, buildSeedMemoryFromOnboarding } from "../ai/memory";
import { pickSoftAck } from "../acks";
import { trackReply, trackSilence } from "../signals";
import { recomputeUserSignals } from "../signals/compute";
import { scoreProfile } from "../persona/score";
import { simulatePersonaReply } from "./persona";
import { defaultStartDate } from "./personas";
import type { PersonaProposal, ReplyStyle, SimDayResult } from "./types";
import type { QuizAnswers } from "../persona/types";

/** Simulated morning send: 15:45 UTC mirrors the real 7:45 AM Pacific cron. */
const SEND_HOUR_UTC = 15;
const SEND_MINUTE_UTC = 45;

export function dayTimestamps(
  startDate: string,
  dayNumber: number,
): { outboundAt: Date; simDate: string } {
  const outboundAt = new Date(`${startDate}T00:00:00.000Z`);
  outboundAt.setUTCDate(outboundAt.getUTCDate() + (dayNumber - 1));
  outboundAt.setUTCHours(SEND_HOUR_UTC, SEND_MINUTE_UTC, 0, 0);
  return { outboundAt, simDate: outboundAt.toISOString().slice(0, 10) };
}

interface RunRow {
  id: string;
  user_id: string;
  status: "active" | "awaiting_review" | "completed" | "archived";
  start_date: string;
  current_day: number;
  total_days: number;
  pinned_prompt_id: string | null;
  persona_brief: string;
  reply_style: ReplyStyle;
}

async function loadRun(runId: string): Promise<RunRow> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("sim_runs")
    .select(
      "id, user_id, status, start_date, current_day, total_days, pinned_prompt_id, persona_brief, reply_style",
    )
    .eq("id", runId)
    .single();
  if (error || !data) throw new Error("Sim run not found");
  return data as RunRow;
}

async function loadHistory(
  runId: string,
): Promise<{ day: number; direction: "outbound" | "inbound"; text: string }[]> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("sim_days")
    .select("day_number, outbound_text, inbound_text")
    .eq("run_id", runId)
    .order("day_number", { ascending: true });
  const history: {
    day: number;
    direction: "outbound" | "inbound";
    text: string;
  }[] = [];
  for (const row of data ?? []) {
    if (row.outbound_text) {
      history.push({
        day: row.day_number,
        direction: "outbound",
        text: row.outbound_text,
      });
    }
    if (row.inbound_text) {
      history.push({
        day: row.day_number,
        direction: "inbound",
        text: row.inbound_text,
      });
    }
  }
  return history;
}

/**
 * Run the next simulated day up to the review point: generate the morning
 * message with the day's reference time, store it as a backdated simulated
 * outbound, and ask the persona model for a proposed reaction. Nothing is
 * committed — the founder reviews (and can edit) before commitDay.
 *
 * Idempotent per day: re-stepping while a day is pending review returns the
 * existing pending day instead of generating again.
 */
export async function stepDay(runId: string): Promise<SimDayResult> {
  const supabase = createServiceRoleClient();
  const run = await loadRun(runId);

  if (run.status === "completed" || run.status === "archived") {
    throw new Error(`Run is ${run.status}`);
  }
  const day = run.current_day + 1;
  if (day > run.total_days) throw new Error("Simulated week already complete");

  // Existing pending day (double-click / re-entry): return it unchanged.
  const { data: existing } = await supabase
    .from("sim_days")
    .select("day_number, sim_date, outbound_text, status, debug")
    .eq("run_id", runId)
    .eq("day_number", day)
    .maybeSingle();
  if (existing && existing.status === "pending_review") {
    const debug = (existing.debug ?? {}) as Record<string, unknown>;
    return {
      dayNumber: existing.day_number,
      simDate: existing.sim_date,
      outboundText: existing.outbound_text ?? "",
      contentType: String(debug.content_type ?? ""),
      fallback: Boolean(debug.fallback),
      proposal: (debug.proposal as PersonaProposal | undefined) ?? null,
      status: "pending_review",
    };
  }

  const { outboundAt, simDate } = dayTimestamps(run.start_date, day);

  const generated = await generateMessageForUser(run.user_id, undefined, {
    asOf: outboundAt,
    systemPromptId: run.pinned_prompt_id,
  });

  const { data: outbound, error: outboundError } = await supabase
    .from("messages")
    .insert({
      user_id: run.user_id,
      direction: "outbound",
      from_number: "simulator",
      to_number: "simulator",
      text: generated.text,
      provider: "simulator",
      status: "sent",
      content_type: generated.contentType,
      ai_generated: true,
      created_at: outboundAt.toISOString(),
    })
    .select("id")
    .single();
  if (outboundError || !outbound) {
    throw new Error(
      `Failed to store simulated outbound: ${outboundError?.message ?? "unknown"}`,
    );
  }

  // Mirror sendSms's bookkeeping (the simulator bypasses sendSms entirely).
  await supabase.from("user_signals").upsert(
    {
      user_id: run.user_id,
      last_message_sent_at: outboundAt.toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  const context = await buildUserContext(run.user_id, outboundAt);
  const history = await loadHistory(runId);
  const proposal = await simulatePersonaReply({
    personaBrief: run.persona_brief,
    replyStyle: run.reply_style,
    profile: context.profile,
    intention: context.intention,
    dayNumber: day,
    todaysMessage: generated.text,
    history,
  });

  const debug: Record<string, unknown> = {
    user_prompt: generated.userPrompt,
    system_prompt_id: generated.systemPromptId,
    system_prompt_name: generated.systemPromptName,
    content_type: generated.contentType,
    fallback: generated.fallback,
    truncated: generated.truncated,
    selection: generated.selection ?? null,
    proposal,
    engagement_before: {
      score: context.engagementScore,
      consecutive_silences: context.consecutiveSilences,
    },
  };

  const { error: dayError } = await supabase.from("sim_days").upsert(
    {
      run_id: runId,
      day_number: day,
      sim_date: simDate,
      outbound_message_id: outbound.id,
      outbound_text: generated.text,
      status: "pending_review",
      debug,
    },
    { onConflict: "run_id,day_number" },
  );
  if (dayError) {
    throw new Error(`Failed to store sim day: ${dayError.message}`);
  }

  await supabase
    .from("sim_runs")
    .update({ status: "awaiting_review" })
    .eq("id", runId);

  return {
    dayNumber: day,
    simDate,
    outboundText: generated.text,
    contentType: generated.contentType,
    fallback: generated.fallback,
    proposal,
    status: "pending_review",
  };
}

/**
 * Commit the pending day: apply the persona's (possibly founder-edited)
 * reaction through the real pipeline — inbound message, enrichment, themes,
 * signal tracking — then advance the run. On the final day, compact memory
 * with the simulated week's end as the reference time.
 */
export async function commitDay(
  runId: string,
  action: "reply" | "silence",
  text?: string | null,
): Promise<SimDayResult> {
  const supabase = createServiceRoleClient();
  const run = await loadRun(runId);

  if (run.status !== "awaiting_review") {
    throw new Error("No day is pending review");
  }
  const day = run.current_day + 1;

  const { data: dayRow, error: dayError } = await supabase
    .from("sim_days")
    .select("id, sim_date, outbound_message_id, outbound_text, debug, status")
    .eq("run_id", runId)
    .eq("day_number", day)
    .single();
  if (dayError || !dayRow) throw new Error("Pending sim day not found");
  if (dayRow.status !== "pending_review") {
    throw new Error("Day already committed");
  }

  const debug = (dayRow.debug ?? {}) as Record<string, unknown>;
  const proposal = (debug.proposal as PersonaProposal | undefined) ?? null;
  const { outboundAt } = dayTimestamps(run.start_date, day);

  const replyText = action === "reply" ? (text ?? proposal?.text ?? "") : null;
  if (action === "reply" && !replyText?.trim()) {
    throw new Error("Reply text required");
  }
  const founderEdited =
    action === "reply" &&
    Boolean(text) &&
    text !== (proposal?.action === "reply" ? proposal.text : null);

  let inboundMessageId: string | null = null;

  if (action === "reply" && replyText) {
    const delayMinutes = proposal?.delayMinutes || 47;
    const replyAt = new Date(outboundAt.getTime() + delayMinutes * 60_000);

    const { data: inbound, error: inboundError } = await supabase
      .from("messages")
      .insert({
        user_id: run.user_id,
        direction: "inbound",
        from_number: "simulator",
        to_number: "simulator",
        text: replyText,
        provider: "simulator",
        status: "received",
        reply_to_message_id: dayRow.outbound_message_id,
        created_at: replyAt.toISOString(),
      })
      .select("id")
      .single();
    if (inboundError || !inbound) {
      throw new Error(
        `Failed to store simulated reply: ${inboundError?.message ?? "unknown"}`,
      );
    }
    inboundMessageId = inbound.id;

    // Real enrichment pipeline (insights + themes), same as the SMS webhook.
    const knownPatterns = await loadKnownPatterns(supabase, run.user_id);
    const enrichment = await enrichInboundReply(replyText, knownPatterns);
    if (enrichment) {
      await persistEnrichment(supabase, {
        userId: run.user_id,
        inboundMessageId: inbound.id,
        enrichment,
      });
    }

    // Record the ack the real system would have sent (nothing is sent).
    const wouldBeAck =
      enrichment?.substantive && enrichment.acknowledgement
        ? { text: enrichment.acknowledgement, kind: "ai_mirror" }
        : { text: await pickSoftAck(run.user_id), kind: "soft_ack" };

    await trackReply({
      userId: run.user_id,
      inboundMessageId: inbound.id,
      outboundMessageId: dayRow.outbound_message_id,
      replyTimeMinutes: delayMinutes,
      replyLength: replyText.length,
    });

    debug.enrichment = enrichment ?? null;
    debug.would_be_ack = wouldBeAck;
  } else {
    if (dayRow.outbound_message_id) {
      await trackSilence({
        userId: run.user_id,
        outboundMessageId: dayRow.outbound_message_id,
      });
    }
  }

  debug.founder_edited = founderEdited;
  debug.committed_action = action;

  const isFinalDay = day >= run.total_days;
  if (isFinalDay) {
    // End-of-week memory compaction, anchored to the simulated week's end.
    const endOfWeek = new Date(outboundAt.getTime() + 12 * 60 * 60_000);
    try {
      const summary = await compactUserMemory(run.user_id, endOfWeek);
      debug.compacted_memory = summary ?? null;
    } catch (err) {
      console.error("Sim memory compaction failed:", err);
      debug.compacted_memory_error =
        err instanceof Error ? err.message : "unknown";
    }
  }

  const { error: updateDayError } = await supabase
    .from("sim_days")
    .update({
      status: "committed",
      persona_action: action,
      inbound_message_id: inboundMessageId,
      inbound_text: action === "reply" ? replyText : null,
      debug,
    })
    .eq("id", dayRow.id);
  if (updateDayError) {
    throw new Error(`Failed to commit sim day: ${updateDayError.message}`);
  }

  // Advance with a compare-and-set guard so double-submits can't skip days.
  const { data: advanced, error: advanceError } = await supabase
    .from("sim_runs")
    .update({
      current_day: day,
      status: isFinalDay ? "completed" : "active",
    })
    .eq("id", runId)
    .eq("current_day", day - 1)
    .select("id");
  if (advanceError || !advanced || advanced.length === 0) {
    throw new Error("Failed to advance run (concurrent update?)");
  }

  return {
    dayNumber: day,
    simDate: dayRow.sim_date,
    outboundText: dayRow.outbound_text ?? "",
    contentType: String(debug.content_type ?? ""),
    fallback: Boolean(debug.fallback),
    proposal,
    status: "committed",
  };
}

/**
 * Batch mode: run every remaining day, auto-committing the persona's
 * proposals unedited. If a day is already pending review, it is committed
 * with its existing proposal first.
 */
export async function runRemainingDays(runId: string): Promise<SimDayResult[]> {
  const results: SimDayResult[] = [];
  // Re-load each iteration so status/current_day are fresh.
  for (;;) {
    const run = await loadRun(runId);
    if (run.status === "completed" || run.status === "archived") break;
    if (run.current_day >= run.total_days) break;

    let pending: SimDayResult;
    if (run.status === "awaiting_review") {
      const { data: dayRow } = await createServiceRoleClient()
        .from("sim_days")
        .select("debug")
        .eq("run_id", runId)
        .eq("day_number", run.current_day + 1)
        .single();
      const proposal =
        ((dayRow?.debug as Record<string, unknown> | null)
          ?.proposal as PersonaProposal | undefined) ?? null;
      pending = await commitDay(
        runId,
        proposal?.action ?? "silence",
        proposal?.text ?? null,
      );
    } else {
      await stepDay(runId);
      const run2 = await loadRun(runId);
      const { data: dayRow } = await createServiceRoleClient()
        .from("sim_days")
        .select("debug")
        .eq("run_id", runId)
        .eq("day_number", run2.current_day + 1)
        .single();
      const proposal =
        ((dayRow?.debug as Record<string, unknown> | null)
          ?.proposal as PersonaProposal | undefined) ?? null;
      pending = await commitDay(
        runId,
        proposal?.action ?? "silence",
        proposal?.text ?? null,
      );
    }
    results.push(pending);
  }
  return results;
}

/**
 * Wipe a persona's live simulation state: simulated messages (cascade covers
 * message_themes), their signal events, memory history from sim compactions,
 * and sim-generated intention shift suggestions; then reseed memory from
 * onboarding and recompute signals.
 */
async function wipeSimulationState(
  userId: string,
  runId: string,
  opts: { deleteSimDays: boolean },
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { data: days } = await supabase
    .from("sim_days")
    .select("outbound_message_id, inbound_message_id")
    .eq("run_id", runId);

  const messageIds = (days ?? [])
    .flatMap((d) => [d.outbound_message_id, d.inbound_message_id])
    .filter((id): id is string => Boolean(id));

  if (messageIds.length > 0) {
    await supabase
      .from("signal_events")
      .delete()
      .or(
        `message_id.in.(${messageIds.join(",")}),outbound_message_id.in.(${messageIds.join(",")})`,
      );
    await supabase.from("messages").delete().in("id", messageIds);
  }

  // Sim-week compaction side effects.
  await supabase.from("user_memory_history").delete().eq("user_id", userId);
  await supabase
    .from("intention_shift_suggestions")
    .delete()
    .eq("user_id", userId);

  if (opts.deleteSimDays) {
    await supabase.from("sim_days").delete().eq("run_id", runId);
  }

  // Reseed memory from the persona's onboarding answers.
  const { data: onboarding } = await supabase
    .from("onboarding_responses")
    .select("intention, vision, obstacles, aligned_state, responses")
    .eq("user_id", userId)
    .maybeSingle();
  if (onboarding) {
    const profile = onboarding.responses
      ? scoreProfile(onboarding.responses as QuizAnswers)
      : null;
    const seed = buildSeedMemoryFromOnboarding({
      intention: onboarding.intention,
      vision: onboarding.vision,
      obstacles: onboarding.obstacles,
      aligned_state: onboarding.aligned_state,
      profile,
    });
    await supabase.from("user_memory").upsert(
      {
        user_id: userId,
        summary: seed,
        version: 1,
        token_count: Math.ceil(JSON.stringify(seed).length / 4),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  }

  await recomputeUserSignals(userId);
}

/** Full reset: wipe state and rewind the run to day 0. */
export async function resetRun(runId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const run = await loadRun(runId);

  await wipeSimulationState(run.user_id, runId, { deleteSimDays: true });

  const { error } = await supabase
    .from("sim_runs")
    .update({
      current_day: 0,
      status: "active",
      start_date: defaultStartDate(run.total_days),
    })
    .eq("id", runId);
  if (error) throw new Error(`Failed to reset run: ${error.message}`);
}

/**
 * A/B mechanic: archive the current run (its sim_days text snapshots stay
 * readable), wipe the persona's live state, and open a fresh run — same
 * persona, optionally pinned to a different prompt version.
 */
export async function newRun(
  runId: string,
  pinnedPromptId?: string | null,
): Promise<{ runId: string }> {
  const supabase = createServiceRoleClient();
  const run = await loadRun(runId);

  // Keep the archived run's sim_days (text + debug snapshots survive the
  // message wipe via ON DELETE SET NULL).
  await wipeSimulationState(run.user_id, runId, { deleteSimDays: false });

  await supabase
    .from("sim_runs")
    .update({ status: "archived" })
    .eq("id", runId);

  const { data: created, error } = await supabase
    .from("sim_runs")
    .insert({
      user_id: run.user_id,
      start_date: defaultStartDate(run.total_days),
      total_days: run.total_days,
      persona_brief: run.persona_brief,
      reply_style: run.reply_style,
      pinned_prompt_id:
        pinnedPromptId !== undefined ? pinnedPromptId : run.pinned_prompt_id,
    })
    .select("id")
    .single();
  if (error || !created) {
    throw new Error(`Failed to create new run: ${error?.message ?? "unknown"}`);
  }
  return { runId: created.id };
}
