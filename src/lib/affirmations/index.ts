/**
 * Pure helpers for user affirmations. No Supabase, no React — the server
 * actions and the drawer UI both call into here so validation and ordering can
 * only ever disagree in one place.
 */

export type {
  Affirmation,
  AffirmationDraft,
  AffirmationSource,
  AffirmationStatus,
} from "./types";

/**
 * Hard ceiling on a saved affirmation. Long enough for a real sentence, short
 * enough that the line still reads as a single held thought at display size on
 * a phone. AI drafts are asked for a tighter limit than this.
 */
export const MAX_AFFIRMATION_LENGTH = 140;

/** Control characters, including the soft line breaks phone keyboards insert. */
const CONTROL_CHARS = /[\u0000-\u001F\u007F]/g;

/**
 * Collapse whitespace and strip control characters.
 *
 * Users paste from notes apps and keyboards insert soft line breaks; a stray
 * newline inside an affirmation wrecks the centred single-line layout, so
 * normalising on the way in is cheaper than defending against it on the way out.
 */
export function normalizeAffirmationText(raw: string): string {
  return raw.replace(CONTROL_CHARS, " ").replace(/\s+/g, " ").trim();
}

export type AffirmationValidation =
  | { ok: true; text: string }
  | { ok: false; error: string };

export function validateAffirmationText(raw: string): AffirmationValidation {
  const text = normalizeAffirmationText(typeof raw === "string" ? raw : "");

  if (text.length === 0) {
    return { ok: false, error: "Write a few words first." };
  }
  if (text.length > MAX_AFFIRMATION_LENGTH) {
    return {
      ok: false,
      error: `Keep it under ${MAX_AFFIRMATION_LENGTH} characters so it stays easy to hold.`,
    };
  }
  return { ok: true, text };
}

/**
 * Ceiling on active affirmations per user. Not a monetisation gate — a set this
 * large already takes several minutes to cycle through at three breaths each,
 * and it keeps the whole-set reorder write bounded.
 */
export const MAX_ACTIVE_AFFIRMATIONS = 30;

/** Next position at the end of the list, tolerant of gaps in the existing set. */
export function nextPosition(existing: { position: number }[]): number {
  if (existing.length === 0) return 0;
  return Math.max(...existing.map((a) => a.position)) + 1;
}

/**
 * Rewrite an ordered id list to contiguous positions 0..n-1.
 *
 * Reorder always rewrites the whole set rather than swapping two rows: it makes
 * the stored order self-healing, so a set that drifted (duplicate or gapped
 * positions from an interrupted write) is repaired by the next reorder.
 */
export function resequence(ids: string[]): { id: string; position: number }[] {
  return ids.map((id, position) => ({ id, position }));
}

/**
 * Move one affirmation up or down by a single step, returning the new id order.
 *
 * Up/down beats drag-and-drop here: it works on the first try with a thumb, and
 * this list lives inside a calm surface where a fiddly gesture would cost more
 * than it gives.
 */
export function moveInOrder<T extends { id: string }>(
  items: T[],
  id: string,
  direction: "up" | "down",
): string[] {
  const ids = items.map((i) => i.id);
  const from = ids.indexOf(id);
  if (from === -1) return ids;

  const to = direction === "up" ? from - 1 : from + 1;
  if (to < 0 || to >= ids.length) return ids;

  const next = [...ids];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}
