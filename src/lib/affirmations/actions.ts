"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildUserContext } from "@/lib/ai";
import { generateStrictJson } from "@/lib/ai/json";
import {
  AFFIRMATION_SYSTEM_PROMPT,
  DRAFT_MAX_COUNT,
  DRAFT_MIN_COUNT,
  buildAffirmationPrompt,
} from "@/lib/ai/prompts/affirmations";
import {
  MAX_ACTIVE_AFFIRMATIONS,
  MAX_AFFIRMATION_LENGTH,
  nextPosition,
  normalizeAffirmationText,
  resequence,
  validateAffirmationText,
} from "./index";
import type { Affirmation, AffirmationSource } from "./types";

/**
 * Server actions for the user's own affirmations.
 *
 * Every write goes through the RLS-scoped client (`createClient`), never the
 * service-role client — the row-level policy is the actual ownership check, and
 * the explicit `user_id` filters below are belt-and-braces on top of it.
 */

type ActionResult = { success: true } | { error: string };

const GENERIC_WRITE_ERROR = "Could not save that. Try again in a moment.";

/** Columns the app reads. Kept in one place so every query stays in step. */
const AFFIRMATION_COLUMNS = "id, text, source, position";

function toAffirmation(row: {
  id: string;
  text: string;
  source: string;
  position: number;
}): Affirmation {
  return {
    id: row.id,
    text: row.text,
    source: row.source as AffirmationSource,
    position: row.position,
  };
}

async function requireUserId(): Promise<
  { userId: string } | { error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };
  return { userId: user.id };
}

/**
 * Read the user's active affirmations in display order.
 *
 * Exported for the drawer's post-write refresh: the drawer re-reads rather than
 * patching local state so the on-screen order can never drift from the stored
 * order after a partial failure.
 */
export async function listAffirmations(): Promise<Affirmation[]> {
  const auth = await requireUserId();
  if ("error" in auth) return [];

  const supabase = await createClient();
  const { data } = await supabase
    .from("affirmations")
    .select(AFFIRMATION_COLUMNS)
    .eq("user_id", auth.userId)
    .eq("status", "active")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });

  return (data ?? []).map(toAffirmation);
}

export async function createAffirmation(
  rawText: string,
  source: AffirmationSource = "user",
): Promise<{ affirmation: Affirmation } | { error: string }> {
  const auth = await requireUserId();
  if ("error" in auth) return auth;

  const validated = validateAffirmationText(rawText);
  if (!validated.ok) return { error: validated.error };

  const supabase = await createClient();

  // One read serves both the cap check and the tail position. Positions can
  // legitimately have gaps (archiving leaves them behind), so the count of rows
  // is not a safe next position — nextPosition() reads the real maximum.
  const { data: existing } = await supabase
    .from("affirmations")
    .select("position")
    .eq("user_id", auth.userId)
    .eq("status", "active");

  const current = existing ?? [];
  if (current.length >= MAX_ACTIVE_AFFIRMATIONS) {
    return {
      error: `That's ${MAX_ACTIVE_AFFIRMATIONS} affirmations — plenty to sit with. Archive one to make room.`,
    };
  }

  const { data, error } = await supabase
    .from("affirmations")
    .insert({
      user_id: auth.userId,
      text: validated.text,
      source,
      position: nextPosition(current),
    })
    .select(AFFIRMATION_COLUMNS)
    .single();

  if (error || !data) return { error: GENERIC_WRITE_ERROR };

  revalidatePath("/space");
  return { affirmation: toAffirmation(data) };
}

export async function updateAffirmationText(
  id: string,
  rawText: string,
): Promise<ActionResult> {
  const auth = await requireUserId();
  if ("error" in auth) return auth;

  const validated = validateAffirmationText(rawText);
  if (!validated.ok) return { error: validated.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("affirmations")
    .update({ text: validated.text, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", auth.userId);

  if (error) return { error: GENERIC_WRITE_ERROR };

  revalidatePath("/space");
  return { success: true };
}

/**
 * Archive rather than delete. These are the user's own words about their own
 * life; taking one out of rotation should not destroy it.
 */
export async function archiveAffirmation(id: string): Promise<ActionResult> {
  const auth = await requireUserId();
  if ("error" in auth) return auth;

  const supabase = await createClient();
  const { error } = await supabase
    .from("affirmations")
    .update({ status: "archived", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", auth.userId);

  if (error) return { error: GENERIC_WRITE_ERROR };

  revalidatePath("/space");
  return { success: true };
}

/**
 * Rewrite the whole active set to contiguous positions in the given order.
 *
 * Whole-set rather than pairwise swap: it is idempotent, and it repairs an
 * order that drifted from an interrupted earlier write.
 */
export async function reorderAffirmations(
  ids: string[],
): Promise<ActionResult> {
  const auth = await requireUserId();
  if ("error" in auth) return auth;

  if (!Array.isArray(ids) || ids.length === 0) return { success: true };
  if (ids.length > MAX_ACTIVE_AFFIRMATIONS) {
    return { error: GENERIC_WRITE_ERROR };
  }

  const supabase = await createClient();
  const results = await Promise.all(
    resequence(ids).map(({ id, position }) =>
      supabase
        .from("affirmations")
        .update({ position })
        .eq("id", id)
        .eq("user_id", auth.userId),
    ),
  );
  if (results.some((r) => r.error)) return { error: GENERIC_WRITE_ERROR };

  revalidatePath("/space");
  return { success: true };
}

const draftSchema = z.object({
  affirmations: z
    .array(z.string().min(1).max(MAX_AFFIRMATION_LENGTH))
    .min(1)
    .max(DRAFT_MAX_COUNT * 2),
});

/**
 * Draft candidate affirmations from everything we know about the user.
 *
 * Deliberately returns them UNSAVED. The user keeps the ones that land and
 * discards the rest — that curation is the point (they end up owning the set),
 * and it means a weak generation costs nothing but a tap.
 */
export async function draftAffirmations(): Promise<
  { drafts: string[] } | { error: string }
> {
  const auth = await requireUserId();
  if ("error" in auth) return auth;

  try {
    const context = await buildUserContext(auth.userId);
    const result = await generateStrictJson(
      AFFIRMATION_SYSTEM_PROMPT,
      buildAffirmationPrompt(context),
      draftSchema,
      1000,
    );

    // The model is asked for well-formed lines but not trusted to produce them:
    // normalise, drop anything over length, and de-duplicate case-insensitively
    // so a repeated line cannot fill the picker.
    const seen = new Set<string>();
    const drafts: string[] = [];
    for (const raw of result.affirmations) {
      const text = normalizeAffirmationText(raw);
      const key = text.toLowerCase();
      if (!text || text.length > MAX_AFFIRMATION_LENGTH || seen.has(key)) {
        continue;
      }
      seen.add(key);
      drafts.push(text);
      if (drafts.length >= DRAFT_MAX_COUNT) break;
    }

    if (drafts.length < DRAFT_MIN_COUNT) {
      return {
        error: "The drafts didn't come out well. Try again, or write your own.",
      };
    }

    return { drafts };
  } catch (error) {
    console.error("[affirmations] draft failed", error);
    return {
      error: "Couldn't draft anything just now. Your own words work too.",
    };
  }
}
