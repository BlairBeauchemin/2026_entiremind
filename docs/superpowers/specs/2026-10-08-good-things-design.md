# Good Things — Design Spec

_Created 2026-10-08 via the Superpowers brainstorming process. Status: **design approved
section-by-section in conversation; awaiting founder review of this written spec.** The
implementation plan is written only after this spec is approved._

"Good Things" is a working name.

---

## 1. Context & goal

Gratitude practice has a real (if modest) evidence base for mood and outlook, and the
founder wants it in Entiremind. Today gratitude exists only in thin form:

- one of five rotating daily-SMS content types — a single generic instruction
  (`src/lib/ai/prompts.ts` `getContentTypePrompt`) and a "big or small" fallback
  (`src/lib/ai/index.ts`), the flat template shape the craft pass bans;
- one of eight weekly-email themes (`QUOTE_THEMES`), so it surfaces roughly once every
  eight editions;
- no technique rows target it, nothing collects what users are grateful for, and nothing
  gives it back to them.

Worse, `STRUGGLING_TYPES = ["check-in", "gratitude"]` steers struggling and silent users
_toward_ gratitude prompts — the one place the current thin version can do harm.

**Goal:** a standalone gratitude practice that is additive to the whole product — not just
a better daily prompt — and that becomes part of why people stay and pay.

**Primary outcome:** retention and trial→paid conversion. The mechanism is endowment: a
growing, personal collection of the user's own good things, plus an "evidence" view tied
to their intention that only Entiremind can offer.

## 2. Research basis (and how it shapes the design)

| Finding                                                                                  | Design consequence                                                             |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| Effects are real but **modest**                                                          | Honest framing. No "rewire your brain" claims (trusted-friend test).           |
| **Specificity** drives the effect                                                        | Prompts ask for one concrete moment, person, or detail — never "big or small". |
| **Hedonic adaptation** — roughly weekly can beat daily                                   | The ritual is weekly, not daily.                                               |
| **Variety of forms** helps (good things, mental subtraction, savoring, someone to thank) | The capture prompt rotates across forms.                                       |
| "Three good things" is a well-studied, simple form                                       | The SMS ritual uses it; capture allows "add another" up to three.              |
| Asking for gratitude while low can feel **invalidating**                                 | Struggling users are never asked for gratitude; they are shown their own.      |

## 3. Decisions

| Area              | Decision                                                                                                                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Outcome metric    | Retention + trial→paid conversion                                                                                                                                                                               |
| Paywall           | Trial and paid users get the ritual and capture. After trial expiry the ritual stops with the rest of the daily loop, but the **collection stays fully visible** — the user's own words are never held hostage. |
| Core interaction  | **Guided pause + express lane** (approach C, §6)                                                                                                                                                                |
| Surfaces          | `/dashboard/good-things` page, capture at `/dashboard/good-things/new`, **Evidence board** on `/dashboard/intentions`                                                                                           |
| Evidence          | Tagged **only by the user's own tap**, scoped to the current intention                                                                                                                                          |
| Hard days         | Resurface the user's own past good things; remove `gratitude` from `STRUGGLING_TYPES`                                                                                                                           |
| First phase       | The weekly email block                                                                                                                                                                                          |
| SMS ritual timing | Trial day 3, then Sundays                                                                                                                                                                                       |
| Measurement       | Correlational, **no holdout** (founder decision)                                                                                                                                                                |

## 4. Phases

| Phase                  | Ships                                                                      | Why this order                                                                     |
| ---------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **0 — Email**          | Standing "Good Things" block in every weekly edition                       | Founder's chosen starting point; smallest build; starts driving traffic to capture |
| **1 — Capture + page** | Capture moment, `/dashboard/good-things`, sidebar entry                    | The core everything else depends on                                                |
| **2 — Evidence board** | "Sign of my intention" tap + board on `/dashboard/intentions`              | The manifestation angle; same data                                                 |
| **3 — SMS**            | Weekly ritual, reply capture, hard-day resurfacing, `STRUGGLING_TYPES` fix | Brings it into the primary loop                                                    |
| **4 — Keepsakes**      | Month-ago resurfacing → "on this day"; monthly letter page                 | Only valuable once collections exist                                               |

Until Phase 1 ships, the Phase 0 email button links to `/dashboard`.

The `STRUGGLING_TYPES` fix is small and independent; it may ship ahead of Phase 3.

## 5. Data model

New migration `030_good_things.sql`, modelled on `028_affirmations.sql`:

