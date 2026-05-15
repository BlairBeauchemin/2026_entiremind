# Content Engine v2 — Implementation Plan

**PRD:** `docs/prds/2026-05-12-content-engine-v2.md`
**Branch:** `claude/document-skills-GSDID`
**Date:** 2026-05-12

---

## Architecture overview

```
                                Inbound SMS
                                     │
                                     ▼
                      Twilio webhook (existing path)
                                     │
                                     ▼
              ┌──────────────── enrich + ack call (Haiku) ───────────────┐
              │  - Classify: sentiment, themes, category, modality, ...  │
              │  - Generate mirror IF substantive                         │
              └────────────────────────────────────────────────────────────┘
                                     │
                  ┌──────────────────┼─────────────────────┐
                  ▼                  ▼                     ▼
       messages.insights      message_themes       trackReply()
                                                          │
                                                          ▼
                                                recomputeUserSignals()
                                                          │
                                                          ▼
                                                   send ack SMS
                                            (mirror OR soft-ack library)


  Weekly Monday 4 AM PT cron (Sonnet, batch API):
       ┌─────────────────────────────────────────────────┐
       │ For each active user:                            │
       │  1. Load last 7 days of inbound + insights       │
       │  2. Generate user_memory.summary (structured)    │
       │  3. Detect intention shifts → suggestions table  │
       └─────────────────────────────────────────────────┘


  Daily 7:45 AM PT cron (Haiku, prompt cached):
       ┌─────────────────────────────────────────────────┐
       │ For each eligible user:                          │
       │  1. buildUserContext + load memory summary        │
       │  2. Select content type via rules                 │
       │  3. Inject yesterday's reply context if substantive│
       │  4. Generate + send daily prompt                  │
       └─────────────────────────────────────────────────┘
```

---

## Milestones

### Milestone 1: Schema + foundations
Land the database changes and config tables so subsequent code has a target.

### Milestone 2: Reply enrichment + acknowledgement
The most user-visible change. Once shipped, every inbound feels heard.

### Milestone 3: User memory + weekly compaction
The "trusted guide remembers you" moment. Requires Milestone 2 data to be flowing.

### Milestone 4: Smarter content selection + next-day reference
Use the new data to make daily prompts more relevant.

### Milestone 5: Onboarding form
Seed memory for new users from day one.

### Milestone 6: Timezone field + intention evolution + founder UI
Final polish — surfaces the new data for founder review and prepares for Phase 2 timezone work.

---

## Milestone 1: Schema + foundations

**Files to create:**
- `supabase/migrations/013_content_engine_v2.sql`

**Schema changes:**

