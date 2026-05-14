# User-Facing Insights Surface

**Status:** Draft
**Author:** Blair Beauchemin
**Date:** 2026-05-14
**Depends on:** Content Engine v2 (memory blob, message_themes, signals already in production)

---

## Summary

Right now, Entiremind learns a lot about its users — themes they keep returning to, emotional patterns, breakthroughs, obstacles — and stores it in the `user_memory` blob and surrounding signal tables. None of this is shown back to the user. They reply to morning prompts and never see what the system has noticed.

This proposes a gentle way to reflect that back: a weekly SMS-first "noticing" that mirrors a small slice of the user's recent inner work, plus (optionally, in a later phase) a calm Reflections surface in the dashboard. The goal is to make users feel *seen*, not measured.

## Why now

Three reasons it's the right next bet after Content Engine v2:

1. **All the data already exists.** No new collection needed — we're rendering what we already have.
2. **It compounds Content Engine v2.** Users who feel seen reply more. The system learns faster. The loop tightens.
3. **It deepens the moat.** The competitor space is full of "habit trackers" and "manifestation journals." A system that tells you what it's noticing about you, in your own voice, is a different category.

## Goals

1. **Make users feel seen** without making them feel monitored.
2. **Surface what the system already knows** in a tone consistent with the trusted-guide voice.
3. **Stay cheap.** Aggregate cost increase should be well under $1/day at 1,000 users.
4. **Stay calm.** No dashboards of stats. No streaks. No "you replied 12 times this week."

## Non-goals

- Replacing the daily morning prompt — it stays the primary surface
- Showing users their raw memory blob, theme tags, sentiment categories, or any system-internal classification
- Productivity metrics, streak counters, engagement scores, or any "performance" framing
- Real-time/on-demand insights (a "show me my insights now" button) — this is a delivered moment, not a queryable surface
- AI-generated advice or interpretation beyond reflection

## Success metrics

**North star (unchanged):** Unprompted user replies to SMS.

**Phase-specific:**
- Weekly insights SMS receives a reply rate ≥ 25% in first month
- Replies to insights SMS skew substantive (≥ 50% pass the substantive threshold)
- No measurable drop in daily morning prompt reply rate after launch
- Users who receive insights SMS retain better than control over 30 days (when we can measure it)

## Why SMS first, dashboard later

The product is SMS-first by design. A weekly reflection arriving in the same thread as the daily prompts:
- Feels like a continuation of the same relationship
- Doesn't require the user to open a web page
- Is harder to ignore than a dashboard widget
- Matches the calm, episodic rhythm of the existing experience

A dashboard surface for the same content is reasonable later, but it shouldn't be the primary delivery mechanism.

## The user experience

**Sunday evening, around 7 PM local time:**

> [SMS from Entiremind]
> A small thing we've been noticing: focus and self-worth keep showing up
> together for you this week. The moment that stood out — Thursday, when
> you finished the draft without rewriting. Carrying that into next week.

That's it. One message. ~280 characters max. No call to action, no question forced at the end. The user can reply if they want — and if they do, that reply gets enriched and acked like any other.

The tone is "I see you" — not "here's your weekly report card."

### Variations

Different users will have different memory richness. The renderer adapts:

- **Rich memory (lots of recent replies, clear themes):** Full noticing — theme, moment, forward-looking note
- **Sparse memory (a few replies):** Lighter — just a theme observation
- **Empty memory (new user, no replies yet):** Skip the send entirely
- **Struggling sentiment trend:** Softer language, no "carrying forward" framing
- **Recent intention shift:** Acknowledge gently without naming it as a shift

## Functional requirements

### 1. New AI prompt: memory → noticing

A Haiku-powered renderer that takes the user's current `user_memory.summary` and produces a single SMS-length reflection in the trusted-guide voice. Output:
- 1–3 sentences
- ≤ 320 characters (SMS reasonable cap; we still want it to feel like one message)
- No emojis
- No questions
- No advice
- Uses one specific detail from memory (a theme, a breakthrough, an open thread) — not all of them

### 2. Weekly insights cron

