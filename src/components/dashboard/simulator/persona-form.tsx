"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CATEGORY_OPTIONS,
  ORIENTATION_OPTIONS,
  STYLE_OPTIONS,
  PAST_PATTERN_OPTIONS,
  FIRST_DOUBT_OPTIONS,
  FIRST_DOUBT_MAX,
  INNER_VOICE_OPTIONS,
  VALUE_OPTIONS,
  VALUES_PICK,
  TONE_OPTIONS,
} from "@/lib/persona/questions";
import type { QuizAnswers, ValueId } from "@/lib/persona/types";

const REPLY_STYLES = [
  { id: "eager", label: "Eager" },
  { id: "realistic", label: "Realistic" },
  { id: "terse", label: "Terse" },
  { id: "flaky", label: "Flaky" },
  { id: "silent", label: "Silent" },
] as const;

interface PersonaDraft {
  name: string;
  personaBrief: string;
  replyStyle: string;
  intention: string;
  vision: string;
  alignedState: string;
  answers: QuizAnswers;
}

const PRESETS: { label: string; draft: PersonaDraft }[] = [
  {
    label: "Skeptical Sarah",
    draft: {
      name: "Skeptical Sarah",
      personaBrief:
        "38-year-old project manager and new mom. Signed up on a whim at 2am. Skeptical of anything that smells like woo, but privately wants a career change. Busy, tired, replies in short bursts when something actually lands. Rolls her eyes at generic positivity.",
      replyStyle: "terse",
      intention: "Move into a role where my work actually matters to me",
      vision:
        "Leading a small team on something I believe in, home by dinner, not checking email at midnight",
      alignedState: "Calm and decisive, not second-guessing every choice",
      answers: {
        intention_category: "career",
        motivation_orientation: "away",
        change_style: "doer",
        past_pattern: "talk_myself_out",
        first_doubt: ["who_am_i", "judge_me"],
        inner_voice: "tried_harder",
        core_values: ["security", "growth", "connection"],
        tone_preference: "direct",
      },
    },
  },
  {
    label: "Over-eager Omar",
    draft: {
      name: "Over-eager Omar",
      personaBrief:
        "26-year-old aspiring creator who devours self-improvement content. Replies to everything enthusiastically, sometimes with long voice-memo-style texts. Risk: novelty wears off around day 4-5 and enthusiasm drops without real traction.",
      replyStyle: "eager",
      intention: "Launch my photography side business this year",
      vision:
        "Booked out three months ahead, quitting the retail job, my own studio space",
      alignedState: "Buzzing with ideas and actually finishing them",
      answers: {
        intention_category: "creative",
        motivation_orientation: "toward",
        change_style: "dreamer",
        past_pattern: "lose_steam",
        first_doubt: ["not_perfect"],
        inner_voice: "always_do_this",
        core_values: ["freedom", "creativity", "recognition"],
        tone_preference: "celebratory",
      },
    },
  },
  {
    label: "Quiet Quinn",
    draft: {
      name: "Quiet Quinn",
      personaBrief:
        "52-year-old nurse going through a divorce. Reads every message but almost never replies — texting back feels like exposure. When she does reply it's real and vulnerable. Silence does not mean disengagement for her.",
      replyStyle: "silent",
      intention: "Feel at home in my own life again",
      vision:
        "A small place that's mine, coffee on the porch, unafraid of the quiet",
      alignedState: "Steady. Not braced for the next bad thing",
      answers: {
        intention_category: "identity",
        motivation_orientation: "away",
        change_style: "dreamer",
        past_pattern: "never_tried",
        first_doubt: ["too_late", "lose_it"],
        inner_voice: "never_work",
        core_values: ["peace", "security", "connection"],
        tone_preference: "gentle",
      },
    },
  },
];

const EMPTY_DRAFT: PersonaDraft = {
  name: "",
  personaBrief: "",
  replyStyle: "realistic",
  intention: "",
  vision: "",
  alignedState: "",
  answers: {
    intention_category: "career",
    motivation_orientation: "toward",
    change_style: "dreamer",
    past_pattern: "lose_steam",
    first_doubt: [],
    inner_voice: "no_pattern",
    core_values: [],
    tone_preference: "gentle",
  },
};

