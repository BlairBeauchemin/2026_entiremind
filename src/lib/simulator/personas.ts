import { randomBytes } from "crypto";
import { createServiceRoleClient } from "../supabase";
import { buildSeedMemoryFromOnboarding } from "../ai/memory";
import { scoreProfile } from "../persona/score";
import { QUIZ_VERSION } from "../persona/questions";
import type { PersonaProfile } from "../persona/types";
import type { CreateTestPersonaInput } from "./types";

/** Map a derived profile to the user_profiles row shape (mirrors onboarding). */
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

/** Sim day 1 lands (totalDays - 1) days ago so the final day is today. */
export function defaultStartDate(totalDays = 7): string {
  const d = new Date();
  d.setDate(d.getDate() - (totalDays - 1));
  return d.toISOString().slice(0, 10);
}

/**
 * Create a test persona: a real auth user + the same rows the web onboarding
 * writes (intention, onboarding_responses, user_profiles, seeded memory),
 * flagged is_test with no phone so no SMS path can ever reach it. Also opens
 * the persona's first simulation run.
 */
export async function createTestPersona(
  input: CreateTestPersonaInput,
): Promise<{ userId: string; runId: string }> {
  const supabase = createServiceRoleClient();

  // Real auth user (users.id FKs auth.users). The handle_new_user trigger
  // creates the public.users row; the signals trigger creates user_signals.
  const email = `sim-${Date.now()}-${randomBytes(4).toString("hex")}@sim.entiremind.test`;
  const { data: created, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      email_confirm: true,
      password: randomBytes(24).toString("base64url"),
    });
  if (createError || !created?.user) {
    throw new Error(
      `Failed to create test auth user: ${createError?.message ?? "unknown"}`,
    );
  }
  const userId = created.user.id;

  const { error: userError } = await supabase
    .from("users")
    .update({
      name: input.name,
      is_test: true,
      status: "active",
      onboarding_completed: true,
    })
    .eq("id", userId);
  if (userError) {
    throw new Error(`Failed to flag test user: ${userError.message}`);
  }

  const { error: intentionError } = await supabase.from("intentions").insert({
    user_id: userId,
    text: input.intention,
    status: "active",
  });
  if (intentionError) {
    throw new Error(`Failed to create intention: ${intentionError.message}`);
  }

  // Server-side scoring, same pure function the real onboarding uses.
  const profile = scoreProfile(input.answers);

  const { error: responsesError } = await supabase
    .from("onboarding_responses")
    .upsert(
      {
        user_id: userId,
        intention: input.intention,
        vision: input.vision,
        obstacles: null,
        aligned_state: input.alignedState,
        responses: input.answers,
        quiz_version: QUIZ_VERSION,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );
  if (responsesError) {
    throw new Error(
      `Failed to save onboarding responses: ${responsesError.message}`,
    );
  }

  const { error: profileError } = await supabase
    .from("user_profiles")
    .upsert(profileRow(userId, profile), { onConflict: "user_id" });
  if (profileError) {
    throw new Error(`Failed to save profile: ${profileError.message}`);
  }

  const seed = buildSeedMemoryFromOnboarding({
    intention: input.intention,
    vision: input.vision,
    obstacles: null,
    aligned_state: input.alignedState,
    profile,
  });
  const { error: memoryError } = await supabase.from("user_memory").upsert(
    {
      user_id: userId,
      summary: seed,
      version: 1,
      token_count: Math.ceil(JSON.stringify(seed).length / 4),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id" },
  );
  if (memoryError) {
    throw new Error(`Failed to seed memory: ${memoryError.message}`);
  }

  const { data: run, error: runError } = await supabase
    .from("sim_runs")
    .insert({
      user_id: userId,
      start_date: defaultStartDate(),
      persona_brief: input.personaBrief,
      reply_style: input.replyStyle,
      pinned_prompt_id: input.pinnedPromptId ?? null,
    })
    .select("id")
    .single();
  if (runError || !run) {
    throw new Error(
      `Failed to create sim run: ${runError?.message ?? "unknown"}`,
    );
  }

  return { userId, runId: run.id };
}

/**
 * Delete a test persona entirely. Deleting the auth user cascades through
 * public.users to messages, intentions, profiles, memory, signals, and sim
 * tables. Refuses to touch non-test users.
 */
export async function deleteTestPersona(userId: string): Promise<void> {
  const supabase = createServiceRoleClient();

  const { data: user } = await supabase
    .from("users")
    .select("id, is_test")
    .eq("id", userId)
    .single();
  if (!user?.is_test) {
    throw new Error("Refusing to delete: user is not a test persona");
  }

  const { error } = await supabase.auth.admin.deleteUser(userId);
  if (error) {
    throw new Error(`Failed to delete test user: ${error.message}`);
  }
}
