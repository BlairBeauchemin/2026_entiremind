# Onboarding v2: Archetype Discovery — Implementation Plan

**PRD:** `docs/prds/2026-06-11-onboarding-v2.md`
**Branch:** `claude/planning-session-4rzgzc`
**Date:** 2026-06-11

---

## Architecture overview

```
                         New signup → /onboarding
                                  │
   ┌──────────────────────────────┼──────────────────────────────────┐
   │ 15 screens (client state, persisted at completion):              │
   │  name/phone (server actions, existing)                           │
   │  intention (server action, existing)                             │
   │  category, motivation, style, pattern, doubts,                   │
   │  inner voice, values, tone  → tap answers in client state        │
   │  vision, aligned-state      → free text in client state          │
   └──────────────────────────────┬──────────────────────────────────┘
                                  ▼
                    scoreProfile(answers)  ← pure function, src/lib/persona
                                  │
                  { archetype, orientation, style, distortion
                    scores, primary/secondary pattern, values, tone }
                                  ▼
                       Reveal screen (templated copy)
                                  ▼
                  completeFullOnboarding (extended server action)
                    ├─ onboarding_responses (raw answers JSONB + quiz_version)
                    ├─ user_profiles (derived profile)
                    ├─ user_memory seed (now profile-aware)
                    ├─ users.onboarding_completed = true
                    └─ welcome SMS (references archetype)

   Daily send:   buildUserContext() ─ loads user_profiles ─→ profile block
                 rendered into per-user cached prompt section

   Inbound SMS:  enrich call receives top distortion codes
                 → new insights.distortion_flags
                 → mirror may gently reframe known patterns
```

Everything downstream of `scoreProfile()` is deterministic and free — no LLM calls at onboarding time.

---

## Milestones

### Milestone 1: Schema + persona library
Tables, types, question config, and scoring as pure unit-tested functions. No UI.

### Milestone 2: New onboarding flow + reveal
The user-visible experience for new signups.

### Milestone 3: AI integration
Profile block in daily prompts, belief-aware enrichment, profile-aware memory seed, archetype welcome SMS.

### Milestone 4: Dashboard persona card + founder surfaces
Persona card, founder profile view, drop-off funnel.

### Milestone 5: Existing-user backfill
Shortened quiz behind a dashboard banner.

---

## Milestone 1: Schema + persona library

**Files to create:**
- `supabase/migrations/014_onboarding_v2.sql`
- `src/lib/persona/types.ts` — dimension enums, `PersonaProfile`, `QuizAnswers`
- `src/lib/persona/questions.ts` — question/option config (ids, copy, scoring map) as a typed constant; single source of truth for both UI and scoring
- `src/lib/persona/score.ts` — `scoreProfile(answers): PersonaProfile` (pure)
- `src/lib/persona/content.ts` — archetype + inner-critic reveal copy templates with slots (name, intention category, top value)
- `src/lib/persona/__tests__/score.test.ts` — table-driven tests: every archetype reachable, tie-breaking rules, the no-distortion path, malformed input

**Schema changes:**

```sql
-- Derived persona profile (current version per user)
CREATE TABLE user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  archetype TEXT NOT NULL CHECK (archetype IN ('visionary','alchemist','seeker','phoenix')),
  motivation_orientation TEXT NOT NULL CHECK (motivation_orientation IN ('toward','away')),
  change_style TEXT NOT NULL CHECK (change_style IN ('dreamer','doer')),
  primary_distortion TEXT CHECK (primary_distortion IN (
    'worthiness','all_or_nothing','catastrophizing','should_statements',
    'mind_reading','discounting_positive','personalization'
  )),
  secondary_distortion TEXT,           -- same domain, nullable
  distortion_scores JSONB NOT NULL DEFAULT '{}',
  values TEXT[] NOT NULL DEFAULT '{}', -- top 3
  tone_preference TEXT NOT NULL CHECK (tone_preference IN ('gentle','direct','socratic','celebratory')),
  intention_category TEXT,             -- mirrors message_themes category enum
  quiz_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Retakes archive the previous profile
CREATE TABLE user_profile_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  profile JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_user_profile_history_user
  ON user_profile_history(user_id, created_at DESC);

-- Raw quiz answers, verbatim, re-scorable
ALTER TABLE onboarding_responses ADD COLUMN responses JSONB;
ALTER TABLE onboarding_responses ADD COLUMN quiz_version INTEGER DEFAULT 1;
-- obstacles free-text question is removed from the flow; aligned_state is skippable
ALTER TABLE onboarding_responses ALTER COLUMN obstacles DROP NOT NULL;
ALTER TABLE onboarding_responses ALTER COLUMN aligned_state DROP NOT NULL;

-- Lightweight drop-off tracking
CREATE TABLE onboarding_step_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  step TEXT NOT NULL,
  quiz_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_onboarding_step_events_step
  ON onboarding_step_events(step, created_at DESC);
```

RLS mirrors `onboarding_responses`: users read/write own `user_profiles` row; admins read all; `user_profile_history` and `onboarding_step_events` admin-only reads, service-role writes.

