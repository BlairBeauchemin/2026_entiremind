# User Insights Surface — Implementation Plan

**PRD:** `docs/prds/2026-05-14-user-insights-surface.md`
**Depends on:** Content Engine v2 (memory blob + signal data already in production)
**Estimated effort:** ~1 day of focused work
**Date:** 2026-05-14

---

## Architecture overview

```
  Sunday 7 PM local time per user (Vercel cron — Pro tier ideally)
                          │
                          ▼
              ┌────────────────────────────────────┐
              │ Weekly insights cron               │
              │ For each active onboarded user:    │
              │  1. Load user_memory.summary       │
              │  2. Skip if empty / stale / opted-out
              │  3. Skip if struggling with no breakthrough
              │  4. Skip if any outbound in last 4h
              │  5. Render via Haiku → "noticing" text
              │  6. Send via sendSms (content_type='noticing')
              └────────────────────────────────────┘
                          │
                          ▼
             User receives one SMS
                          │
                          ▼
       If they reply, existing M2 enrichment + ack pipeline handles it
       (no special handling needed — reply enriches into next week's memory)
```

## Milestones

### Milestone 1 — Schema additions
Tiny migration. Adds `'noticing'` to content_type and a single user opt-out column.

### Milestone 2 — Renderer module
The AI call that turns a memory blob into a single SMS-length noticing.

### Milestone 3 — Weekly cron
The job that iterates users and sends the noticings.

### Milestone 4 — Settings opt-out toggle
User-facing UI to turn off weekly insights.

### Milestone 5 — Content selection integration
Make sure `'noticing'` doesn't pollute earned-reply stats or trigger silence detection wrongly.

### (Deferred) Milestone 6 — Dashboard Reflections surface
Phase B. Skip for initial launch.

---

## Milestone 1: Schema

**File to create:** `supabase/migrations/014_user_insights.sql`

```sql
-- Extend messages.content_type to include 'noticing'
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_content_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_content_type_check
  CHECK (content_type IN (
    'reflection','quote','check-in','action','gratitude',
    'welcome','manual','ack','noticing'
  ));

-- User opt-out for weekly noticings
ALTER TABLE users ADD COLUMN IF NOT EXISTS insights_opt_out BOOLEAN DEFAULT false;
```

**Done when:**
- Migration runs cleanly
- Existing flows still work
- `users.insights_opt_out` defaults to `false` for every existing user

---

## Milestone 2: Renderer module

**Files to create:**
- `src/lib/ai/prompts/noticing.ts` — system prompt
- `src/lib/ai/noticing.ts` — `renderNoticing(userId)` function

**System prompt sketch** (final version goes in the prompts file):

```
You are the listening layer of Entiremind. You will be shown a single
user's compacted memory blob — themes they've been working with,
their vision, obstacles, recent emotional state, open threads, and a
last breakthrough if any.

Your job is to produce ONE short SMS message reflecting back what
you've been noticing about them this past week. Tone: a trusted
friend who's been paying attention — not a coach, not a therapist,
not a chatbot.

Constraints:
- One to three sentences
- 320 characters or fewer
- No emojis, no questions, no advice
- Lean on ONE specific detail from memory — not all of them
- Don't reveal that you have categories, scores, or classifications
- Use their voice/phrasing where it adds precision
- If emotional state is struggling, soften the language; don't
  insist on optimism or "carrying forward"

Examples:
- "A small thing we've been noticing: focus and self-worth keep
  showing up together for you this week. The Thursday draft, the one
  you didn't rewrite — that one stayed with us."
- "Holding what you've been holding. The pull toward calling your
  dad keeps coming up. We're not pushing — just noticing."
- "Quiet week. The morning runs seem to be doing their work."

Return only the message text. No prose before or after.
```

**Renderer module shape:**

```typescript
export interface NoticingResult {
  text: string;
  skipped: false;
}
export interface NoticingSkipped {
  skipped: true;
  reason: 'empty-memory' | 'stale-memory' | 'struggling-no-breakthrough' | 'render-failed';
}

export async function renderNoticing(
  userId: string
): Promise<NoticingResult | NoticingSkipped> {
  // 1. Load user_memory.summary (and updated_at)
  // 2. Skip checks:
  //    - if !summary
  //    - if updated_at older than 14 days
  //    - if recent_emotional_state suggests struggling AND last_breakthrough is null
  // 3. Call Haiku with NOTICING_SYSTEM_PROMPT + serialized memory
  // 4. Validate output (≤320 chars, no emojis, etc.)
  // 5. Return result
}
```

**Done when:**
- Unit-style smoke test: pass in a sample memory blob, get back a reasonable noticing
- Tone holds across 5–10 sample memory blobs from real users (founder reviews output before cron goes live)

---

## Milestone 3: Weekly cron

**Files to create:**
- `src/app/api/cron/weekly-insights/route.ts`
- `vercel.json` — add new cron entry

**Cron schedule:**

For initial launch (single global send time):
```json
{ "path": "/api/cron/weekly-insights", "schedule": "0 3 * * 1" }
```