```sql
CREATE TABLE IF NOT EXISTS good_things (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text              TEXT NOT NULL,
  is_evidence       BOOLEAN NOT NULL DEFAULT false,
  intention_id      UUID REFERENCES intentions(id) ON DELETE SET NULL,
  source            TEXT NOT NULL DEFAULT 'capture'
                    CHECK (source IN ('capture', 'quick', 'sms_reply', 'onboarding')),
  prompt_key        TEXT,
  source_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ DEFAULT now()
);
-- RLS: FOR ALL USING (auth.uid() = user_id)
-- Index: (user_id, created_at DESC); partial index on (user_id, intention_id) WHERE is_evidence
```

- `is_evidence` + `intention_id` — set together, only from the user's tap. A new intention
  starts a fresh board; old evidence remains on the Good Things page.
- `source` — founder-side learning signal (which entry points work). Never shown to users.
  `onboarding` is reserved; no onboarding step is added in this design.
- `prompt_key` — which reflection prompt was answered, so per-prompt completion can be
  measured.
- **Deliberately no sessions/visits table** — nothing that could later grow into a streak.
- The same migration extends the `messages.content_type` CHECK with `'good_things'`
  (Phase 3) and adds the config knobs in §9 to `content_selection_config`.

Writes from the web use RLS-scoped server actions (pattern: `src/lib/affirmations/actions.ts`).
SMS-reply inserts run service-role inside the webhook's `after()` enrichment path.

## 6. The capture moment

Route `/dashboard/good-things/new`. Unauthenticated visitors go through the normal
`/auth?next=…` flow. Must be added to the proxy route rules alongside `/dashboard`
(it is under `/dashboard`, so existing gating applies).

**Guided pause (default):**

1. Calm full-width Daylight screen. A quiet line — _"Take a breath first."_ — then one
   prompt in Prata. No timer, no progress bar.
2. One prompt per user per day, chosen deterministically (same approach as
   `pickDeterministicQuote`). Seed prompts (`prompt_key` in brackets):
   - [`moment`] "What's one moment from the last day you'd like to keep?"
   - [`person`] "Who made this week a little easier?"
   - [`subtraction`] "Picture your week without one good thing in it. What's missing?"
   - [`savor`] "What small pleasure could you stay with a little longer?"
3. One textarea and Save. Below it, an optional toggle:
   **"This feels like a sign of '<intention>'."** Hidden if the user has no active intention.
4. After save: a quiet confirmation, then **"Add another"** (up to three per sitting,
   never required) or **"Done"**.

**Express lane:** a single-line "Add a good thing…" input at the top of the Good Things
page, with the same optional evidence toggle. `source = 'quick'`.

Accepts `?src=email|sms|dashboard` for attribution (analytics event only; not stored on the row).

## 7. Good Things page & Evidence board

**`/dashboard/good-things`**

- Express-lane input, then a "Take a moment" button into the guided pause.
- Entries newest first, grouped by month. Entry text in Prata, small Karla dates.
- Evidence entries carry a small gold mark (gold as ornament, per DESIGN.md).
- Delete per entry. No edit in v1 (YAGNI).
- **No counts, no week-over-week, no streaks.**
- New sidebar nav item.
- Visible to expired-trial users in full; capture remains available to them too (it costs
  nothing and the words are theirs). Only the SMS ritual stops at expiry.

**Evidence board — "Signs it's arriving"** on `/dashboard/intentions`, directly under the
active intention:

- Latest 3–5 evidence entries for the **current** intention, plus "see all".
- Empty state: a single gentle invitation into the guided pause — never an empty box.

## 8. Phase 0 — the email block

- A fixed **"Good Things"** block in `src/lib/email-campaigns/template.ts`, after the
  reflection/question: one prompt from the §6 set (rotated by edition week) and a
  **"Take a moment →"** button to
  `https://www.entiremind.com/dashboard/good-things/new?src=email`.
- Template-based, not AI-generated — consistent, zero added cost.
- Waitlist leads who click land on `/auth` → onboarding: also a conversion path,
  measurable through `src=email`.
- Still pushed to the provider as a **draft**; the "weekly email editions are never
  auto-sent" gate is unchanged.

## 9. Phase 3 — SMS

**Weekly ritual.** Copy along the lines of: _"Three good things from your week — big,
small, odd. Just reply."_ (a few rotating phrasings, template-based).

- Replaces that morning's regular prompt (same replace-in-place pattern as the Monday
  recap in `src/app/api/cron/daily-send/route.ts`) — no extra text that day, no new cron.
- Timing: **trial day 3, then Sundays.** Day 3 guarantees every trial user meets the
  ritual at least twice before day 10.