```sql
-- Reply enrichment
ALTER TABLE messages ADD COLUMN insights JSONB;
ALTER TABLE messages ADD COLUMN ack_sent BOOLEAN DEFAULT false;

-- Extend content_type CHECK to include 'ack'
ALTER TABLE messages DROP CONSTRAINT messages_content_type_check;
ALTER TABLE messages ADD CONSTRAINT messages_content_type_check
  CHECK (content_type IN (
    'reflection','quote','check-in','action','gratitude',
    'welcome','manual','ack'
  ));

-- Theme join table
CREATE TABLE message_themes (
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  theme TEXT NOT NULL,
  category TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (message_id, theme)
);
CREATE INDEX idx_message_themes_user_recent
  ON message_themes(user_id, created_at DESC);
CREATE INDEX idx_message_themes_category
  ON message_themes(category, created_at DESC);

-- User memory
CREATE TABLE user_memory (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  summary JSONB NOT NULL,  -- {themes, threads, vision, obstacles, recent_emotional_state, last_breakthrough}
  token_count INTEGER,
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE user_memory_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  summary JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_user_memory_history_user
  ON user_memory_history(user_id, created_at DESC);

-- Onboarding responses
CREATE TABLE onboarding_responses (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  intention TEXT NOT NULL,
  vision TEXT NOT NULL,
  obstacles TEXT NOT NULL,
  aligned_state TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Intention shift suggestions
CREATE TABLE intention_shift_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_intention TEXT NOT NULL,
  proposed_intention TEXT NOT NULL,
  confidence DECIMAL(3,2),
  supporting_message_ids UUID[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','dismissed')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_intention_shifts_pending
  ON intention_shift_suggestions(status, created_at DESC);

-- Content selection config (founder-tunable)
CREATE TABLE content_selection_config (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),  -- singleton
  no_repeat_days INTEGER DEFAULT 1,
  earned_reply_bias DECIMAL(3,2) DEFAULT 0.60,
  earned_reply_min_sends INTEGER DEFAULT 5,
  quote_max_per_week INTEGER DEFAULT 1,
  silence_threshold INTEGER DEFAULT 3,
  updated_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO content_selection_config (id) VALUES (1) ON CONFLICT DO NOTHING;

-- Soft ack library
CREATE TABLE soft_acks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT NOT NULL UNIQUE,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
INSERT INTO soft_acks (text) VALUES
  ('Got that.'),
  ('Holding this.'),
  ('Thank you.'),
  ('Sitting with that.'),
  ('Hearing you.'),
  ('Noted.'),
  ('Got it. Talk soon.'),
  ('Received. Thank you.'),
  ('That landed.'),
  ('Thanks for sharing.'),
  ('Holding what you said.'),
  ('Carrying that with me.'),
  ('Heard.'),
  ('Got you.'),
  ('Thanks, friend.');

-- Timezone preferences (timezone column exists; add send hour)
ALTER TABLE users ADD COLUMN preferred_send_hour INTEGER DEFAULT 7
  CHECK (preferred_send_hour BETWEEN 0 AND 23);
```

**Done when:** migration runs cleanly in dev; all new tables visible in Supabase dashboard; existing flows still work (no breakage to messages or signal_events).

---

## Milestone 2: Reply enrichment + acknowledgement

**Files to create:**
- `src/lib/ai/enrich.ts` — single Haiku call that returns enrichment JSON + optional mirror
- `src/lib/ai/prompts/enrich.ts` — system prompt for enrichment
- `src/lib/acks/index.ts` — soft-ack library reader with rotation tracking
- `src/lib/acks/types.ts`

**Files to edit:**
- `src/app/api/sms/webhook/twilio/route.ts` — call enrich + ack after storing inbound
- `src/lib/sms/index.ts` — accept `content_type: 'ack'` and `ai_generated` flags
- `src/app/api/cron/detect-silence/route.ts` — exclude `content_type = 'ack'` from silence detection

**Key implementation points:**

1. **Single Haiku call** combines enrichment and mirror generation. System prompt asks for JSON output with all enrichment fields plus `acknowledgement` (string or null). If `substantive` is false, the model returns `acknowledgement: null` and we use the library instead.

2. **Substantive threshold:** `reply.length >= 30 OR strong_signal`. Strong signal = `sentiment = 'struggling'` OR `open_thread = true` OR `mentions.length > 0`.

3. **Soft ack rotation:** maintain a per-user "last 5 soft acks used" in `user_signals.metadata` JSONB; exclude those from random selection. Refresh seed every 2 weeks.

4. **Latency budget:** total Twilio webhook handler must respond in < 10 seconds to avoid Twilio retry. Enrich call should target < 3 seconds. If it times out, fire soft-ack only and leave `insights = null`.

5. **Theme insertion:** `message_themes` rows written in same transaction as `messages.insights` update.

**Done when:**
- Inbound test SMS gets an ack within 5 seconds
- `messages.insights` populated for every inbound
- `message_themes` rows match insights
- STOP keyword does NOT trigger ack
- Existing signal tracking still works

---

## Milestone 3: User memory + weekly compaction

**Files to create:**
- `src/lib/ai/memory.ts` — Sonnet pass over user's recent replies → structured memory blob
- `src/lib/ai/prompts/memory.ts` — system prompt for compaction
- `src/app/api/cron/weekly-memory/route.ts` — Monday cron, iterates active users, calls memory compaction via Anthropic batch API
- `vercel.json` — add weekly cron entry

