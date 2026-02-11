"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendWelcomeSms } from "@/lib/sms";

type ActionResult = { success: true } | { error: string };

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

export async function createInitialIntention(text: string): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Create the intention
  const { error: intentionError } = await supabase.from("intentions").insert({
    user_id: user.id,
    text,
    status: "active",
  });

  if (intentionError) {
    return { error: intentionError.message };
  }

  // Mark onboarding as completed
  const { error: userError } = await supabase
    .from("users")
    .update({ onboarding_completed: true })
    .eq("id", user.id);

  if (userError) {
    return { error: userError.message };
  }

  // Get user data for welcome SMS
  const { data: userData } = await supabase
    .from("users")
    .select("name, phone")
    .eq("id", user.id)
    .single();

  // Send welcome SMS if user has a phone number
  if (userData?.phone) {
    try {
      const smsResult = await sendWelcomeSms(
        user.id,
        userData.name || "",
        userData.phone
      );
      if (!smsResult.success) {
        console.error("Failed to send welcome SMS:", smsResult.error);
        // Don't fail the onboarding if SMS fails - just log it
      }
    } catch (error) {
      console.error("Error sending welcome SMS:", error);
      // Don't fail the onboarding if SMS fails
    }
  }

  revalidatePath("/dashboard");
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

  const { error } = await supabase
    .from("intentions")
    .update({ text, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  return { success: true };
}