- Skips paused, expired, struggling, and silent (≥ `silence_threshold`) users; the
  reconnect arc owns silent users.
- Pure decision function `decideGoodThingsRitual(user, today, config)` in
  `src/lib/good-things/`, unit-tested like `decideSilenceRecovery`.
- `good_things` content type: excluded from silence detection; replies link as replies
  (same treatment as `recap`).
- Config on `content_selection_config`: `good_things_enabled` (default true),
  `good_things_weekday` (default 0 = Sunday), `good_things_first_day` (default 3).

**Reply capture.** Enrichment (`src/lib/ai/prompts/enrich.ts`, `src/lib/ai/enrich.ts`)
gains an optional `good_things: string[]` — short, specific things the reply expresses
gratitude for. Extracted from ritual replies **and** ordinary replies; inserted as
`source = 'sms_reply'` with `source_message_id`. Everything is visible and deletable on the
page. The reconcile cron's insights-only backfill does not insert rows.

**Hard days.**

- Remove `gratitude` from `STRUGGLING_TYPES` (`src/lib/ai/prompts.ts`) — struggling and
  silent users get `check-in` only.
- When the user is struggling and has past good things, `buildUserContext` loads one
  (preferring evidence entries) and `decideMessageMode` may choose `callback` to reflect it
  back: _"A few weeks ago you mentioned …"_. Never framed as "you should be grateful".

## 10. Phase 4 — keepsakes

- **Resurfacing:** the ritual text may open with one entry from about a month ago; becomes a
  true "on this day" once users have a year of history.
- **Monthly letter:** printable page `/dashboard/good-things/letters/YYYY-MM` in the
  printed Daylight style (print stylesheet), linked by SMS on the 1st for users with ≥1
  entry that month. A web page, not an email: the email provider does bulk drafts only.
- **Printed yearbook:** deferred — needs a print vendor and a year of data.

## 11. Metrics

No holdout (founder decision) — these are correlational and should be read as such.

- **Primary:** trial→paid conversion and 60-day paid churn for users with ≥2 good things
  vs. users with fewer.
- **Leading:** capture completion (opened → saved), guided vs. express-lane share, email
  click-through (`src=email`), evidence-tag rate, ritual reply rate vs. the regular daily
  prompt, per-`prompt_key` completion.
- Analytics events added to `src/lib/analytics.ts`: `good_things_open`,
  `good_things_save`, `good_things_evidence_tag`.

## 12. Guardrails & non-goals

- No streaks, counts, quotas, or "you missed a week".
- Evidence is tagged only by the user — never inferred by AI. Nothing reads or writes the
  `intentions` table except to look up the active intention's id and text
  (`src/lib/intentions/authorship.test.ts` must keep passing — add every new
  `src/lib/good-things/` file that reads `intentions` to its `READ_ONLY_ON_INTENTIONS` list).
- Never ask a struggling user for gratitude.
- Never send messages to other people on the user's behalf.
- DESIGN.md tokens only; no gradients, glow, or shadows. The Space stays affirmations-only.
- Run the `docs/design-philosophy.md` design-review checklist on every user-facing phase.

## 13. Files likely touched

- `supabase/migrations/030_good_things.sql` (new)
- `src/lib/good-things/` (new): queries, prompt set + deterministic picker, ritual decision
  logic, server actions
- `src/app/dashboard/good-things/page.tsx`, `.../new/page.tsx`, `.../letters/[month]/page.tsx` (new)
- `src/app/dashboard/intentions/page.tsx` (Evidence board)
- dashboard sidebar nav component
- `src/lib/email-campaigns/template.ts` (Phase 0)
- `src/lib/ai/prompts.ts`, `src/lib/ai/index.ts`, `src/lib/ai/enrich.ts`,
  `src/lib/ai/prompts/enrich.ts`
- `src/app/api/cron/daily-send/route.ts`, `src/app/api/cron/detect-silence/route.ts`
- `src/app/api/sms/webhook/twilio/route.ts` (reply insert in `after()`)
- `src/lib/analytics.ts`

## 14. Open questions

1. **Final name** — "Good Things" is a working name.
2. **Ritual send time** — Sunday's ritual goes out at the global 7:45 AM Pacific until
   `preferred_send_hour` is honored; an evening ritual would need a cron slot.
3. **Gratitude daily content type** — once the ritual exists, should `gratitude` leave the
   daily rotation (avoid two gratitude asks in one week), or stay with sharper prompts?
   Recommendation: keep it but exclude it within 2 days of a ritual.