**Files to edit:**
- `src/lib/ai/index.ts` — `buildUserContext` loads `user_memory.summary` and includes it
- `src/lib/ai/prompts.ts` — `buildUserPrompt` accepts memory and renders it as a structured block

**Key implementation points:**

1. **Memory structure (JSONB):**
   ```json
   {
     "themes": ["focus", "self-worth", "showing up"],
     "vision": "feeling at home in their own creative practice",
     "obstacles": "perfectionism, fear of being seen",
     "recent_emotional_state": "tentative but more open than last week",
     "open_threads": ["mentioned wanting to call their dad"],
     "last_breakthrough": "noticed they finished a draft without rewriting"
   }
   ```

2. **Token budget:** target ~400 tokens for the rendered memory block; truncate threads/themes if needed.

3. **Prompt caching:** the daily-send prompt is structured as:
   ```
   [SYSTEM: cached] system prompt + tone guidance
   [SYSTEM: cached per-user] memory block
   [USER: not cached] today's content type + recent context
   ```
   With Anthropic's prompt cache, the per-user block gets a 90% discount on subsequent calls within the cache TTL (5 min). Since we send all users back-to-back, this is effectively free after the first call per user that day. But the system prompt itself is cached across all users.

4. **Batch API:** weekly job uses Anthropic's batch API for 50% discount. Acceptable to be eventually consistent (job runs Monday morning, results applied before Tuesday's send).

5. **New-user seeding:** if `user_memory` doesn't exist for a user, populate it on first weekly run from `onboarding_responses` directly (no Sonnet call needed for seed).

**Done when:**
- Manual run of weekly cron produces valid memory rows for test users
- Daily prompt visibly varies based on memory contents
- Prompt cache hit rate ≥ 80% on daily sends (observable in Anthropic dashboard)

---

## Milestone 4: Smarter content selection + next-day reference

**Files to edit:**
- `src/lib/ai/prompts.ts` — rewrite `selectContentType` to use rules + config + per-user history
- `src/lib/ai/index.ts` — fetch yesterday's substantive reply insights and pass to `buildUserPrompt`
- `src/lib/ai/types.ts` — extend `UserContext` with `recentReply?: { themes, emotional_state, text }`

**Key implementation points:**

1. **Rule order in `selectContentType`:**
   1. Get last 7 days of `content_type` for this user → exclude same-as-yesterday types
   2. If `consecutive_silences >= silence_threshold` OR last sentiment was "struggling" → restrict to `[check-in, gratitude]`
   3. Compute reply-rate-by-type over last 30 days; filter to types with ≥ `earned_reply_min_sends` sends
   4. With probability `earned_reply_bias`: pick weighted by reply rate from qualified set
   5. Else: pick uniformly from non-excluded set
   6. Enforce `quote` cap: if user got a `quote` in the last 7 days, exclude it

2. **Recent reply slot in prompt:** only injected if yesterday's reply has `substantive: true`. Prompt guidance: *"The user recently shared: [themes]. Their emotional state was [state]. You may subtly reference this if it fits naturally, but do not force a callback."*

3. **Backward compatibility:** existing fallback messages stay in place for LLM failures.

**Done when:**
- Two days running, the same user never gets the same content type back-to-back
- Reply-rate-by-type query returns sensible values per user
- Manual test: a user with `consecutive_silences = 4` only gets `check-in` or `gratitude` prompts
- Daily prompts after a substantive reply include callback language ~60% of the time (qualitative review)

---

## Milestone 5: Onboarding form

**Files to create:**
- `src/app/onboarding/page.tsx` — multi-step form (intention, vision, obstacles, aligned-state)
- `src/components/onboarding/onboarding-form.tsx` — client component with step transitions
- `src/app/api/onboarding/route.ts` — POST handler, writes to `onboarding_responses`, sets `users.onboarding_completed = true`, creates initial `user_memory` row seeded from form

**Files to edit:**
- Auth callback / dashboard layout — redirect users with `onboarding_completed = false` to `/onboarding`
- `src/lib/ai/index.ts` — `buildUserContext` prefers onboarding answers if no memory exists yet