Runs Sunday evening Pacific time. For each active onboarded user:
- Skip if memory is empty or stale (older than 14 days)
- Skip if sentiment trend is strongly negative AND no breakthrough recorded (we don't want the system to insist on optimism when the user is hurting)
- Skip if user has `insights_opt_out = true`
- Otherwise: render → send

### 3. New content type: `noticing`

Add `'noticing'` to `messages.content_type` and to the SMS layer's `ContentType` union. Required because:
- We need it to NOT count as the daily morning prompt
- We need it filtered out of "already sent today" checks in the same way `ack` is
- We need reply rate per content type to track it separately
- We need silence detection to handle it differently (a missed noticing isn't the same as a missed morning prompt)

### 4. User opt-out

Add `users.insights_opt_out` (BOOLEAN, default `false`). Settings UI exposes a toggle: "Weekly noticing — Sunday evening reflection on what we've been noticing." Toggle off → cron skips this user.

### 5. (Phase B) Dashboard Reflections surface

A new tab in the user dashboard showing:
- The most recent rendered noticing (rendered text, not raw memory)
- Optionally, a few past noticings as a history

NOT shown:
- Raw memory blob
- Theme tags or categories
- Sentiment labels
- Reply counts or engagement scores

Phase B is deferred — see "Phasing" below.

## Non-functional requirements

### Cost ceiling

Per user per week:
- Render call (Haiku): ~$0.0003
- At 1,000 users: ~$0.30/week total. Negligible.

### Latency

The render call is on a cron, not user-facing. No latency budget — just needs to finish before the SMS send.

### Failure modes

| Failure | Behavior |
|---|---|
| Render LLM fails | Skip this user this week. Don't send a fallback (a generic "we're noticing things about you" feels worse than silence). |
| Memory blob missing | Skip user. Wait for next weekly memory cron to populate it. |
| SMS send fails | Log error, don't retry. Don't double-send. |
| User opts out mid-week | Honor on next run. |

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Surveillant feeling — user realizes the system is watching closely | Tone is the whole defense. Lean into "we noticed" not "we tracked." Never reveal raw classifications. Soft language. Easy opt-out. |
| User reads it and changes how they reply (Heisenberg effect) | This may happen and is partly fine — making reflection more conscious is the product. The risk is performative replies. Watch for it; if reply substantiveness drops, soften the noticings further. |
| Cron lands during a hard moment | The "skip when struggling without breakthrough" rule handles the worst case. Watch first month closely. |
| Two messages on Sunday (scheduled message + insights) | Cron must check for any outbound SMS sent within the last 4 hours and defer. |
| Insights feel generic | If they do, founder edits the renderer prompt. This is a tuning problem, not an architecture one. |
| Reply-rate metric for "noticing" pollutes content selection | Exclude `'noticing'` from the earned-reply-rate calculation in `selectContentType()`. |

## Open questions

1. **Monetization.** Is "weekly noticing" a free feature for everyone, or premium-only? Arguments either way:
   - Free: it's a relationship-deepening moment; gating it weakens the product for free users at exactly the moment when conversion would be highest
   - Premium: it's substantive enough to justify the upgrade, especially as the noticings get richer over time
   - **Recommendation:** Free in Phase 1, watch retention impact, consider gating extended-history (Phase B dashboard) to premium.

2. **Timing.** Sunday evening, or different per user?
   - Sunday evening fits the "looking back, going forward" energy
   - Earlier on Sunday feels less heavy
   - **Recommendation:** Sunday 7 PM local. Honor `users.timezone` even though daily-send doesn't yet — this cron runs only once per user per week, so we can afford 24 cron invocations (one per hour, filtered by user timezone). Defer until Vercel Pro if needed.

3. **Frequency.** Weekly forever, or escalating?
   - Weekly forever is safer; over-delivering would dilute the signal
   - **Recommendation:** Weekly forever for now. Revisit if engagement data suggests otherwise.

4. **Should the noticing reference yesterday's reply?** The daily prompt sometimes does. The noticing covers a longer arc — referencing yesterday feels off.
   - **Recommendation:** No. The noticing is a *zoomed-out* moment. Last-reply reference is the daily prompt's job.

5. **What happens when a noticing gets a reply?**
   - It's already enriched + acked by the existing M2 pipeline — no special handling needed
   - The reply also feeds into next week's memory blob — so noticings beget richer noticings. Good feedback loop.

## Phasing

**Phase A — Weekly SMS noticing (this PRD):**
- New `noticing` content type
- Renderer prompt + module
- Weekly cron
- User opt-out toggle

**Phase B — Reflections dashboard surface (deferred):**
- New `/dashboard/reflections` page showing recent noticings
- No new data — just a different rendering of what was already sent

**Phase C — Personalized cadence (deferred, depends on user demand):**
- Some users might want bi-weekly; some might want a quarterly retrospective
- Skip until at least 50 users have received Phase A for a month

## Out of scope (future phases)

- Personalized weekly summaries showing user-specific data ("here's what you said this week")
- Habit-tracker style streaks or counters
- Goal-progress visualizations
- AI coaching responses or recommendations
- Insights pushed via email (we are SMS-first)
- Public/shareable reflections
