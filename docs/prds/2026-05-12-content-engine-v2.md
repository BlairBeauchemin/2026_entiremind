# Content Engine v2: Trusted Guide

**Status:** Draft
**Author:** Blair Beauchemin
**Date:** 2026-05-12
**Target launch:** Phase 1 first, then incremental rollout

---

## Summary

Evolve the content engine from a daily message generator into a system that feels like a trusted guide: one that remembers users, listens to what they say, acknowledges them when they reply, and adapts what it sends based on where they are in their journey. Every change must serve the Action → Signal → Learning → Adjustment → Action loop, and must stay cheap enough to scale to thousands of users.

## Background

The current content engine sends a daily AI-generated SMS at 7:45 AM Pacific to every active user. It knows the user's name, current intention, engagement score, and consecutive silences. It does not know:

- What the user has been talking about
- How they have been feeling lately
- Which content types actually earn replies from them
- What their original vision or obstacles were

When a user replies, the system silently stores the message and moves on — no acknowledgement, no feedback that the message landed. The next day's prompt is generated as if the reply never happened.

This breaks the "trusted guide" promise. Users cannot tell if anyone is listening, and the AI never improves its grasp of who they are.

## Goals

1. **Make every reply feel heard.** No reply goes unacknowledged.
2. **Give the AI longitudinal context.** Daily prompts are informed by recurring themes, recent emotional state, and the user's original vision.
3. **Adapt content selection to the individual.** Move from random rotation to rules driven by per-user signal.
4. **Capture richer signal from replies.** Sentiment, themes, modality — structured data, not just raw text.
5. **Stay cheap.** Aggregate LLM cost should stay under $5/day at 1,000 active users.

## Non-goals (Phase 1)

- Hourly send cadence (deferred — Vercel Hobby tier limits us to daily crons)
- User-visible memory or insights surface (founder-only for now)
- Embedding-based semantic retrieval
- Fully autonomous intention updates (founder approval required)
- Multi-message conversational threads within the same day
- New content types beyond the existing five

## Success metrics

**North star (unchanged):** Unprompted user replies to SMS.

**Phase 1 supporting metrics:**
- Reply rate increases week over week after launch
- Long-reply rate (replies ≥ 100 chars) increases
- Consecutive-silence count decreases for previously engaged users
- Founder time-to-insight per user drops (subjective; track via founder feedback)
- LLM cost per active user per day stays under $0.005

## User stories

**As a user:**
- When I reply to a daily prompt, I get a short acknowledgement within ~1 minute so I know it was received
- When I share something substantive, the acknowledgement reflects what I said, not a generic "thanks"
- Over time, the daily prompts feel like they remember me — they reference past themes, my vision, my obstacles
- I never feel like the system is chatty or robotic

**As the founder:**
- I can see each user's recurring themes, sentiment trend, and memory blob at a glance
- I can review and approve intention shifts the system detects
- I can adjust content selection rules without redeploying code (config-driven)

## Functional requirements

### 1. Reply enrichment (real-time)

When an inbound SMS arrives, a single Haiku call performs both enrichment and acknowledgement generation:

- **Enrichment output:**
  - `sentiment`: positive | neutral | struggling
  - `emotional_state`: free-form short label (e.g., "anxious", "hopeful", "stuck")
  - `themes`: open-ended array of short tags (e.g., ["focus", "self-worth"])
  - `category`: one required value from a fixed list (career, health, relationships, money, identity, creative, family, spiritual, other)
  - `modality`: reflective | action-oriented | venting | question
  - `mentions`: array of named entities
  - `open_thread`: boolean — did the user ask the system something?
  - `substantive`: boolean — is this a deep/long reply (≥ 30 chars OR strong signal)?
- **Acknowledgement output (in same call):**
  - For substantive replies: an AI-generated mirror line referencing what they said
  - For non-substantive replies: `null` (we use the soft-ack library instead)

Storage:
- `messages.insights` JSONB column (all enrichment fields)
- `message_themes` join table (one row per `(message_id, theme)` pair, for cross-user trend queries)

### 2. Reply acknowledgement

Every inbound reply (except STOP requests) receives feedback:

- **Short / trivial replies (< 30 chars, not substantive):** an SMS from a curated rotating library. Library starts with ~15 phrases ("Got that.", "Holding this.", "Thank you.", "Sitting with that.", etc.). Selection rotates to avoid repetition within the last 5 acks per user.
- **Substantive replies (≥ 30 chars OR substantive flag set):** the AI-generated mirror from the enrichment call.
- **STOP requests:** no ack. Provider compliance reply handles this.

Acks are sent via the existing `sendSms` path and recorded in `messages` with `content_type = 'ack'` and `ai_generated = true` (mirrors) or `false` (soft ack). Acks do NOT trigger silence detection.

### 3. User memory summary

A per-user blob (`user_memory.summary`, ~400 tokens max) maintained by a weekly Sonnet pass:

- Pulls last 7 days of inbound replies + their insights
- Compacts into a structured paragraph covering: current themes, emotional trajectory, mentions of named people/places/projects, open threads to revisit, breakthroughs or stuck points
- Refreshed every Monday morning before the daily send
- Injected into the daily prompt as a system-message block (prompt-cached for 90% discount)

For users with < 3 days of history, the memory is seeded from onboarding answers instead.

### 4. Smarter content selection

Replace random rotation with rules:

1. **No repeat:** Do not send the same `content_type` two days in a row
2. **Earned-reply bias:** Bias 60/40 toward the user's two highest reply-rate types (computed over last 30 days, minimum 5 sends to qualify)
3. **State match:** If `consecutive_silences ≥ 3` OR last reply sentiment was "struggling", force lighter type (`check-in` or `gratitude`)
4. **Enable `quote`:** Currently unselectable. Add to the rotation, used max 1×/week per user.

Config lives in a `content_selection_config` table so founder can tweak without deploy.

### 5. Next-day reference

When generating the daily prompt:

- If yesterday's reply was substantive, pass its themes + emotional state into the prompt builder as a "recent context" slot
- Prompt guidance: "You may subtly reference the user's recent reflection if it fits naturally. Do not force a callback."
- Skip the slot entirely if yesterday was silence, STOP, or a non-substantive reply

### 6. Web-form onboarding

Before the first daily prompt is scheduled, route the user to a 4-question web onboarding form:

1. **Intention** — what do you want to manifest?
2. **Vision** — if this manifested, what would your life look like?
3. **Obstacles** — what has been getting in the way?
4. **Aligned-state** — when do you feel most like yourself?

Answers stored in `onboarding_responses` table and used to seed the `user_memory.summary` for new users.

Onboarding completion sets `users.onboarding_completed = true`, which gates eligibility for the daily send.

### 7. Timezone & preferred send time

Add user-facing fields in dashboard settings:
- `users.timezone` (already exists, surface in UI)
- `users.preferred_send_hour` (0–23, local time, default 7)

For Phase 1, daily-send cron continues to run at 7:45 AM Pacific globally and sends to everyone. The preference is stored but not honored. When Vercel Pro is acquired, switch to hourly cron filtered on local time.

UI must communicate clearly: "We'll send around your preferred hour soon. For now all messages go out at 7:45 AM Pacific."

### 8. Intention evolution detection

Weekly Sonnet pass (alongside memory compaction) inspects recent replies for signals that the user's intention has shifted:
- New goals mentioned
- Original intention no longer referenced
- Direct restatement of what they want

If detected, write a row to `intention_shift_suggestions` table with: original intention, proposed updated intention, confidence, supporting reply IDs. Surface in founder review for approval. Approved suggestions update the active intention; rejected ones are dismissed.

### 9. Founder review UI

Augment `/dashboard/founder` to show per-user:
- Memory summary blob
- Recent themes (last 30 days, tag cloud)
- Sentiment trend mini-chart (positive / neutral / struggling, last 14 days)
- Pending intention shift suggestions with approve/dismiss buttons
- Reply-rate-by-content-type table

## Non-functional requirements

### Cost ceiling

| Operation | Provider | Frequency | Est. cost per event |
|---|---|---|---|
| Reply enrichment + ack | Haiku, prompt cached | Per inbound | ~$0.0002 |
| Daily prompt generation | Haiku, prompt cached | Per active user/day | ~$0.0002 |
| Weekly memory compaction | Sonnet, batch API | Per active user/week | ~$0.005 |
| Intention shift detection | Sonnet, batch API | Per active user/week | runs in same pass as memory |
| Soft ack library | None (static) | Per inbound | $0 |

At 1,000 active users with ~30% daily reply rate:
- ~$0.20/day enrichment + acks
- ~$0.20/day daily prompts
- ~$5/week memory compaction → ~$0.70/day amortized
- **Total: ~$1.10/day**

### Performance

- Inbound webhook → ack SMS sent: < 5 seconds p95
- Daily send job completes in < 5 minutes for 1,000 users
- Weekly memory job completes in < 30 minutes for 1,000 users

### Data retention

- `signal_events`: retain indefinitely
- `messages.insights`: retain indefinitely
- `user_memory.summary`: only current version stored; previous versions archived to `user_memory_history`

### Failure modes

- Enrichment LLM failure → store inbound with `insights = null`; soft ack fires anyway; no mirror sent. Silence is better than wrong mirror.
- Daily prompt LLM failure → existing fallback messages fire (already implemented)
- Weekly memory failure → keep previous week's memory; alert founder; retry next day
- Acknowledgement SMS send failure → log to errors table, do not retry (avoid double-acks)

## Open questions

1. **Mirror tone consistency.** Substantive-reply mirrors are AI-generated per call. Should we constrain them to a structural template ("Hearing [theme]. [reflection]") to keep the brand voice tight, or let Haiku free-form within the system prompt? Recommendation: free-form, but include 3–4 exemplars in the prompt.
2. **Soft-ack library curation.** Who maintains the rotating library? Recommendation: founder edits it in a `soft_acks` config table; ships with seed values.
3. **Intention shift confidence threshold.** What confidence score (0–1) gates a suggestion vs. silently ignoring? Recommendation: 0.6 to start; tune from founder review feedback.
4. **Memory blob format.** Free-form prose vs. structured sections (themes, threads, vision, etc.). Recommendation: structured sections — easier for Haiku to use selectively.

## Out of scope (future phases)

- **Phase 2:** Hourly send cadence + true timezone-aware delivery
- **Phase 2:** Same-day conversational follow-ups beyond the initial ack
- **Phase 3:** Bandit-style content selection replacing rules
- **Phase 3:** Embedding-based reply retrieval for richer prompts
- **Phase 3:** User-facing insights surface ("here is what we have noticed")
- **Phase 4:** Automatic intention updates without founder approval
