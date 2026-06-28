# Onboarding v2: Archetype Discovery

**Status:** Draft
**Author:** Blair Beauchemin
**Date:** 2026-06-11
**Target launch:** New signups first, then existing-user backfill

---

## Summary

Replace the current four-question free-text onboarding with a ~3–4 minute archetype discovery experience inspired by personality tests, values-discovery exercises, and CBT. The flow mixes fast tappable questions with a few free-text moments, ends with a full persona reveal ("you are The Visionary, and your inner critic's favorite trick is the All-or-Nothing Trap"), and produces a structured `user_profiles` row that powers every downstream AI surface: daily prompts, reply mirrors, and lightweight journaling feedback.

The point is not the quiz. The point is that the AI currently has four paragraphs of free text to work with and nothing else, which is why daily messages feel repetitive and shallow. This gives the system typed, stable signal about *how this person moves, what they value, and how their inner critic talks* — and gives the user an emotional buy-in moment the current flow never delivers.

## Background

Today's onboarding collects name, phone, and four free-text answers (intention, vision, obstacles, aligned-state). Those answers seed `user_memory` and that's the entire personalization foundation until the first weekly memory compaction.

Problems observed:

- **All signal is unstructured.** The AI must infer everything from four paragraphs. There is no stable typed data — no motivation style, no belief patterns, no values. Daily prompts can only riff on the same four answers, which reads as repetitive.
- **"Obstacles" captures circumstances, not beliefs.** A user writes "I'm too busy" and the system takes it at face value. The limiting belief underneath ("my needs come last") is never surfaced, so it can never be worked with.
- **No payoff for the user.** Personality-test onboarding works because the user gets a mirror back. Today the user gives four answers and receives a generic welcome SMS. The "emotional buy-in moment" promised in Flow B is not earned.
- **No tone calibration.** Some users want gentle encouragement; some want directness. We never ask, so the AI guesses the same way for everyone.

### Grounding (and honesty about it)

The question set borrows from established frameworks rather than invented quiz logic:

- **Limiting beliefs / inner-critic patterns** — adapted from the classic CBT cognitive-distortion taxonomy (Burns): all-or-nothing thinking, catastrophizing, "should" statements, discounting the positive, mind reading, personalization, labeling.
- **Motivation orientation** — approach vs. avoidance (regulatory focus theory): moving *toward* a vision vs. *away from* a pain. Well-studied; should change message framing.
- **Values** — a condensed pick-3 from a Schwartz-style values list.
- **Archetypes** — the persona layer is a deterministic mapping from the measured dimensions. It is a UX and personalization device, **not** a psychometric claim. We never market it as clinically validated, and the reveal copy stays in "lightly magical" register, not clinical register.

## Goals

1. **Capture structured personalization signal** at signup: motivation orientation, change style, dominant inner-critic patterns, values, tone preference, intention category.
2. **Surface limiting beliefs early and gently**, so daily messages and reply mirrors can work with them instead of around them.
3. **Deliver an emotional buy-in moment** — a persona reveal that makes the user feel seen before the first SMS ever arrives.
4. **Reduce daily-message repetitiveness** by giving the prompt builder materially more to vary against.
5. **Make journaling feedback belief-aware.** When a user texts in how they feel, the enrichment pass should recognize their known patterns and the mirror should be able to gently reframe.
6. **Stay fast and cheap.** Whole flow ≤ 4 minutes; zero new LLM cost at onboarding time (scoring is deterministic, reveal is templated).

## Non-goals

- Psychometric validity claims or licensed instruments (MBTI, Enneagram, formal Big Five short forms)
- Multi-step guided exercises over SMS (downward arrow, reframe practice) — Phase 2, see Out of scope
- A user-facing insights dashboard beyond the persona card
- Autonomous re-typing of users without their participation (retake is user-initiated)
- Changing the daily-send cadence or content types

## Success metrics

**North star (unchanged):** Unprompted user replies to SMS.

**Supporting metrics:**
- Onboarding completion rate (start → reveal) ≥ 70%; step-level drop-off visible to founder
- Reply rate in first 14 days for the v2 cohort exceeds the v1 cohort baseline
- Long-reply rate (≥ 100 chars) in first 14 days increases vs. baseline
- Founder qualitative review: daily prompts for v2 users visibly vary in angle, not just wording
- Share of substantive-reply mirrors that reference a known pattern (target: present but < 30% — it should feel occasional, not formulaic)