function Chip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left text-[13px] px-3 py-1.5 rounded-full border transition-colors ${
        selected
          ? "bg-navy text-white border-navy"
          : "bg-white/50 text-teal-900/70 border-teal-900/15 hover:border-teal-900/40"
      }`}
    >
      {children}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="text-[11px] uppercase tracking-widest text-teal-900/50">
        {label}
      </div>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-teal-900/15 bg-white/60 px-3 py-2 text-sm text-navy placeholder:text-teal-900/30 focus:outline-none focus:ring-2 focus:ring-em-purple-300";

/**
 * Single-screen persona creation form: the same answers the 15-step
 * onboarding quiz collects, compressed into chip groups, plus the free-text
 * persona brief that drives the reply-simulation model.
 */
export function PersonaForm({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}) {
  const [draft, setDraft] = useState<PersonaDraft>(EMPTY_DRAFT);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function setAnswers(patch: Partial<QuizAnswers>) {
    setDraft((d) => ({ ...d, answers: { ...d.answers, ...patch } }));
  }

  function toggleDoubt(id: string, exclusive?: boolean) {
    setDraft((d) => {
      const current = d.answers.first_doubt;
      if (exclusive) {
        return {
          ...d,
          answers: {
            ...d.answers,
            first_doubt: current.includes(id) ? [] : [id],
          },
        };
      }
      const withoutExclusive = current.filter(
        (x) => !FIRST_DOUBT_OPTIONS.find((o) => o.id === x)?.exclusive,
      );
      const next = withoutExclusive.includes(id)
        ? withoutExclusive.filter((x) => x !== id)
        : [...withoutExclusive, id].slice(-FIRST_DOUBT_MAX);
      return { ...d, answers: { ...d.answers, first_doubt: next } };
    });
  }

  function toggleValue(id: ValueId) {
    setDraft((d) => {
      const current = d.answers.core_values;
      const next = current.includes(id)
        ? current.filter((x) => x !== id)
        : [...current, id].slice(-VALUES_PICK);
      return { ...d, answers: { ...d.answers, core_values: next } };
    });
  }

  const valid =
    draft.name.trim() &&
    draft.personaBrief.trim() &&
    draft.intention.trim() &&
    draft.answers.core_values.length === VALUES_PICK;

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/founder/simulator/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: draft.name.trim(),
          personaBrief: draft.personaBrief.trim(),
          replyStyle: draft.replyStyle,
          intention: draft.intention.trim(),
          vision: draft.vision.trim() || null,
          alignedState: draft.alignedState.trim() || null,
          answers: draft.answers,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || `Request failed (${res.status})`);
        return;
      }
      setDraft(EMPTY_DRAFT);
      onOpenChange(false);
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-cream">
        <DialogHeader>
          <DialogTitle className="font-serif text-navy">
            New test persona
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Chip
                key={p.label}
                selected={false}
                onClick={() => setDraft(p.draft)}
              >
                Prefill: {p.label}
              </Chip>
            ))}
          </div>

          <Field label="Name">
            <input
              className={inputClass}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              placeholder="Skeptical Sarah"
            />
          </Field>

          <Field label="Persona brief (drives how they reply)">
            <textarea
              className={`${inputClass} min-h-[90px]`}
              value={draft.personaBrief}
              onChange={(e) =>
                setDraft({ ...draft, personaBrief: e.target.value })
              }
              placeholder="Who are they, why did they sign up, how do they text, what makes them go quiet…"
            />
          </Field>

          <Field label="Reply style">
            <div className="flex flex-wrap gap-2">
              {REPLY_STYLES.map((s) => (
                <Chip
                  key={s.id}
                  selected={draft.replyStyle === s.id}
                  onClick={() => setDraft({ ...draft, replyStyle: s.id })}
                >
                  {s.label}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Intention">
            <input
              className={inputClass}
              value={draft.intention}
              onChange={(e) =>
                setDraft({ ...draft, intention: e.target.value })
              }
              placeholder="What they want to manifest"
            />
          </Field>

          <Field label="Vision (optional)">
            <textarea
              className={`${inputClass} min-h-[60px]`}
              value={draft.vision}
              onChange={(e) => setDraft({ ...draft, vision: e.target.value })}
            />
          </Field>

          <Field label="Aligned state (optional)">
            <input
              className={inputClass}
              value={draft.alignedState}
              onChange={(e) =>
                setDraft({ ...draft, alignedState: e.target.value })
              }
              placeholder="How it feels when they're most themselves"
            />
          </Field>

          <Field label="Dream category">
            <div className="flex flex-wrap gap-2">
              {CATEGORY_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  selected={draft.answers.intention_category === o.id}
                  onClick={() => setAnswers({ intention_category: o.id })}
                >
                  {o.label}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Motivation">
            <div className="flex flex-wrap gap-2">
              {ORIENTATION_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  selected={draft.answers.motivation_orientation === o.id}
                  onClick={() => setAnswers({ motivation_orientation: o.id })}
                >
                  {o.label}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="What's harder for them">
            <div className="flex flex-wrap gap-2">
              {STYLE_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  selected={draft.answers.change_style === o.id}
                  onClick={() => setAnswers({ change_style: o.id })}
                >
                  {o.label}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Past pattern">
            <div className="flex flex-wrap gap-2">
              {PAST_PATTERN_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  selected={draft.answers.past_pattern === o.id}
                  onClick={() => setAnswers({ past_pattern: o.id })}
                >
                  {o.label}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label={`First doubt (up to ${FIRST_DOUBT_MAX})`}>
            <div className="flex flex-wrap gap-2">
              {FIRST_DOUBT_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  selected={draft.answers.first_doubt.includes(o.id)}
                  onClick={() => toggleDoubt(o.id, o.exclusive)}
                >
                  {o.label}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Inner voice after a setback">
            <div className="flex flex-wrap gap-2">
              {INNER_VOICE_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  selected={draft.answers.inner_voice === o.id}
                  onClick={() => setAnswers({ inner_voice: o.id })}
                >
                  {o.label}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label={`Core values (pick ${VALUES_PICK})`}>
            <div className="flex flex-wrap gap-2">
              {VALUE_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  selected={draft.answers.core_values.includes(o.id)}
                  onClick={() => toggleValue(o.id)}
                >
                  {o.label}
                </Chip>
              ))}
            </div>
          </Field>

          <Field label="Tone preference">
            <div className="flex flex-wrap gap-2">
              {TONE_OPTIONS.map((o) => (
                <Chip
                  key={o.id}
                  selected={draft.answers.tone_preference === o.id}
                  onClick={() => setAnswers({ tone_preference: o.id })}
                >
                  {o.label}
                </Chip>
              ))}
            </div>
          </Field>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-teal-900/20 text-teal-900/60 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={submit}
              disabled={!valid || saving}
              className="bg-navy hover:bg-navy/90 text-white rounded-xl"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create persona"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
