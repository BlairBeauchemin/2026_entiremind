# Psychology Principles — Application Backlog

*Companion to `docs/design-philosophy.md`. Created 2026-07-08.*

This is the actionable half of the design-philosophy work: concrete places to apply the
six persuasion principles across onboarding, the SMS loop, the upgrade/paywall, and the
landing/waitlist. Each item maps **principle → surface → change → target file(s) →
source** (cherry-pick from an existing branch, or net-new).

**Important:** several items already exist as working code on unmerged branches. Per
founder direction, we **reference and cherry-pick** the psychology-relevant pieces onto
a fresh branch rather than merging those branches wholesale. See *Cherry-pick hazards*
at the bottom — the branches collide on migration numbers and on two shared files.

Legend: 🍒 = cherry-pick candidate exists · 🆕 = net-new · ⚠️ = has a hazard/dependency.

---

## Current state, at a glance

**Already strong (document and preserve — don't regress):**
- **Endowment** — the 15-step archetype quiz; users build intention/vision/values and own
  a persona (`src/components/onboarding/**`, `src/lib/persona/**`).
- **Reciprocity** — every substantive inbound SMS gets a mirror or soft-ack
  (`src/app/api/sms/webhook/twilio/route.ts` `processEnrichmentAndAck`, `src/lib/acks/`,
  `src/lib/ai/enrich.ts`).

**Absent or inert (the opportunity):**
- **Anchoring** — no prices shown anywhere; monthly vs. yearly has no dollar figures
  (`src/components/dashboard/settings-subscription.tsx`).
- **Goal-gradient** — onboarding is a flat 15-dot bar, no head-start, no "almost there"
  (`src/components/onboarding/onboarding-progress.tsx`).
- **Reciprocity gap** — reveal says "Your first message is on its way," but the first real
  prompt is deferred to the 7:45 AM cron (`src/lib/onboarding/actions.ts`,
  `src/app/api/cron/daily-send/route.ts`).
- **Loss aversion** — only reactive cancellation/past-due copy; pause flow is neutral
  (`src/components/dashboard/settings-messaging-form.tsx`).
- **Smart default (inert)** — `preferred_send_hour` defaults to 7 but is not honored
  (`src/components/dashboard/settings-profile-form.tsx`, fixed cron time).

---

## P0 — highest value, mostly cherry-pick

### P0.1 🍒 Reciprocity: first real prompt at completion
Send the user's first AI reflection prompt **immediately** when onboarding completes, so
real value lands while the reveal is fresh — closing the "first message is on its way"
copy-vs-reality gap.
- **Target:** `src/lib/onboarding/actions.ts` (`completeFullOnboarding`, uses `after()` to
  call `generateMessageForUser(user.id, "reflection")`).
- **Source:** `claude/market-research-feature-gaps-iggbou` commit `1cf2c50`.
- **Note:** verify the daily-send "already sent today" check still excludes this so the
  user doesn't get a duplicate the next morning.

### P0.2 🍒🆕 Anchoring + reciprocity: priced upgrade with a value recap
Show real prices with context (per-day/per-week math, yearly-vs-monthly savings %), and
precede the upgrade ask with a recap of value the user has already accumulated.
- **Targets:** `src/components/dashboard/settings-subscription.tsx` (prices absent today;
  the monthly/yearly cards at ~lines 174–197 are where anchoring goes); new landing
  `src/components/landing/pricing.tsx`.
- **Source:** landing pricing section + customer-language copy from
  `claude/market-research-feature-gaps-iggbou` `731cddb`. Value recap is 🆕 — build from
  existing `getUserSignals` (`src/lib/signals/index.ts`) and `user_memory`.

### P0.3 🆕 Goal-gradient: head-start onboarding progress
Replace the flat 15-dot `onboarding-progress.tsx` with a model that counts name/account
as step one ("already started") and shows an "almost there" state near the end. Small,
self-contained, no data dependency.
- **Target:** `src/components/onboarding/onboarding-progress.tsx` (consumed once in
  `src/components/onboarding/onboarding-flow.tsx`).
- **Source:** 🆕. Keep it calm — this is progress *reassurance*, not gamification.

---

## P1

### P1.1 🍒⚠️ Loss aversion: free-trial value ladder + dunning
A free trial gives the user something to lose; failed-payment dunning recovers churn with
"keep what you've built" framing (warm, per guardrail).
- **Targets:** `src/lib/onboarding/actions.ts` (trial start at completion),
  `src/lib/billing/*`, `settings-subscription.tsx`, migration.
- **Source:** `claude/security-review-validation-qivnr8` `7a06cff` (+ `7a06cff`'s
  `020_value_ladder_dunning.sql`, `ff25b20` plan doc). Also pulls server-side phone
  normalization from the same branch's `onboarding/actions.ts` edits.
- ⚠️ Migration `019` collides with the techniques branch — renumber on cherry-pick.

### P1.2 🍒 Endowment: shareable archetype pages
Give users a public, OG-card archetype page from the reveal — deepens ownership and adds
organic attribution/reciprocity on the growth side.
- **Targets:** `src/app/archetype/[slug]/page.tsx` + `opengraph-image.tsx`,
  `ShareArchetypeButton` in `src/components/onboarding/steps/reveal-step.tsx`, `src`
  attribution passed through the waitlist modals.
- **Source:** `claude/security-review-validation-qivnr8` `1414286`.

### P1.3 🆕 Endowment: echo the user's own words mid-flow
Vision and aligned-state answers are collected but only surfaced at the very end. Reflect
the user's own phrasing back within the flow (e.g. on a later step) so the endowment
compounds before the reveal.
- **Target:** `src/components/onboarding/steps/` (vision-step / aligned-state-step and a
  subsequent step), `onboarding-flow.tsx` state already holds the answers.
- **Source:** 🆕.

### P1.4 🆕 Goal-gradient (gentle): reflection cue on dashboard
Surface a single calm cue — "You've reflected N times" — using data that already exists.
Permitted by the updated CLAUDE.md dashboard rule; must stay non-gamified (no streak).
- **Target:** `src/app/dashboard/page.tsx` via `getUserSignals` (`user_signals.totalReplies`).
- **Source:** 🆕. Data is already computed in `src/lib/signals/compute.ts`.

---

## P2

### P2.1 🍒⚠️ Loss aversion / reconnect: weekly recap + silence-recovery arc
A weekly recap SMS reminds users what they've built; a silence-recovery arc re-engages
warmly (not naggingly) after consecutive silences.
- **Targets:** engagement libs, cron, `src/lib/reconnect.ts`, migration.
- **Source:** `claude/security-review-validation-qivnr8` `dbc20eb`
  (+ `019_weekly_recap_silence_recovery.sql`).
- ⚠️ Migration `018` collides with three other branches — renumber.

### P2.2 🆕 Loss aversion (pause): "we'll hold your place" framing
The pause flow is currently neutral. Add gentle framing that what the user built stays —
never guilt. Must pass the trusted-friend test.
- **Target:** `src/components/dashboard/settings-messaging-form.tsx`.
- **Source:** 🆕.

### P2.3 🍒 Reciprocity / low-friction: one-tap SMS upgrade links
Tokenized (purpose-bound, signed) upgrade links so a user can upgrade straight from a
text — value first, minimal friction.
- **Targets:** `src/lib/billing/token.ts`, `src/app/u/[token]/page.tsx`.
- **Source:** `claude/security-review-validation-qivnr8` `1813976` (+ `fbd72a1` plan).

### P2.4 🆕⚠️ Smart default: honor `preferred_send_hour`
The send-hour control defaults to 7 but is ignored (fixed 7:45 AM Pacific cron) with a
"coming soon" disclaimer. Wire it up so the default is real.
- **Target:** `src/app/api/cron/daily-send/route.ts`, `settings-profile-form.tsx`.
- ⚠️ Depends on hourly cron (Vercel Pro) — noted as Not-Yet-Implemented in CLAUDE.md.

### P2.5 🆕 Anchoring (copy): reframe the msg-cadence line
"Up to 2 msgs/day" is compliance phrasing; where legally safe, frame the value ("two
quiet moments a day"). Keep required compliance language intact.
- **Target:** `src/lib/sms/welcome.ts` and any UI that echoes cadence.
- **Source:** 🆕.

---

## Cherry-pick hazards (read before implementing P0.2 / P1.1 / P2.x)

The unmerged branches were built in parallel and **cannot all merge cleanly**:

- **Migration number collisions:**
  - `018_*` is claimed by four branches: `021_messaging_simulator` (messaging-test-tool),
    `018_quotes_and_weekly_editions` (motivational-quotes *and* technique-playbook),
    `018_testimonials` (market-research), `019_weekly_recap_silence_recovery` (security-review).
  - `019_*` is claimed by two: `019_techniques` (technique-playbook) vs.
    `020_value_ladder_dunning` (security-review).
  - **Any cherry-pick that carries a migration must renumber it** to the next free number
    at implementation time.
- **Shared-file conflicts:** `src/lib/onboarding/actions.ts` is edited by three branches
  (market-research first-prompt, security-review trial-start + phone normalization); and
  `src/lib/ai/prompts.ts` by two (messaging-test-tool selection-debug, technique-playbook
  technique recipe). Expect to hand-reconcile these two files rather than clean cherry-pick.

**Branch reference (source of the 🍒 items):**
- `claude/market-research-feature-gaps-iggbou` — first-prompt-on-complete `1cf2c50`,
  pricing + landing copy `731cddb` / `b4edceb`.
- `claude/security-review-validation-qivnr8` — trial/dunning `7a06cff`, shareable archetype
  `1414286`, weekly recap/silence recovery `dbc20eb`, one-tap upgrade `1813976`.

---

## Suggested sequencing

1. **P0.3** (goal-gradient progress) — net-new, zero data/migration risk, immediate polish.
2. **P0.1** (first prompt at completion) — small cherry-pick, high felt value, closes a live gap.
3. **P0.2** (priced upgrade + value recap) — the biggest conversion lever; anchoring is fully absent today.
4. **P1.2 / P1.3** (endowment) — deepen the strongest existing principle.
5. **P1.1 → P2.x** (trial, dunning, reconnect) — higher effort, migration reconciliation required.

Each item, when implemented, should be checked against the design-review checklist in
`docs/design-philosophy.md` — especially the guardrail on the loss-aversion items.