## User stories

**As a new user:**
- I answer mostly tap-questions that feel like a thoughtful quiz, not a form
- At the end I get a named archetype and a description of my inner critic's pattern that feels uncannily accurate
- The first SMS I receive already sounds like it knows how I move
- I was never asked anything that felt clinical or diagnostic

**As an existing user:**
- I see a gentle invitation on my dashboard to "discover my archetype" (2 minutes)
- Taking it doesn't re-ask my name, phone, or intention

**As the founder:**
- I can see each user's archetype, dimensions, and raw quiz answers in the founder dashboard
- I can see where users drop off in the flow
- I can edit reveal copy and archetype descriptions without redeploying (content lives in code initially; founder-editable is an open question)

## The flow

Fifteen screens, ~3–4 minutes. Free-text answers ~30–45s each; taps ~5–10s each. Existing screens marked.

| # | Screen | Type | Captures |
|---|--------|------|----------|
| 1 | Welcome | — (existing) | — |
| 2 | Name | text (existing) | `users.name` |
| 3 | Phone | text (existing) | `users.phone` |
| 4 | Dream category | tap, 1 of 8 | `intention_category` |
| 5 | Intention | free text (existing) | `intentions` row |
| 6 | Vision | free text (reworded) | memory seed |
| 7 | Motivation orientation | tap, 1 of 2 | `motivation_orientation` |
| 8 | Change style | tap, 1 of 2 | `change_style` |
| 9 | Past pattern | tap, 1 of 5 | distortion scores |
| 10 | First doubt | tap, up to 2 of 7 | distortion scores |
| 11 | Inner voice | tap, 1 of 5 | distortion scores |
| 12 | Values | tap, 3 of 10 | `values` |
| 13 | Tone preference | tap, 1 of 4 | `tone_preference` |
| 14 | Aligned state | free text, skippable (existing) | memory seed / tone notes |
| 15 | Reveal | — | persona payoff, completes onboarding |

The free-text "obstacles" question is **removed** — screens 9–11 replace it with structured belief signal, which is the entire point of this redesign.

### Question content (v1 draft — founder reviews all copy before launch)

**4. Dream category** — "What part of life is calling you right now?"
Options map 1:1 to the existing `message_themes` category enum: career, health, relationships, money, creative, identity, family, spiritual. (Tap one. "Other" omitted — the free-text intention catches edge cases.)

**5. Intention** — "In your own words: what do you want to manifest?" *(unchanged)*

**6. Vision** — "If it came true — what would an ordinary Tuesday look like?"
(Rewording of the current vision question. Anchoring to an ordinary day produces concrete, sensory answers instead of abstractions, which makes far better memory-seed material.)

**7. Motivation orientation** — "Which feels more true right now?"
- "I'm reaching toward something I can almost see" → `toward`
- "I'm ready to leave something behind" → `away`

**8. Change style** — "Be honest — which is harder for you?"
- "The doing. I can picture it vividly; following through is the work" → `dreamer`
- "The believing. I take action constantly; trusting it will work is the work" → `doer`

**9. Past pattern** — "When you've gone after big things before, what usually happened?"
- "I start strong, then lose steam" → `all_or_nothing` +1
- "I wait for the perfect moment, and it never quite comes" → `all_or_nothing` +1, `catastrophizing` +1
- "I get close, then talk myself out of it" → `worthiness` +1
- "Honestly, I've never let myself really try" → `worthiness` +1, `catastrophizing` +1
- "I usually get there — I'm here for what's next" → no score (high-confidence signal, stored)

**10. First doubt** — "When you imagine actually having this, what's the first whisper of doubt?" *(pick up to 2)*
- "Who am I to want this?" → `worthiness` +2
- "It's probably too late for me" → `catastrophizing` +2
- "If I can't do it perfectly, why start?" → `all_or_nothing` +2
- "People will judge me for trying" → `mind_reading` +2
- "Even if I get it, I'll lose it" → `catastrophizing` +2
- "Wanting more feels selfish" → `personalization` +2
- "Honestly? No doubt comes up" → no score (exclusive — cannot combine)

**11. Inner voice** — "When something goes wrong, what does the voice in your head usually say?"
- "You always do this." → `all_or_nothing` +2
- "You should have tried harder." → `should_statements` +2
- "See? It was never going to work." → `catastrophizing` +2
- "Everyone saw that coming." → `mind_reading` +2
- "Even when it works, it's mostly luck." → `discounting_positive` +2