This is Monday 03:00 UTC = Sunday 7-8 PM Pacific. Single send for everyone in Pacific time. Acceptable for v0.

For Phase B (timezone-aware), run hourly Sunday + Monday and filter on user-local hour:
```json
{ "path": "/api/cron/weekly-insights", "schedule": "0 * * * 0,1" }
```

Defer hourly until Vercel Pro is on.

**Cron logic:**

```typescript
1. Auth check (CRON_SECRET)
2. Load all users where:
     status = 'active'
     AND onboarding_completed = true
     AND insights_opt_out = false
3. For each user (sequential, 200ms delay between):
   a. Check: has any outbound SMS been sent in the last 4 hours? If yes, skip
      (avoids landing on top of a scheduled message or yesterday's daily prompt)
   b. Call renderNoticing(userId)
   c. If skipped → log reason, continue
   d. If rendered → sendSms with contentType: 'noticing', aiGenerated: true
4. Return summary: { sent, skipped, errored }
```

**Done when:**
- Manual cron run produces noticings for at least one test user
- The noticing arrives as a single SMS
- The message is stored in `messages` with `content_type = 'noticing'`
- Skips are logged with reasons

---

## Milestone 4: Settings opt-out toggle

**Files to edit:**
- `src/lib/auth/actions.ts` — accept `insightsOptOut` form field
- `src/components/dashboard/settings-messaging-form.tsx` (or wherever the pause toggle lives) — add a second toggle

**UI sketch:**

In settings, under the existing messaging pause:

> **Weekly noticing**
> A short Sunday-evening message reflecting on what we've been noticing this week. Off by default for new users until they have a week of replies to draw from.
>
> [ Toggle: On / Off ]

**Done when:**
- Toggle persists to `users.insights_opt_out`
- Cron honors the toggle on the next run

---

## Milestone 5: Content selection integration

**Files to edit:**
- `src/lib/ai/prompts.ts` — exclude `'noticing'` from `loadRecentOutbound` (it's not a daily prompt and shouldn't influence content selection)
- `src/app/api/cron/detect-silence/route.ts` — already excludes `ack`; extend the same exclusion to `noticing`
- `src/app/api/cron/daily-send/route.ts` — `noticing` is not a morning prompt, so it should be excluded from the "already sent today" check the same way `ack` is

**Done when:**
- A user who got a noticing on Sunday night still gets their Monday morning prompt
- A user who didn't reply to a noticing isn't flagged as silent
- `'noticing'` never appears in the rules-based content selection eligible set

---

## (Deferred) Milestone 6: Dashboard Reflections surface

Skip for initial launch. Document for later:

**Files to create eventually:**
- `src/app/dashboard/reflections/page.tsx`
- `src/components/dashboard/reflections-feed.tsx`

**What it shows:**
- Most recent rendered noticing (full text)
- Past noticings (collapsed, expandable) — fetched from `messages` where `content_type = 'noticing'` and `user_id = current user`

**What it does NOT show:**
- Raw memory blob fields
- Theme tags
- Sentiment categories
- Counts of any kind

---

## Rollout sequence

1. Ship Milestone 1 (schema) — no user-visible change
2. Ship Milestone 2 (renderer) — no user-visible change. Founder manually runs renderer against 5–10 real users and reviews the output before going further.
3. Ship Milestones 3, 4, 5 together — these all need to land before the first cron fires.
4. **Soft launch:** Set the cron, but for the first run, have it write to logs only without actually sending. Review the would-be outputs. If they pass the smell test, flip a flag to enable sending.
5. **Watch the first week:** Reply rate to noticings. Tone feedback. Any user opt-outs.
6. **Phase B (dashboard surface):** Build only if at least one user asks for it, or if you decide it'd help conversion.

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| Noticings feel generic | Tune the prompt with real memory blob examples. Soft launch (logs only) before going live. |
| User feels surveilled | Tone is the defense. Easy opt-out. Never reveal internal classifications. |
| Cron lands on top of another outbound | 4-hour quiet window check before sending. |
| Render produces something off-brand or unsafe | Validate output: char limit, no emojis, no obvious questions. Skip the send if validation fails. |
| Reply rate to noticings is low | Acceptable for v0. The signal is whether the reply rate is non-zero and the replies are substantive. If low across the board, soften the language. |
| Users who haven't replied much get awkward noticings | "Skip if memory is sparse" check. Also: the weekly memory cron only writes a memory blob if there's something to write, so sparse users naturally get skipped. |

## Open technical questions

1. **Should we store the rendered noticing text in a separate table** (e.g., `user_noticings`) **or rely on the `messages` table** with `content_type='noticing'`?
   - Recommendation: rely on `messages`. We already filter and query by content_type. A separate table is premature.

2. **Should the renderer have access to the user's name?**
   - Recommendation: yes, but with a hard rule in the prompt that names are used sparingly. Most noticings should land without naming the user.

3. **Cron timezone awareness** — is it worth building Phase B's hourly cron now, or wait?
   - Recommendation: wait. Sunday-evening-Pacific is fine for v0. The cost of getting the timezone right for 1,000 users is real engineering work; not worth it before validating the feature lands at all.