**Key implementation points:**

1. `questions.ts` encodes the full scoring map from the PRD (screen 9–11 distortion weights, exclusive options like "no doubt comes up"). UI renders from this config; `score.ts` consumes the same config — copy edits never touch scoring logic.
2. Tie-breaking in `scoreProfile`: highest distortion score wins; ties broken by the inner-voice (screen 11) answer; remaining ties by fixed priority order from the PRD. Secondary = next-highest with score ≥ 2.
3. `content.ts` exports `buildRevealContent(profile, { name, intentionCategory })` returning the three reveal sections as strings — also reused by the welcome SMS line and dashboard card.

**Done when:** migration runs cleanly in dev; `npm run typecheck` passes; score tests cover all four archetypes, all seven patterns, the confident/no-pattern path, and tie-breaks.

---

## Milestone 2: New onboarding flow + reveal

**Files to create:**
- `src/components/onboarding/steps/category-step.tsx` — 8 category tiles
- `src/components/onboarding/steps/tap-question-step.tsx` — generic single/multi-select step rendered from `questions.ts` config (handles screens 7–11, 13)
- `src/components/onboarding/steps/values-step.tsx` — pick-3 chip grid
- `src/components/onboarding/steps/reveal-step.tsx` — transition + reveal sections + CTA

**Files to edit:**
- `src/components/onboarding/onboarding-flow.tsx` — new step order (PRD table); tap answers accumulate in client state; reveal computes `scoreProfile()` client-side for instant render
- `src/components/onboarding/steps/vision-step.tsx` — reword to the "ordinary Tuesday" framing
- `src/components/onboarding/steps/aligned-state-step.tsx` — add skip affordance
- `src/components/onboarding/steps/obstacles-step.tsx` — removed from flow (file deleted)
- `src/app/onboarding/page.tsx` — progress indicator reflects new step count
- `src/lib/onboarding/actions.ts` — extend `completeFullOnboarding` to accept the full answer payload: writes `onboarding_responses` (with `responses` JSONB + `quiz_version`), inserts `user_profiles` (server re-runs `scoreProfile` — never trust client-computed profile), seeds memory, marks onboarded, sends welcome SMS. Add a small `recordOnboardingStep(step)` action called fire-and-forget on each step entry.

**Key implementation points:**

1. **Server is authoritative for scoring.** The client runs `scoreProfile` only to render the reveal instantly; `completeFullOnboarding` re-derives the profile from raw answers and persists that. Same pure function both sides, so no drift.
2. Tap steps auto-advance ~250ms after selection (single-select); multi-select and values use an explicit continue button. Framer Motion transitions match existing steps.
3. Reveal transition is 1.5–2s, skippable by tap. No fake percentage bars.
4. Profile-save failure path per PRD: onboarding still completes; profile insert retried once, then logged — daily send tolerates a missing profile.
5. Keep the lightly magical aesthetic: one question per screen, generous whitespace, theme colors (teal/purple/yellow accents on selected states).

**Done when:**
- New signup completes the full 15-screen flow in under 4 minutes
- Reveal renders the correct archetype/pattern for scripted answer sets (manual matrix: 4 archetypes × 2 patterns spot-checked)
- `onboarding_responses.responses`, `user_profiles`, `user_memory`, and welcome SMS all land from one completion
- Skipping aligned-state works; back navigation preserves answers
- Step events appear in `onboarding_step_events`

---

## Milestone 3: AI integration

**Files to edit:**
- `src/lib/ai/types.ts` — `UserContext` gains `profile: PersonaProfile | null`
- `src/lib/ai/index.ts` — `buildUserContext()` loads `user_profiles`
- `src/lib/ai/prompts.ts` — `buildUserPrompt()` renders the profile block (PRD §"Daily prompt generation"); appended to the per-user cached section alongside memory
- `src/lib/ai/enrich.ts` — pass user's primary/secondary distortion codes into the call; parse new `distortion_flags` field; store in `messages.insights`
- `src/lib/ai/prompts/enrich.ts` — add distortion-flag output spec + mirror reframe guidance (gentle, never labels, ≤ ~25% of mirrors; exemplars included)
- `src/lib/ai/memory.ts` — `buildSeedMemoryFromOnboarding()` composes `tone_notes` from tone preference + aligned-state, seeds `obstacles` from the friendly-named pattern, seeds `themes` from intention category
- `src/lib/sms/` welcome path — welcome SMS template gains the archetype line via `buildRevealContent`

**Key implementation points:**

1. **Prompt block is ~80 tokens** and rendered from the profile deterministically — same template every day, so it caches with the memory block. Guidance lines: frame forward for `toward`, honor effort for `doer`, never name patterns clinically.
2. **Enrichment stays one call.** Distortion codes ride in as two extra context lines; `distortion_flags` is one extra output field. If the model omits it, default `[]` — never fail enrichment over it.
3. **No profile, no block.** Users without profiles (pre-backfill existing users) get exactly today's prompt — zero regression risk.
4. Tone preference also nudges `selectContentType` inputs lightly? **No** — explicitly out of scope (PRD Phase 2). Tone affects wording via the prompt block only.

