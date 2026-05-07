# Content Engine Implementation Progress

**Date**: May 7, 2026
**Status**: Phase 1 Complete - Ready for Deployment

---

## What Was Implemented (Phase 1)

### 1. Signal Tracking Infrastructure
- **Database tables**: `signal_events` and `user_signals`
- **Signal types**: reply, silence, unprompted, quick_reply, long_reply, stop_request
- **Engagement score**: Computed 0-100 score based on reply rate, response time, consecutive silences
- **Library**: `src/lib/signals/` with `trackReply()`, `trackSilence()`, `trackUnprompted()`, `trackStopRequest()`, `getUserSignals()`

### 2. AI Message Generation (Multi-Provider)
- **Supports both Anthropic (Claude) and OpenAI**
- **Default**: Anthropic with `claude-3-5-haiku-latest`
- **Content types**: reflection, check-in, action, gratitude, quote
- **Personalization**: Uses user name, intention, and engagement signals
- **Library**: `src/lib/ai/` with provider adapters in `src/lib/ai/providers/`

### 3. Automated Cron Jobs
- **Daily Send** (`/api/cron/daily-send`): Sends AI-generated messages to all active users at 7:45 AM Pacific
- **Silence Detection** (`/api/cron/detect-silence`): Detects unreplied messages at 5:00 AM Pacific

### 4. Webhook Signal Tracking
- Twilio webhook now automatically tracks signals on every inbound message
- Links replies to outbound messages and calculates reply time

### 5. Founder Dashboard Updates
- New "User Engagement Signals" table showing engagement scores, reply rates, consecutive silences
- Sorted by engagement score (highest first)

---

## Files Created

```
src/lib/signals/
├── index.ts           # Main API
├── compute.ts         # Engagement score computation
└── types.ts           # TypeScript types

src/lib/ai/
├── index.ts           # Main API with provider abstraction
├── prompts.ts         # System prompts
├── types.ts           # TypeScript types
└── providers/
    ├── openai.ts      # OpenAI adapter
    └── anthropic.ts   # Anthropic adapter

src/app/api/cron/
├── daily-send/route.ts      # Autonomous daily send
└── detect-silence/route.ts  # Silence detection

src/components/dashboard/
└── user-signals-table.tsx   # Engagement signals table

supabase/migrations/
└── 012_content_engine.sql   # Database migration
```

## Files Modified

- `src/lib/supabase.ts` - Added types for new tables
- `src/lib/sms/index.ts` - Added content tracking, enhanced reply linking
- `src/lib/sms/types.ts` - Added ContentType
- `src/app/api/sms/webhook/twilio/route.ts` - Added signal tracking
- `src/app/dashboard/founder/page.tsx` - Added signals section
- `vercel.json` - Added new cron jobs
- `CLAUDE.md` - Updated documentation
- `package.json` - Added openai and @anthropic-ai/sdk dependencies

---

## Before You Can Deploy

### 1. Run the Database Migration

Go to Supabase SQL Editor and run:
```
supabase/migrations/012_content_engine.sql
```

This creates:
- `signal_events` table
- `user_signals` table
- New columns on `messages` table (content_type, ai_generated, reply_to_message_id)
- Trigger to auto-create user_signals for new users
- Backfills user_signals for existing users

### 2. Add Environment Variables to Vercel

**Required - Choose ONE AI provider:**

For Anthropic (recommended, default):
```
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-api03-...
```

OR for OpenAI:
```
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
```

**Optional model overrides:**
```
ANTHROPIC_MODEL=claude-3-5-haiku-latest
OPENAI_MODEL=gpt-4o-mini
```

### 3. Deploy to Vercel

```bash
git add .
git commit -m "feat: implement content engine phase 1 with signal tracking and AI generation"
git push origin main
```

Or manually:
```bash
vercel --prod
```

---

## Testing After Deployment

### Test Signal Tracking
1. Send yourself a test message via the Founder dashboard scheduler
2. Reply to it via SMS
3. Check Supabase `signal_events` table - should see a `reply` event
4. Check `user_signals` table - should see updated metrics

### Test Silence Detection
1. Manually trigger the cron:
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://www.entiremind.com/api/cron/detect-silence
   ```
2. Check `signal_events` for `silence` events

### Test Daily Send
1. Ensure you have at least one active user with:
   - `status = 'active'`
   - `onboarding_completed = true`
   - Valid phone number
2. Manually trigger:
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://www.entiremind.com/api/cron/daily-send
   ```
3. Check that SMS was received
4. Check `messages` table for `ai_generated = true`

---

## Future Phases (Not Yet Implemented)

### Phase 2: Content Library
- Add curated quotes table
- AI selects between generating prompts vs sending quotes
- Track content performance

### Phase 3: Advanced Personalization
- Use engagement history for smarter content selection
- Reference past replies in prompts
- Vary content based on what gets replies

### Phase 4: Timezone-Aware Sending
- Send at user's local 7:45 AM
- Group users by timezone

### Phase 5: Analytics Dashboard
- Reply rate trends
- Content type performance
- User health scores

---

## Quick Reference

**Cron Schedule (in vercel.json):**
- `/api/cron/send-scheduled` - 14:45 UTC (7:45 AM Pacific)
- `/api/cron/detect-silence` - 12:00 UTC (5:00 AM Pacific)
- `/api/cron/daily-send` - 14:45 UTC (7:45 AM Pacific)

**AI Provider Selection:**
- Default: Anthropic (Claude)
- Set `AI_PROVIDER=openai` to use OpenAI

**Key Files:**
- Signal tracking: `src/lib/signals/index.ts`
- AI generation: `src/lib/ai/index.ts`
- Daily cron: `src/app/api/cron/daily-send/route.ts`
