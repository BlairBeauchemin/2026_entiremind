"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Dialog as DialogPrimitive } from "radix-ui";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import {
  MAX_ACTIVE_AFFIRMATIONS,
  MAX_AFFIRMATION_LENGTH,
  moveInOrder,
  validateAffirmationText,
  type Affirmation,
} from "@/lib/affirmations";
import {
  archiveAffirmation,
  createAffirmation,
  draftAffirmations,
  listAffirmations,
  reorderAffirmations,
  updateAffirmationText,
} from "@/lib/affirmations/actions";

/**
 * Where the user writes what they'll be sitting with.
 *
 * Lives inside The Space as a sheet rather than as its own page: leaving the
 * surface to edit and coming back would break the thing the surface is for.
 *
 * Every write re-reads the saved set afterwards rather than patching local
 * state, so a partial failure surfaces as "your list didn't change" instead of
 * as a screen that quietly disagrees with the database.
 */

export interface AffirmationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  affirmations: Affirmation[];
  onChanged: (next: Affirmation[]) => void;
  /**
   * A new affirmation was saved. The sky uses this to ignite its star — the
   * payoff for committing the words, so it fires on create only, never on an
   * edit, a reorder or an archive.
   */
  onCreated?: (id: string) => void;
}

export function AffirmationDrawer({
  open,
  onOpenChange,
  affirmations,
  onChanged,
  onCreated,
}: AffirmationDrawerProps) {
  const [draftText, setDraftText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [drafting, setDrafting] = useState(false);
  const [pending, startTransition] = useTransition();

  const atCapacity = affirmations.length >= MAX_ACTIVE_AFFIRMATIONS;
  const busy = pending || drafting;

  const refresh = useCallback(async () => {
    onChanged(await listAffirmations());
  }, [onChanged]);

  // Clear transient state on close so reopening is never mid-thought from a
  // session the user already walked away from. Done here rather than in an
  // effect: Radix routes escape, overlay-click and the close button all through
  // onOpenChange, so this is the one place a close actually happens.
  const handleOpenChange = useCallback(
    (next: boolean) => {
      if (!next) {
        setError(null);
        setSuggestions([]);
        setDraftText("");
      }
      onOpenChange(next);
    },
    [onOpenChange],
  );

  const handleAdd = (text: string, source: "user" | "ai_draft" = "user") => {
    const validated = validateAffirmationText(text);
    if (!validated.ok) {
      setError(validated.error);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await createAffirmation(validated.text, source);
      if ("error" in result) {
        setError(result.error);
        return;
      }
      if (source === "user") setDraftText("");
      setSuggestions((prev) => prev.filter((s) => s !== text));
      // Before the refresh, so the star starts arriving the moment the row
      // exists rather than after a second round-trip.
      onCreated?.(result.affirmation.id);
      await refresh();
    });
  };

  const handleArchive = (id: string) => {
    setError(null);
    startTransition(async () => {
      const result = await archiveAffirmation(id);
      if ("error" in result) setError(result.error);
      await refresh();
    });
  };

  const handleMove = (id: string, direction: "up" | "down") => {
    const nextOrder = moveInOrder(affirmations, id, direction);
    // Reflect the move immediately — a reorder that lags behind the tap feels
    // broken — then reconcile against the server read.
    const byId = new Map(affirmations.map((a) => [a.id, a]));
    onChanged(
      nextOrder.map((rowId, position) => ({ ...byId.get(rowId)!, position })),
    );
    startTransition(async () => {
      const result = await reorderAffirmations(nextOrder);
      if ("error" in result) setError(result.error);
      await refresh();
    });
  };

  const handleDraft = async () => {
    setError(null);
    setDrafting(true);
    const result = await draftAffirmations();
    setDrafting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    setSuggestions(result.drafts);
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal forceMount>
        <AnimatePresence>
          {open && (
            <>
              <DialogPrimitive.Overlay asChild forceMount>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  // Deliberately light: saving keeps the sheet open so you can
                  // add several, which means the new star ignites behind it. An
                  // opaque scrim would play the payoff to nobody.
                  className="fixed inset-0 z-40 bg-[#05101a]/45"
                />
              </DialogPrimitive.Overlay>

              <DialogPrimitive.Content asChild forceMount>
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 32, stiffness: 320 }}
                  className="fixed inset-x-0 bottom-0 z-50 max-h-[88dvh] overflow-y-auto rounded-t-sm border-t border-linen/20 bg-night-raised text-linen"
                  style={{
                    paddingBottom: "max(1.5rem, env(safe-area-inset-bottom))",
                  }}
                >
                  <div className="mx-auto w-full max-w-lg px-6 pt-4">
                    {/* Grab handle — reads as "this is a sheet" before any copy does. */}
                    <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-linen/30" />

                    <div className="mb-1 flex items-start justify-between gap-4">
                      <div>
                        <DialogPrimitive.Title className="font-serif text-2xl text-linen">
                          Your affirmations
                        </DialogPrimitive.Title>
                        <DialogPrimitive.Description className="mt-1 text-sm text-linen/60">
                          Present tense, in your own words. These are what
                          you&apos;ll sit with.
                        </DialogPrimitive.Description>
                      </div>
                      <DialogPrimitive.Close
                        className="-mr-2 -mt-1 rounded-full p-2 text-linen/60 transition hover:bg-linen/10 hover:text-linen focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
                        aria-label="Close"
                      >
                        <X className="h-5 w-5" />
                      </DialogPrimitive.Close>
                    </div>

                    <ul className="mt-6 space-y-2">
                      {affirmations.map((affirmation, i) => (
                        <AffirmationRow
                          // Text is part of the key on purpose: a row whose
                          // stored text changed underneath us remounts with the
                          // new value, which removes the need to sync a prop
                          // into local state (and the races that come with it).
                          key={`${affirmation.id}:${affirmation.text}`}
                          affirmation={affirmation}
                          isFirst={i === 0}
                          isLast={i === affirmations.length - 1}
                          disabled={busy}
                          onMove={handleMove}
                          onArchive={handleArchive}
                          onSaved={refresh}
                          onError={setError}
                        />
                      ))}
                    </ul>

                    {affirmations.length === 0 && (
                      <p className="mt-6 rounded-sm border border-dashed border-linen/25 px-4 py-6 text-center text-sm text-linen/60">
                        Nothing here yet. Write one below, or let us draft a few
                        from what you&apos;re working toward.
                      </p>
                    )}

                    {/* Add */}
                    <form
                      className="mt-5 flex items-center gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        handleAdd(draftText);
                      }}
                    >
                      <input
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                        maxLength={MAX_AFFIRMATION_LENGTH}
                        disabled={busy || atCapacity}
                        placeholder={
                          atCapacity ? "Archive one to make room" : "I am…"
                        }
                        aria-label="New affirmation"
                        className="min-w-0 flex-1 rounded-full border border-linen/25 bg-linen/5 px-4 py-3 text-base text-linen placeholder:text-linen/40 focus-visible:border-leaf/60 focus-visible:outline-none disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={busy || atCapacity || draftText.trim() === ""}
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linen text-ink transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf disabled:opacity-40"
                        aria-label="Add affirmation"
                      >
                        <Plus className="h-5 w-5" />
                      </button>
                    </form>

                    {/* Draft */}
                    <button
                      type="button"
                      onClick={handleDraft}
                      disabled={busy || atCapacity}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-linen/25 px-4 py-3 text-sm text-linen/80 transition hover:border-linen/50 hover:text-linen focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf disabled:opacity-40"
                    >
                      {drafting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Sparkles className="h-4 w-4" />
                      )}
                      {drafting ? "Finding your words…" : "Draft a few for me"}
                    </button>

                    {suggestions.length > 0 && (
                      <div className="mt-5 rounded-sm border border-linen/15 bg-linen/5 p-4">
                        <p className="mb-3 text-xs uppercase tracking-widest text-linen/50">
                          Keep the ones that land
                        </p>
                        <ul className="space-y-2">
                          {suggestions.map((suggestion) => (
                            <li
                              key={suggestion}
                              className="flex items-start gap-3"
                            >
                              <p className="flex-1 text-[0.95rem] leading-relaxed text-linen/90">
                                {suggestion}
                              </p>
                              <button
                                type="button"
                                onClick={() =>
                                  handleAdd(suggestion, "ai_draft")
                                }
                                disabled={busy || atCapacity}
                                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface text-ink transition hover:bg-linen focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf disabled:opacity-40"
                                aria-label={`Keep: ${suggestion}`}
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setSuggestions((prev) =>
                                    prev.filter((s) => s !== suggestion),
                                  )
                                }
                                className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-linen/40 transition hover:bg-linen/10 hover:text-linen/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
                                aria-label={`Discard: ${suggestion}`}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {error && (
                      <p
                        role="alert"
                        className="mt-4 text-sm text-leaf"
                      >
                        {error}
                      </p>
                    )}
                  </div>
                </motion.div>
              </DialogPrimitive.Content>
            </>
          )}
        </AnimatePresence>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

interface AffirmationRowProps {
  affirmation: Affirmation;
  isFirst: boolean;
  isLast: boolean;
  disabled: boolean;
  onMove: (id: string, direction: "up" | "down") => void;
  onArchive: (id: string) => void;
  onSaved: () => Promise<void>;
  onError: (message: string | null) => void;
}

function AffirmationRow({
  affirmation,
  isFirst,
  isLast,
  disabled,
  onMove,
  onArchive,
  onSaved,
  onError,
}: AffirmationRowProps) {
  const [value, setValue] = useState(affirmation.text);
  const [saving, setSaving] = useState(false);

  // Last known-good text: what an invalid or failed edit reverts to, and what
  // tells commit() there is nothing to send. Only ever written from handlers.
  const committedRef = useRef(affirmation.text);

  const commit = async () => {
    if (value === committedRef.current) return;

    const validated = validateAffirmationText(value);
    if (!validated.ok) {
      onError(validated.error);
      setValue(committedRef.current); // Never leave an unsaveable value on screen.
      return;
    }

    onError(null);
    setSaving(true);
    const result = await updateAffirmationText(affirmation.id, validated.text);
    setSaving(false);
    if ("error" in result) {
      onError(result.error);
      setValue(committedRef.current);
      return;
    }
    committedRef.current = validated.text;
    await onSaved();
  };

  return (
    <li className="flex items-start gap-1 rounded-sm border border-linen/15 bg-linen/5 py-1 pl-3 pr-1 focus-within:border-linen/25">
      {/*
        A textarea, not an input: a single-line input silently clips the tail of
        a longer affirmation, and a list of your own words that you cannot read
        is worse than no list. `field-sizing:content` grows it to fit where
        supported, and it degrades to a scrollable one-row box where it isn't.
      */}
      <textarea
        value={value}
        rows={1}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          // Enter commits rather than inserting a newline — affirmations are
          // single lines, and normalization would strip the break anyway.
          if (e.key === "Enter") {
            e.preventDefault();
            e.currentTarget.blur();
          }
          if (e.key === "Escape") {
            setValue(committedRef.current);
            e.currentTarget.blur();
          }
        }}
        maxLength={MAX_AFFIRMATION_LENGTH}
        disabled={disabled || saving}
        aria-label={`Edit affirmation: ${affirmation.text}`}
        className="min-w-0 flex-1 resize-none bg-transparent py-2 text-[0.95rem] leading-relaxed text-linen outline-none [field-sizing:content] disabled:opacity-60"
      />

      <div className="flex shrink-0 items-center pt-0.5">
        <IconButton
          label="Move up"
          disabled={disabled || isFirst}
          onClick={() => onMove(affirmation.id, "up")}
        >
          <ChevronUp className="h-4 w-4" />
        </IconButton>
        <IconButton
          label="Move down"
          disabled={disabled || isLast}
          onClick={() => onMove(affirmation.id, "down")}
        >
          <ChevronDown className="h-4 w-4" />
        </IconButton>
        <IconButton
          label={`Archive: ${affirmation.text}`}
          disabled={disabled}
          onClick={() => onArchive(affirmation.id)}
        >
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>
    </li>
  );
}

function IconButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      // 40px hit target: these sit three-in-a-row under a thumb.
      className="flex h-10 w-10 items-center justify-center rounded-full text-linen/50 transition hover:bg-linen/10 hover:text-linen focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf disabled:pointer-events-none disabled:opacity-25"
    >
      {children}
    </button>
  );
}
