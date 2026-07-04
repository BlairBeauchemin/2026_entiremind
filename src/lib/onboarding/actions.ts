"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { sendSms, sendWelcomeSms } from "@/lib/sms";
import { generateMessageForUser } from "@/lib/ai";
import {
  buildSeedMemoryFromOnboarding,
  loadUserMemory,
  mergeProfileIntoMemory,
} from "@/lib/ai/memory";
import { scoreProfile } from "@/lib/persona/score";
import { QUIZ_VERSION } from "@/lib/persona/questions";
import { buildWelcomeArchetypeLine } from "@/lib/persona/content";
import type { PersonaProfile, QuizAnswers } from "@/lib/persona/types";

type ActionResult = { success: true } | { error: string };

/**
 * Revalidate all paths that display intention data
 */
function revalidateIntentionPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/intentions");
}

export async function updateOnboardingName(
  name: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("users")
    .update({ name })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

export async function updateOnboardingPhone(
  phone: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("users")
    .update({ phone })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Save the user's initial intention.
 * Does NOT complete onboarding — that happens at the final step
 * (completeFullOnboarding) once vision/obstacles/aligned-state are collected.
 */
export async function createInitialIntention(
  text: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // If an active intention already exists, update it instead of inserting a duplicate
  const { data: existing } = await supabase
    .from("intentions")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .single();

  if (existing) {
    const { error: updateError } = await supabase
      .from("intentions")
      .update({ text })
      .eq("id", existing.id);
    if (updateError) return { error: updateError.message };
  } else {
    const { error: insertError } = await supabase.from("intentions").insert({
      user_id: user.id,
      text,
      status: "active",
    });
    if (insertError) return { error: insertError.message };
  }

  revalidateIntentionPaths();
  return { success: true };
}

interface CompletionPayload {
  /** Raw quiz answers — re-scored server-side (never trust a client profile). */
  answers: QuizAnswers;
  vision: string;
  /** Screen 14 is skippable. */
  alignedState: string | null;
}

/** Map a derived profile to the user_profiles row shape. */
function profileRow(userId: string, profile: PersonaProfile) {
  return {
    user_id: userId,
    archetype: profile.archetype,
    motivation_orientation: profile.motivation_orientation,
    change_style: profile.change_style,
    primary_distortion: profile.primary_distortion,
    secondary_distortion: profile.secondary_distortion,
    distortion_scores: profile.distortion_scores,
    core_values: profile.core_values,
    tone_preference: profile.tone_preference,
    intention_category: profile.intention_category,
    quiz_version: QUIZ_VERSION,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Finalize onboarding (Archetype Discovery flow):
 *  - re-derive the persona profile server-side from the raw answers
 *  - persist raw answers + reflections to onboarding_responses
 *  - upsert the derived user_profiles row (retried once; tolerated on failure)
 *  - seed user_memory, mark the user onboarded, fire the welcome SMS
 * Called from the reveal step.
 */
export async function completeFullOnboarding(
  payload: CompletionPayload,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const vision = payload.vision.trim();
  const alignedState = payload.alignedState?.trim() || null;
  if (!vision) {
    return { error: "Please answer all questions" };
  }

  // Server is authoritative for scoring — same pure function the client used.
  const profile = scoreProfile(payload.answers);

  const { data: intentionRow } = await supabase
    .from("intentions")
    .select("text")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const intentionText = intentionRow?.text;
  if (!intentionText) {
    return { error: "No active intention found. Please go back and set one." };
  }

  const { error: responsesError } = await supabase
    .from("onboarding_responses")
    .upsert(
      {
        user_id: user.id,
        intention: intentionText,
        vision,
        obstacles: null,
        aligned_state: alignedState,
        responses: payload.answers,
        quiz_version: QUIZ_VERSION,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (responsesError) {
    return { error: responsesError.message };
  }

  // Persist the derived profile. Onboarding still completes if this fails
  // (daily send tolerates a missing profile); retry once, then log.
  const row = profileRow(user.id, profile);
  let profileError = (
    await supabase.from("user_profiles").upsert(row, { onConflict: "user_id" })
  ).error;
  if (profileError) {
    console.error("Profile upsert failed, retrying:", profileError.message);
    profileError = (
      await supabase
        .from("user_profiles")
        .upsert(row, { onConflict: "user_id" })
    ).error;
    if (profileError) {
      console.error("Profile upsert failed after retry:", profileError.message);
    }
  }

  // Seed memory from onboarding so the first daily prompt has context to work with.
  // Service-role client because the user_memory table is admin-only RLS.
  const adminClient = createServiceRoleClient();
  const seed = buildSeedMemoryFromOnboarding({
    intention: intentionText,
    vision,
    obstacles: null,
    aligned_state: alignedState,
    profile,
  });
  const tokenCount = Math.ceil(JSON.stringify(seed).length / 4);
  await adminClient.from("user_memory").upsert(
    {
      user_id: user.id,
      summary: seed,
      version: 1,
      token_count: tokenCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  const { error: completeError } = await supabase
    .from("users")
    .update({ onboarding_completed: true })
    .eq("id", user.id);

  if (completeError) {
    return { error: completeError.message };
  }

  const { data: userData } = await supabase
    .from("users")
    .select("name, phone")
    .eq("id", user.id)
    .single();

  if (userData?.phone) {
    try {
      const smsResult = await sendWelcomeSms(
        user.id,
        userData.name || "",
        userData.phone,
        buildWelcomeArchetypeLine(profile),
      );
      if (!smsResult.success) {
        console.error("Failed to send welcome SMS:", smsResult.error);
      }
    } catch (error) {
      console.error("Error sending welcome SMS:", error);
    }

    // First real prompt arrives while the reveal is still fresh, instead of
    // waiting for the next morning's cron. Runs after the response is sent so
    // the AI call doesn't delay the reveal step. The prompt counts toward
    // daily-send's "already sent today" check, so the user won't be double-
    // prompted by a same-day cron run.
    const phone = userData.phone;
    after(async () => {
      try {
        const generated = await generateMessageForUser(user.id, "reflection");
        const result = await sendSms(user.id, phone, generated.text, {
          contentType: generated.contentType,
          aiGenerated: true,
        });
        if (!result.success) {
          console.error("Failed to send first prompt SMS:", result.error);
        }
      } catch (error) {
        console.error("Error sending first prompt SMS:", error);
      }
    });
  }

  revalidateIntentionPaths();
  return { success: true };
}

/**
 * Existing-user backfill (Milestone 5): complete the shortened archetype quiz.
 *
 * Unlike completeFullOnboarding, this does NOT touch onboarding_completed, the
 * intention, vision/aligned-state, or the welcome SMS. It re-derives the profile
 * server-side, archives any prior profile to history, persists the new one,
 * merges the raw answers into onboarding_responses, and refreshes ONLY the
 * persona-derived fields of the user's (possibly months-old) memory.
 */
export async function completeArchetypeQuiz(payload: {
  answers: QuizAnswers;
}): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Server is authoritative for scoring.
  const profile = scoreProfile(payload.answers);

  // Service-role client for the admin-only writes below (history + memory):
  // user_profile_history and user_memory have no authenticated RLS insert path.
  const adminClient = createServiceRoleClient();

  // Archive the prior profile (if any) before replacing it. Uses the service
  // role because user_profile_history is admin/service-role only under RLS.
  const { data: priorProfile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (priorProfile) {
    const { error: archiveError } = await adminClient
      .from("user_profile_history")
      .insert({ user_id: user.id, profile: priorProfile });
    if (archiveError) {
      console.error("Failed to archive prior profile:", archiveError.message);
    }
  }

  const row = profileRow(user.id, profile);
  let profileError = (
    await supabase.from("user_profiles").upsert(row, { onConflict: "user_id" })
  ).error;
  if (profileError) {
    console.error(
      "Archetype profile upsert failed, retrying:",
      profileError.message,
    );
    profileError = (
      await supabase
        .from("user_profiles")
        .upsert(row, { onConflict: "user_id" })
    ).error;
    if (profileError) {
      return { error: profileError.message };
    }
  }

  // Merge raw answers into the existing onboarding_responses row (update only —
  // never overwrite intention/vision/aligned-state collected at first onboarding).
  await supabase
    .from("onboarding_responses")
    .update({
      responses: payload.answers,
      quiz_version: QUIZ_VERSION,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  // Refresh only the persona-derived memory fields; preserve compacted history.
  const existingMemory = await loadUserMemory(user.id);
  const summary = existingMemory
    ? mergeProfileIntoMemory(existingMemory, profile)
    : buildSeedMemoryFromOnboarding({ profile });
  const tokenCount = Math.ceil(JSON.stringify(summary).length / 4);
  await adminClient.from("user_memory").upsert(
    {
      user_id: user.id,
      summary,
      version: 1,
      token_count: tokenCount,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );

  revalidatePath("/dashboard");
  return { success: true };
}

/** Persist dismissal of the dashboard "discover your archetype" banner. */
export async function dismissArchetypeBanner(): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("users")
    .update({ archetype_banner_dismissed_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}

/**
 * Best-effort drop-off tracking: record that the user entered a given step.
 * Fire-and-forget — analytics, never blocks the flow.
 */
export async function recordOnboardingStep(step: string): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from("onboarding_step_events").insert({
      user_id: user.id,
      step,
      quiz_version: QUIZ_VERSION,
    });
  } catch (error) {
    console.error("Failed to record onboarding step:", error);
  }
}

export async function updateIntention(
  id: string,
  text: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // 1. Mark the old intention as completed (preserves history)
  const { error: archiveError } = await supabase
    .from("intentions")
    .update({
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (archiveError) {
    return { error: archiveError.message };
  }

  // 2. Create new active intention with the new text
  const { error: createError } = await supabase.from("intentions").insert({
    user_id: user.id,
    text,
    status: "active",
  });

  if (createError) {
    return { error: createError.message };
  }

  revalidateIntentionPaths();
  return { success: true };
}