**12. Values** — "Pick the three that matter most — not the ones that should."
Chips: Freedom, Growth, Connection, Peace, Adventure, Creativity, Security, Achievement, Service, Recognition.

**13. Tone preference** — "When we text you, what helps most?"
- "Gentle encouragement" → `gentle`
- "Straight-up honesty" → `direct`
- "Questions that make me think" → `socratic`
- "Celebrating the small wins" → `celebratory`

**14. Aligned state** — "Last one: when do you feel most like yourself?" *(skippable; existing question, kept because it produces uniquely good tone material)*

### The persona model

**Archetype = motivation orientation × change style.** Four base archetypes:

| | `dreamer` | `doer` |
|---|---|---|
| **`toward`** | **The Visionary** — sees it before it exists; the work is the bridge between the vision and the Tuesday | **The Alchemist** — turns intention into motion; the work is trusting the process while it's still invisible |
| **`away`** | **The Seeker** — knows exactly what they're done with; the work is letting the next thing become as vivid as the old pain | **The Phoenix** — rebuilds through action; the work is building toward, not just away |

**Inner-critic pattern** = the highest-scoring distortion (ties broken by the screen-11 answer, then by fixed priority: worthiness > all_or_nothing > catastrophizing > should_statements > mind_reading > discounting_positive > personalization). Friendly names, never clinical labels:

| Code | Friendly name | One-line description (reveal copy) |
|---|---|---|
| `worthiness` | The Imposter Whisper | "It asks 'who are you to want this?' — as if wanting needed credentials." |
| `all_or_nothing` | The All-or-Nothing Trap | "It says if it's not perfect, it doesn't count. So nothing ever gets to count." |
| `catastrophizing` | The Other Shoe | "It's always waiting for things to fall apart — so you never fully arrive." |
| `should_statements` | The Drill Sergeant | "It runs you on 'shoulds' and never says 'well done.'" |
| `mind_reading` | The Invisible Audience | "It's sure everyone is watching and judging. Almost no one is watching." |
| `discounting_positive` | The Luck Story | "Every win was a fluke; every loss was proof. Convenient math, isn't it?" |
| `personalization` | The Selfless Cage | "It says your wants come last. It calls that kindness." |

If no distortion scored (user picked the confident options throughout), the reveal skips the inner-critic section and leans on values + archetype. This is stored as `primary_distortion = null` and is itself signal (high baseline confidence — messages can be more challenge-oriented).

The full persona = **archetype + inner-critic pattern + values + tone preference**: 4 × 8 (7 patterns + none) surface combinations, with values and intention category filling template slots — enough variety that two friends comparing reveals see different content.

### The reveal (screen 15)

A brief "reading your answers…" transition (1.5–2s, Framer Motion, no fake progress bars), then a single scrollable result:

1. **Archetype name + mark** — "You're **The Visionary**." One short paragraph mirroring them, with their intention category and top value woven into template slots.
2. **Your inner critic's favorite trick** — friendly-named pattern + its one-liner + one sentence on how Entiremind will respond to it ("When we hear the All-or-Nothing Trap in your messages, we'll remind you that done is a form of perfect.").
3. **How this works** — three short lines: morning texts tuned to their tone preference, reply anytime as a lightweight journal, it learns and adapts.
4. **CTA** — "Your first message is on its way." Completing the reveal fires `completeFullOnboarding` (profile + memory seed + welcome SMS).

All reveal content is **templated, not LLM-generated** — instant, free, and brand-controlled. The welcome SMS references the archetype by name ("Visionary energy. We see it. Your first prompt lands tomorrow morning.").

## How the profile powers the system

### 1. Daily prompt generation

`buildUserContext()` loads the profile; `buildUserPrompt()` renders a new block (~80 tokens):

```
About this user:
- Archetype: The Visionary (vivid imagination; follow-through is their growth edge)
- Moving toward their vision (not away from pain) — frame forward
- Inner critic pattern: all-or-nothing thinking. Gently counter it when relevant.
  Never name it clinically. Never say "cognitive distortion."
- Values: freedom, creativity, peace
- Tone preference: questions that make them think
```

This is appended to the per-user cached block alongside memory — same caching strategy, negligible cost delta.

### 2. Belief-aware reply enrichment (the journaling upgrade)

The enrichment call (`src/lib/ai/enrich.ts`) receives the user's top distortion codes and gains one output field:

