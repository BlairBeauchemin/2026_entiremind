"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase";
import { revalidatePath } from "next/cache";
import { sendWelcomeSms } from "@/lib/sms";
import { buildSeedMemoryFromOnboarding } from "@/lib/ai/memory";

type ActionResult = { success: true } | { error: string };

/**
 * Revalidate all paths that display intention data
 */
function revalidateIntentionPaths() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/intentions");
}

export async function updateOnboardingName(name: string): Promise<ActionResult> {
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

export async function updateOnboardingPhone(phone: string): Promise<ActionResult> {
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
export async function createInitialIntention(text: string): Promise<ActionResult> {
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

interface CompletionAnswers {
  vision: string;
  obstacles: string;
  alignedState: string;
}

/**
 * Finalize onboarding: persist the four reflection answers, seed user_memory,
 * mark the user onboarded, and fire the welcome SMS. Called from the final step
 * of the web onboarding flow.
 */
export async function completeFullOnboarding(
  answers: CompletionAnswers
): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const vision = answers.vision.trim();
  const obstacles = answers.obstacles.trim();
  const alignedState = answers.alignedState.trim();
  if (!vision || !obstacles || !alignedState) {
    return { error: "Please answer all questions" };
  }

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
        obstacles,
        aligned_state: alignedState,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (responsesError) {
    return { error: responsesError.message };
  }

  // Seed memory from onboarding so the first daily prompt has context to work with.
  // Service-role client because the user_memory table is admin-only RLS.
  const adminClient = createServiceRoleClient();
  const seed = buildSeedMemoryFromOnboarding({
    intention: intentionText,
    vision,
    obstacles,
    aligned_state: alignedState,
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
    { onConflict: "user_id" }
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
        userData.phone
      );
      if (!smsResult.success) {
        console.error("Failed to send welcome SMS:", smsResult.error);
      }
    } catch (error) {
      console.error("Error sending welcome SMS:", error);
    }
  }

  revalidateIntentionPaths();
  return { success: true };
}

export async function updateIntention(
  id: string,
  text: string
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
