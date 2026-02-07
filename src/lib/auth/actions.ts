"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const timezone = formData.get("timezone") as string;

  const updates: Record<string, string | null> = {};

  if (name !== undefined) updates.name = name || null;
  if (email !== undefined) updates.email = email || null;
  if (timezone !== undefined) updates.timezone = timezone;

  const { error } = await supabase
    .from("users")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function updateMessagingStatus(status: "active" | "paused") {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("users")
    .update({ status })
    .eq("id", user.id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}

export async function getUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { user: null, profile: null };
  }

  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return { user, profile };
}