**Key implementation points:**

1. Match the existing "lightly magical" aesthetic — calm pacing, single question per step, no progress bar, soft transitions
2. Welcome SMS only fires after onboarding is complete
3. Initial memory seed from onboarding:
   ```json
   {
     "themes": [],
     "vision": "<vision answer>",
     "obstacles": "<obstacles answer>",
     "recent_emotional_state": null,
     "open_threads": [],
     "intention": "<intention answer>",
     "aligned_state": "<aligned-state answer>"
   }
   ```

**Done when:**
- New signups land on `/onboarding` after auth
- All 4 fields persist
- First daily prompt for new user references onboarding context
- Existing onboarded users skip the new flow (`onboarding_completed` already true)

---

## Milestone 6: Timezone + intention evolution + founder UI

**Files to create:**
- `src/components/dashboard/timezone-settings.tsx` — timezone picker + preferred send hour
- `src/components/dashboard/founder-user-detail.tsx` — per-user memory, themes, sentiment trend
- `src/components/dashboard/intention-shift-review.tsx` — approve/dismiss queue
- `src/app/api/founder/intention-shifts/route.ts` — list + update endpoints

**Files to edit:**
- `src/app/dashboard/settings/page.tsx` — surface timezone + preferred send hour with placeholder copy
- `src/app/dashboard/founder/page.tsx` — wire in new components
- `src/lib/ai/memory.ts` — extend the weekly Sonnet pass to also emit intention shift suggestions

**Key implementation points:**

1. **Timezone UI placeholder copy:** "We'll send around your preferred hour soon. For now all messages go out at 7:45 AM Pacific."
2. **Intention shift detection** runs inside the existing weekly memory call — one Sonnet invocation per user produces both outputs, no extra cost.
3. **Founder approval flow:** approving a suggestion creates a new `intentions` row, archives the previous, and writes an audit log entry.

**Done when:**
- Settings page shows timezone + preferred hour with placeholder note
- Founder dashboard shows per-user memory blob and theme cloud
- Approving an intention shift updates the active intention
- Sentiment trend chart renders for at least one user with 14 days of data

---

## Rollout sequence

1. Ship Milestone 1 (schema) → no user-visible change
2. Ship Milestone 2 (enrichment + acks) → enable on 10% of users via feature flag first, validate ack tone for 48 hours, then 100%
3. Ship Milestone 3 (memory) → run weekly compaction manually once before enabling daily injection
4. Ship Milestone 4 (content selection) → A/B observable via reply rates over 2 weeks
5. Ship Milestone 5 (onboarding) → applies to new signups only
6. Ship Milestone 6 (founder UI + intention shifts) → no user-visible risk

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| AI mirror sounds generic or wrong | Hide behind 10% rollout for 48 hours; founder reviews mirrors daily for first week; iterate prompt |
| Soft-ack library feels robotic | Start with 15 phrases, founder adds more; track rotation to avoid repetition |
| Latency spike on Twilio webhook | Enrich call has 3s timeout; fall back to soft-ack only; return webhook 200 within 10s |
| Memory blob drifts off-brand | Structured JSONB (not free prose) forces consistent shape; founder reviews weekly |
| Prompt cache miss → cost spike | Monitor cache hit rate in Anthropic dashboard; alert if < 70% |
| Intention shift false positives | Founder approval gate; confidence threshold of 0.6; tune from feedback |

## Open technical questions

1. Is Anthropic batch API available for Haiku, or only Sonnet/Opus? Verify before relying on it for the weekly job. *(If Haiku-only-non-batch is fine cost-wise, we drop the batch dependency.)*
2. Twilio webhook timeout is 15s. Confirm our current handler is well under that and budget the enrich call accordingly.
3. Should we add a `user_memory.version` column for schema migrations of the JSONB shape? Recommendation: yes, default 1, increment when shape changes.
4. Where does the rotating-ack history live? In `user_signals.metadata` JSONB or a dedicated `ack_history` table? Recommendation: JSONB column for simplicity unless we need cross-user querying.