**Done when:**
- Daily prompt for a test user with a profile visibly reflects tone preference and archetype framing (qualitative founder review of 10 generations)
- A test reply exhibiting the user's known pattern produces `insights.distortion_flags` containing it, and the mirror reframes gently in some-but-not-all cases
- A user with no profile generates byte-identical prompt structure to current production
- Prompt cache hit rate unchanged (≥ 80%)

---

## Milestone 4: Dashboard persona card + founder surfaces

**Files to create:**
- `src/components/dashboard/persona-card.tsx` — archetype name, one-liner, inner-critic pattern, values chips, quiet retake link
- `src/components/dashboard/founder-onboarding-funnel.tsx` — step → count funnel from `onboarding_step_events`

**Files to edit:**
- `src/app/dashboard/page.tsx` — render persona card when a profile exists
- `src/components/dashboard/founder-user-insights.tsx` — profile section per user: archetype, dimensions, distortion scores, raw answers (collapsible), quiz version
- `src/app/dashboard/founder/page.tsx` — wire in the funnel component

**Key implementation points:**

1. Persona card follows dashboard principles: calm, no metrics, no streaks. It is a mirror, not a scoreboard.
2. Retake routes to the shortened flow (Milestone 5's flow, reused); on completion the old profile row is archived to `user_profile_history` and replaced.

**Done when:** persona card renders for profiled users and hides otherwise; founder sees profile + raw answers per user; funnel shows step counts for the last 30 days.

---

## Milestone 5: Existing-user backfill

**Files to create:**
- `src/app/onboarding/archetype/page.tsx` — shortened flow: screens 4 + 7–13 + reveal (skips name/phone/intention/vision/aligned-state)
- `src/components/dashboard/archetype-banner.tsx` — dismissible "Discover your manifestation archetype — 2 minutes" banner

**Files to edit:**
- `src/lib/onboarding/actions.ts` — `completeArchetypeQuiz` action: writes profile + merges raw answers into `onboarding_responses.responses`; does NOT touch `onboarding_completed`, intention, or welcome SMS; refreshes `user_memory.tone_notes`
- `src/app/dashboard/page.tsx` — show banner when `onboarding_completed = true` and no `user_profiles` row; dismissal persisted (users metadata or local flag — implementer's choice, survive sign-out preferred)

**Key implementation points:**

1. The shortened flow reuses the exact same step components and `questions.ts` config — only the step list differs.
2. Existing users' memory is NOT reseeded wholesale (it may contain months of compaction); only `tone_notes` and `obstacles`-pattern line are merged in.

**Done when:** an existing onboarded user can complete the short quiz from the banner, gets the reveal, the profile lands, their next daily prompt includes the profile block, and their compacted memory is preserved.

---

## Rollout sequence

1. Milestone 1 (schema + library) → no user-visible change
2. Milestone 2 (new flow) → applies to new signups only; founder takes the flow end-to-end with 3–4 scripted personas before announcing
3. Milestone 3 (AI integration) → profile block live for profiled users; founder reviews first week of generations and mirrors daily
4. Milestone 4 (dashboard + founder) → no user-visible risk
5. Milestone 5 (backfill) → banner to existing users once mirror tone is validated

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Reveal feels horoscope-y / generic | Founder rewrites all copy before launch; values + intention category slots make each reveal concrete; screenshot test with 5 real humans |
| Quiz lengthens signup, drops phone capture | Phone is captured at screen 3, before any quiz content — funnel tracks it; if start→phone drops, nothing after it caused it |
| Mirrors that reframe feel preachy | ≤ 25% reframe guidance + exemplars in prompt; founder reviews mirrors daily for first week; one bad week → disable `distortion_flags` usage via prompt edit, data keeps flowing |
| Distortion taxonomy feels diagnostic to users | Clinical terms never appear in any user-facing surface; only friendly names ship in copy; PRD language review before launch |
| Client/server scoring drift | Single pure `scoreProfile` used by both; table-driven tests pin the mapping; raw answers stored so profiles can be re-derived |
| `obstacles` NOT NULL relaxation breaks old code paths | Grep for `obstacles` consumers (memory seed, founder views) and null-guard in Milestone 1, before the flow stops supplying it |

## Open technical questions

1. **Where does banner dismissal persist?** `users` metadata column vs. localStorage. Recommendation: a `users.archetype_banner_dismissed_at` timestamp — survives devices, trivially queryable.
2. **Should `user_profiles.values` avoid the reserved-ish column name?** `values` is quotable in Postgres but annoying. Recommendation: name it `core_values` in the actual migration.
3. **Reveal screenshot-ability** (PRD open question 1): design reveal at mobile width with the archetype section self-contained in the first viewport, so organic sharing works without building share infra.
4. **Does `completeFullOnboarding` stay a single server action or split?** It now writes 4 tables + sends SMS. Recommendation: keep single action, wrap table writes in one RPC/transaction where possible, SMS fired after commit (existing pattern).