- `distortion_flags: string[]` — which of the user's known patterns (if any) this reply exhibits

Mirror guidance is extended: *if the reply exhibits a known pattern, the mirror may gently reframe — reflect the thought back with one degree more kindness or accuracy. Never label, never diagnose, never say "that's catastrophizing." At most ~25% of mirrors should do this; when in doubt, just reflect.*

Example: user texts "missed my workout again, this whole month is ruined" → mirror: "One missed morning is one missed morning. The month is still mostly unwritten."

This is what turns inbound texts into lightweight journaling with feedback — the existing enrich-and-ack pipeline already does the listening; the profile gives it something to listen *for*.

### 3. Memory seeding

`buildSeedMemoryFromOnboarding()` is extended: `tone_notes` is composed from tone preference + aligned-state answer; `themes` seeds from intention category; `obstacles` seeds from the friendly-named pattern (e.g., "inner critic runs an all-or-nothing pattern; tends to lose steam after strong starts") instead of a raw circumstances paragraph.

### 4. Dashboard persona card

A small card on the dashboard home: archetype name, one-line description, inner-critic pattern, values chips. Calm, no metrics, consistent with dashboard principles. Includes a quiet "retake" link (replaces the profile; previous version archived).

### 5. Founder review

Founder user-insight cards gain a profile section: archetype, dimensions, distortion scores, raw quiz answers, and quiz version. Step-level drop-off counts surface on the founder page.

## Existing users

Users with `onboarding_completed = true` but no profile see a dismissible dashboard banner: "Discover your manifestation archetype — 2 minutes." It launches a shortened flow (screens 4 and 7–13 only; skips name/phone/intention/vision/aligned-state, reusing what we have) ending in the same reveal. Until they take it, daily prompts render without the profile block — exactly today's behavior, no regression.

## Non-functional requirements

### Cost

| Operation | Cost delta |
|---|---|
| Quiz scoring + archetype mapping | $0 (deterministic, in-process) |
| Reveal | $0 (templated) |
| Daily prompt | +~80 input tokens per send (Haiku, cached) — noise |
| Enrichment | +~40 input tokens, +1 output field — noise |

### Performance
- Reveal renders instantly after the transition (no network round-trip for content)
- Each tap-screen advances optimistically; answers persist to client state, full payload saved at completion (same pattern as today's vision/obstacles steps)

### Data integrity
- Raw answers stored verbatim in `onboarding_responses.responses` JSONB alongside the derived profile, with a `quiz_version`, so scoring can be re-run if the mapping ever changes
- Profile retakes archive the previous row to `user_profile_history`

### Failure modes
- If profile save fails at completion: complete onboarding anyway (intention + memory seed still written), queue profile for retry; the daily prompt simply renders without the profile block
- Skipped aligned-state: tone_notes composed from tone preference alone

## Open questions

1. **Reveal shareability.** Add a "share your archetype" image/link? Strong growth mechanic, but it's pre-payment surface area. Recommendation: defer; design the reveal screen to screenshot well in the meantime.
2. **Founder-editable copy.** Should archetype/pattern copy live in a DB table (like `content_selection_config`) instead of code? Recommendation: code first — it's structured template content with slots; move to DB only if iteration frequency demands it.
3. **Drop-off tracking.** A full `onboarding_events` table vs. a lightweight per-step counter? Recommendation: lightweight — one `onboarding_step_events` table with (user_id, step, created_at), founder page renders a funnel from it.
4. **Optional Haiku polish on the reveal paragraph.** A single Haiku call could personalize the archetype paragraph with their actual intention text. ~$0.0002/user and adds latency + tone risk. Recommendation: ship templated; A/B the polish later.

## Out of scope (future phases)

- **Phase 2: SMS exercises.** Multi-step guided exercises over text (downward-arrow belief excavation, evening reframe practice, gratitude threads) as a new `content_type: 'exercise'` with stateful threads. The profile built here is the prerequisite — exercises should target the user's known pattern.
- **Phase 2: pattern-aware content selection.** Let archetype/distortion influence content-type weights (e.g., Drill Sergeants get fewer "action" prompts, more "gratitude").
- **Phase 3: user-facing insights.** "Here's what we've noticed" — sentiment trends and pattern frequency reflected back to the user.
- **Phase 3: periodic re-typing.** Detect via weekly memory pass when behavior has drifted from the profile and invite a retake.
