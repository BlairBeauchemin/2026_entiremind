# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Entiremind is a **lightly magical, SMS-based manifestation system** that helps users align their thoughts, intentions, and actions to manifest their goals.

The competitive advantage is **learning velocity**, not features. The system operates as a real-time behavioral learning loop that improves through user interaction.

### Core Philosophy
**Action → Signal → Learning → Adjustment → Action**

- Messages ship quickly
- Replies and silence are signals
- Prompts evolve weekly
- Founder judgment compounds early

### System Phases
1. **Phase 1 (Pretotype)**: Landing page, email/phone capture, no monetization
2. **Phase 2 (Evergreen MVP)**: Paid traffic, SMS-first experience, monetization as signal

## Architecture

### Primary Components
- **SMS Engine**: Twilio integration for two-way messaging
- **Web Dashboard**: Minimal profile, subscription status, pause/resume controls (not primary engagement surface)
- **Signal Storage**: Behavioral signals persisted per user, queryable by founder
- **Founder Review**: Inspect raw replies, tag patterns, guide system evolution

### Tech Stack
- **Frontend**: Next.js 16 with App Router, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (Postgres, Auth, Edge Functions)
- **Hosting**: Vercel (auto-deploys from `main` branch)
- **Messaging**: SMS layer (`@/lib/sms`) built on Twilio
- **AI**: OpenAI API (prompt drafting, tone variation, summarization — not autonomous)
- **Components**: shadcn/ui with Radix UI primitives, Lucide icons
- **Animations**: Framer Motion
- **Payments**: Stripe subscriptions (payment as behavioral signal)

### Database Tables
- `users` - user profiles with phone, email, timezone
- `leads` - waitlist signups with name, email, phone
- `intentions` - user intention statements
- `messages` - outbound + inbound SMS
- `subscriptions` - payment state per user

## Development Commands

```bash
# Development
npm run dev              # Start dev server with Turbopack
npm run build            # Production build
npm run start            # Start production server

# Code Quality
npm run lint             # ESLint with auto-fix
npm run lint:check       # ESLint check only
npm run typecheck        # TypeScript type checking
npm run format           # Prettier formatting
npm run format:check     # Check formatting

# Add shadcn/ui components
npx shadcn@latest add [component]
```

## Import Aliases

```typescript
@/components  // src/components
@/lib         // src/lib
@/hooks       // src/hooks
```

## Design Guidelines

- **Lightly magical aesthetic** — calm, inspiring, intuitive
- Simple layouts, soft spacing, calm typography, no visual noise
- Conversion-optimized landing page for email/phone capture
- Mobile-responsive layouts
- Theme colors:
  - Primary: Dark teal (#204147)
  - Secondary: Soft purple (#cbbbe3)
  - Accent: Warm yellow (#f9d97a)

### Persuasion & Behavioral Design
- **Required reading for any user-facing change**: `docs/design-philosophy.md`
- Six principles govern onboarding, SMS, dashboard, paywall, and landing decisions:
  **smart defaults, goal-gradient/progress, reciprocity, IKEA/endowment, loss-aversion,
  and anchoring/contrast**
- **Guardrail**: every lever passes the "trusted-friend test" — warm and honest, never a
  growth hack. No fake urgency, no shame-based loss framing, no dark patterns, no
  productivity theater
- Run the design-review checklist in `docs/design-philosophy.md` on every PR that touches
  a user-facing surface
- The prioritized application backlog lives at
  `docs/plans/2026-07-08-psychology-principles-backlog.md`

### Dashboard Principles
- Supports trust, reflection, and control
- NOT the primary engagement surface (SMS is)
- No leaderboards, streaks, or productivity theater — nothing that induces guilt or a
  "don't break the chain" reflex
- A **single, calm reflection cue** is allowed (e.g. "You've reflected 12 times") when it
  supports reflection rather than performance — gentle, non-gamified, never a streak
- Minimal and calm

## Key Patterns

- **App Shell**: Wrap pages in global layout component with sticky nav and footer
- **Client Components**: Use `'use client'` only when state/interactivity required
- **shadcn/ui**: Use "new-york" style, customize via Tailwind tokens
- **CSS Variables**: Define in globals.css, integrate with Tailwind
- **Silence as Signal**: Store non-response as explicit behavioral state

## Core User Flows

### Flow A: Pretotype Signup
1. User lands on landing page
2. Sees manifestation-first positioning
3. Submits name, email, and phone via waitlist modal
4. Stored as lead in `leads` table
5. Optional waitlist confirmation SMS

### Flow B: Onboarding & Intention
1. Welcome SMS
2. Prompt to state what they want to manifest
3. User replies in free text
4. System mirrors intent back
5. Emotional buy-in moment

### Flow C: Reflection Loop
1. Prompt sent
2. User replies or stays silent
3. Signal logged (including silence)
4. Next message adapts
5. Loop repeats

## MVP Priorities

1. Landing page with email/phone capture ✅
2. SMS engine (Twilio integration, two-way messaging) ✅
3. Signal storage and founder review interface ✅
4. User dashboard (profile, subscription, pause/resume) ✅
5. Production deployment (Vercel + entiremind.com) ✅
6. Stripe subscription integration ✅

## Success Metrics

### North Star
**Unprompted user replies to SMS**

### Supporting Signals
- Reply rate by prompt type
- Time-to-reply
- Message length
- Silence after prompts
- Engagement change after payment

### Explicit Non-Goals (v0)
- Heavy dashboards
- Productivity theater
- Fully autonomous AI
- Large content libraries

---

## Implementation Progress

### Completed (as of May 2026)

#### Authentication System
- **Email magic link auth** via Supabase Auth (no SMS provider needed for MVP)
- **Google OAuth** via Supabase Auth (requires Google Cloud Console credentials configured in Supabase dashboard)
- Auth flow: `/auth` page → email input → magic link sent → callback verifies → redirect to dashboard
- Proxy-based route protection for `/dashboard/*` (Next.js 16+ convention)
- Auto-redirect: unauthenticated users → `/auth`, authenticated users on `/auth` → `/dashboard`
- Sign out functionality in dashboard sidebar

#### Database Constraints
- `users.phone` has unique constraint - each phone number can only be used by one account (required for SMS routing)

#### Supabase SSR Clients
- `src/lib/supabase/server.ts` - Server Component client with cookie handling
- `src/lib/supabase/client.ts` - Browser client for Client Components
- `src/lib/supabase/proxy.ts` - Session refresh helper

#### Database
- `users` table with RLS policies (users can only view/edit their own profile)
- Auto-create user profile on auth signup via database trigger
- Schema: id, email (required), phone (optional), name, timezone, status, onboarding_completed

#### Dashboard
- Server Component layout fetches real user data
- User context provider for client components
- Settings page with editable profile form (name, email, timezone)
- Messaging controls with pause/resume toggle (persists to database)
- Sidebar shows real user info + sign out button

**Messages UI (Card-Based Journal Layout):**
- `src/components/dashboard/message-card.tsx` - Card component for paired prompt + reply
- `src/components/dashboard/message-feed.tsx` - Feed that pairs outbound prompts with inbound replies
- **Layout**: Cards with left purple border accent, prompt in bold, reply in regular text
- **Typography**: 18px+ fonts for mobile readability, WCAG AA accessible
- **Pairing Logic**: Each outbound prompt is matched with its following inbound reply
- **Unprompted Messages**: Standalone inbound messages shown with "You reached out:" header
- **Accessibility**: Semantic HTML (`<article>`, `<time>`, `<section>`), ARIA labels, focus states

#### Environment
- Supabase project configured: `cprzebhlwfibajrrtuqp.supabase.co`
- `.env.local` contains Supabase credentials

#### Production Deployment
- **Domain**: https://www.entiremind.com (canonical; entiremind.com redirects to www)
- **Hosting**: Vercel (`blairs-projects-7e709a29/2026-entiremind`)
- **Note**: External webhooks (Stripe, etc.) must use `www.entiremind.com` to avoid 307 redirects
- **Vercel Dashboard**: https://vercel.com/blairs-projects-7e709a29/2026-entiremind
- **Deploy**: Push to `main` branch or run `vercel --prod`

**Configured Services:**
- Twilio webhook: `https://entiremind.com/api/sms/webhook/twilio`
- Supabase Auth redirect URLs: `https://entiremind.com/**`, `https://www.entiremind.com/**`
- Supabase Site URL: `https://entiremind.com`

#### SMS Engine (Twilio)
- **Provider layer**: `src/lib/sms/` - Twilio adapter behind a thin abstraction
- **Send SMS**: `src/lib/sms/index.ts` - wrapper functions
- **Send endpoint**: `src/app/api/sms/send/route.ts` - founder/admin-only SMS sending
- **Webhook endpoint**: `src/app/api/sms/webhook/twilio/route.ts` (signature-validated)
- **Welcome SMS**: Automatically sent after user completes onboarding
- **Database**: `messages` table stores all SMS with `provider` and `external_message_id` columns. Historical rows may have `provider = 'telnyx'` from the removed Telnyx integration; the DB CHECK constraint still allows that value for old rows.

**Current Status:**
- Twilio integration complete and configured in `.env.local`
- Database migration `007_sms_provider_abstraction.sql` has been run
- **A2P 10DLC approved and working** ✅
- Telnyx support was fully removed (July 2026) — Twilio is the only provider

**Required env vars (Twilio):**
```
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### Waitlist & Lead Capture
- **Waitlist modal**: `src/components/waitlist-modal.tsx` - reusable modal for lead capture
- **Leads API**: `src/app/api/leads/route.ts` - POST endpoint to save leads
- **Form fields**: name, email, phone (all required)
- **Storage**: `leads` table with source tracking (`landing_page`)
- **Integration points**: Hero section, pricing section, navigation "Join Waitlist" button

#### Founder Review Interface
- **Founder page**: `src/app/dashboard/founder/page.tsx` - admin-only message viewer and scheduling UI
- **Message table**: `src/components/dashboard/founder-message-table.tsx` - displays all user messages
- **Scheduling UI**: Schedule, view, send immediately, and cancel SMS messages
  - `src/components/dashboard/schedule-message-form.tsx` - form to schedule new messages with:
    - Searchable user dropdown (search by name, email, or phone)
    - Auto-populate phone number when user selected
    - AI message generation button (sparkle icon)
  - `src/components/dashboard/scheduled-messages-table.tsx` - table with status badges and actions
  - `src/components/dashboard/scheduling-section.tsx` - client wrapper with refresh logic
- **Users API**: `src/app/api/users/route.ts` - GET endpoint returning all users with phone numbers (founder-only)
- **AI Generate API**: `src/app/api/ai/generate/route.ts` - POST endpoint to generate AI message for a phone number (founder-only)
- Access restricted to users with `admin` or `founder` role in database
- Shows: direction (in/out), user name, phone, message text, status, timestamp

#### Database Tables Implemented
- `users` - user profiles with phone, email, timezone, onboarding status
- `leads` - waitlist signups with name, email, phone, source, created_at
- `intentions` - user intention statements (active/completed/archived)
- `messages` - outbound + inbound SMS with `external_message_id`, `provider`, `content_type`, `ai_generated`, `reply_to_message_id` columns
- `subscriptions` - Stripe subscription state per user (plan, status, period end, Stripe IDs)
- `scheduled_messages` - scheduled SMS messages (pending/sent/failed/cancelled)
- `signal_events` - individual behavioral events (reply, silence, unprompted, quick_reply, long_reply, stop_request)
- `user_signals` - computed engagement aggregates per user (reply rate, engagement score, consecutive silences, etc.)

#### Stripe Subscriptions
- **Stripe client**: `src/lib/stripe.ts` - Stripe SDK singleton with API version 2026-01-28.clover
- **Checkout route**: `src/app/api/checkout/route.ts` - Creates Stripe Checkout session for upgrades
- **Webhook handler**: `src/app/api/webhooks/stripe/route.ts` - Handles checkout.session.completed, customer.subscription.updated/deleted, invoice.payment_failed
- **Billing portal**: `src/app/api/billing-portal/route.ts` - Creates Customer Portal session for subscription management
- **Settings UI**: `src/components/dashboard/settings-subscription.tsx` - Upgrade buttons, manage subscription button, status display
- **Sidebar**: Shows actual plan badge from subscription context
- **Flow**: User clicks Upgrade → redirected to Stripe Checkout → webhook updates DB → user redirected back

**Webhook URL (configure in Stripe Dashboard):**
- Production: `https://www.entiremind.com/api/webhooks/stripe` (must use `www` - non-www redirects cause 307 errors)
- Events to enable: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

**Required env vars (Stripe):**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_MONTHLY_PRICE_ID=price_xxx
STRIPE_YEARLY_PRICE_ID=price_xxx
```

#### SMS Scheduling
- **Scheduled messages table**: `scheduled_messages` - stores pending/sent/failed/cancelled scheduled messages
- **Schedule API**: `src/app/api/schedule/route.ts` - founder-only POST/GET/PATCH for scheduling and cancelling messages
- **Send Now API**: `src/app/api/schedule/send/route.ts` - founder-only POST to immediately send a scheduled message
- **Cron handler**: `src/app/api/cron/send-scheduled/route.ts` - daily cron to process pending messages
- **Vercel cron**: Configured in `vercel.json` (scheduled sends at 7:40 AM Pacific, AI daily send at 7:45 AM)

**Scheduling Features:**
- Schedule messages with phone number, date/time, and message text
- View all scheduled messages with status badges (pending/sent/failed/cancelled)
- Send immediately via "Send Now" button (bypasses cron schedule)
- Cancel pending messages

**Required env vars (Cron):**
```
CRON_SECRET=your_cron_secret
```

#### Content Engine (Phase 1)
AI-powered autonomous messaging system with behavioral signal tracking.

**Signal Tracking:**
- `src/lib/signals/` - Signal tracking library
  - `index.ts` - Main exports: `trackReply()`, `trackSilence()`, `trackUnprompted()`, `trackStopRequest()`, `getUserSignals()`
  - `compute.ts` - Engagement score computation and signal aggregation
  - `types.ts` - TypeScript types for signals
- **Signal Events**: reply, silence, unprompted, quick_reply, long_reply, stop_request
- **User Signals**: Computed aggregates including reply_rate, engagement_score (0-100), consecutive_silences
- **Automatic tracking**: Twilio webhook automatically tracks signals on inbound messages

**AI Message Generation:**
- `src/lib/ai/` - AI content generation library (multi-provider)
  - `index.ts` - Main exports: `generateMessageForUser()`, `buildUserContext()`, `getAiProvider()`
  - `prompts.ts` - System prompts and content type selection
  - `types.ts` - TypeScript types for AI context and provider interface
  - `providers/openai.ts` - OpenAI adapter (gpt-4o-mini default)
  - `providers/anthropic.ts` - Anthropic/Claude adapter (claude-haiku-4-5-20251001 default)
- **Provider selection**: Controlled by `AI_PROVIDER` env var (`anthropic` default, or `openai`)
- **Content Types**: reflection, quote, check-in, action, gratitude, welcome, manual
- **Personalization**: Uses user name, intention, and engagement signals
- **Fallback**: Pre-written messages if AI call fails

**Cron Jobs:**
- **Scheduled Send**: `src/app/api/cron/send-scheduled/route.ts` - Processes pending scheduled messages at 7:40 AM Pacific
- **Daily Send**: `src/app/api/cron/daily-send/route.ts` - Sends AI-generated messages to all active users at 7:45 AM Pacific (runs after scheduled send to avoid duplicates)
- **Silence Detection**: `src/app/api/cron/detect-silence/route.ts` - Detects unreplied messages and tracks silence signals at 5:00 AM Pacific

**Founder Dashboard:**
- `src/components/dashboard/user-signals-table.tsx` - Engagement signals table with scores and metrics
- Founder page now shows user engagement signals alongside messages

**Required env vars (AI - choose one provider):**
```
# Provider selection (default: anthropic)
AI_PROVIDER=anthropic

# Anthropic (Claude) - default
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-haiku-4-5-20251001  # optional, defaults to claude-haiku-4-5-20251001

# OR OpenAI
AI_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini  # optional, defaults to gpt-4o-mini
```

**Database Migration:**
- `supabase/migrations/012_content_engine.sql` - Creates signal_events, user_signals tables, adds tracking columns to messages

#### Content Engine v2 (Trusted Guide)
Evolves the content engine from a daily message generator into a system that listens, remembers, and adapts.
- **PRD**: `docs/prds/2026-05-12-content-engine-v2.md`
- **Implementation plan**: `docs/plans/2026-05-12-content-engine-v2.md`
- **Database migration**: `supabase/migrations/013_content_engine_v2.sql`

**Reply enrichment + acknowledgement (every inbound gets feedback):**
- `src/lib/ai/enrich.ts` - Haiku-powered enrichment with 3s timeout, returns sentiment, emotional_state, themes, category, modality, mentions, open_thread, substantive flag, and (when substantive) an AI mirror line
- `src/lib/ai/prompts/enrich.ts` - System prompt for the enrichment + mirror call
- `src/lib/acks/` - Soft-ack library reader, picks from `soft_acks` table, excludes the user's last 5 ack texts to avoid repetition
- Twilio webhook uses `next/server` `after()` to enrich + ack in the background — Twilio gets its TwiML response immediately
- Substantive replies (≥30 chars or strong emotional/thematic signal) get an AI-generated mirror; short replies get a soft ack from the curated library
- STOP/HELP keywords bypass acks entirely

**User memory + weekly compaction:**
- `src/lib/ai/memory.ts` - `compactUserMemory()`, `loadUserMemory()`, `renderMemoryForPrompt()`, `buildSeedMemoryFromOnboarding()`
- `src/lib/ai/prompts/memory.ts` - Sonnet system prompt for compaction + intention shift detection
- `src/app/api/cron/weekly-memory/route.ts` - Monday morning cron (12:00 UTC ≈ 4-5 AM Pacific)
- Compacts last 7 days of replies + insights into structured JSONB memory blob: `themes`, `vision`, `obstacles`, `recent_emotional_state`, `open_threads`, `last_breakthrough`, `tone_notes`
- New users seed memory from onboarding answers; existing users have memory refreshed weekly
- Memory injected into every daily prompt with "do not quote back" guidance
- Previous memory versions archived to `user_memory_history`
- Same Sonnet call also detects intention shifts (see below)

**Smarter content selection (`src/lib/ai/prompts.ts`):**
- `selectContentType()` is now async and rules-based:
  - No same content type two days in a row (configurable via `no_repeat_days`)
  - Gentle types only (check-in, gratitude) when user is silent (≥3 silences) or last sentiment was struggling
  - `quote` capped at 1 per 7 days per user
  - 60% probability: weight by per-type reply rate (types with ≥5 sends in last 30 days qualify)
  - Otherwise: uniform pick from eligible set
- `quote` is now selectable (was hardcoded out of rotation in v1)
- All thresholds live in `content_selection_config` table — founder can tune from Supabase dashboard without deploy

**Next-day reply reference:**
- `buildUserContext()` loads the most recent substantive reply within 48 hours
- When present, the daily prompt builder injects the reply's text, themes, emotional state, and sentiment with guidance: "subtly reference if it fits naturally, do not force a callback"
- Substantive flag set by the enrichment call — short replies are not surfaced

**Extended web onboarding (`src/app/onboarding/page.tsx`):**
- 7 steps total: welcome → name → phone → intention → vision → obstacles → aligned-state
- New steps in `src/components/onboarding/steps/`: `vision-step.tsx`, `obstacles-step.tsx`, `aligned-state-step.tsx`
- `createInitialIntention` server action now only saves the intention (no longer completes onboarding)
- `completeFullOnboarding` action (called from the final step) writes `onboarding_responses`, seeds `user_memory` from the four answers, marks `onboarding_completed`, and fires welcome SMS
- Vision, obstacles, aligned-state accumulate in client state and persist together at the end

**Intention shift detection:**
- Same weekly Sonnet pass that compacts memory also assesses whether the user's stated intention has drifted
- Confidence threshold of 0.6 to surface a suggestion (false positives are costly; missed shifts surface again next week)
- Suggestions written to `intention_shift_suggestions` table with status='pending'
- Founder reviews via `IntentionShiftReview` component on `/dashboard/founder`
- Approve: archives current active intention, creates new one with proposed text
- Dismiss: marks suggestion dismissed, no change to active intention
- API: `POST /api/founder/intention-shifts` with `{ id, action: 'approve' | 'dismiss' }`

**Founder review surfaces (`/dashboard/founder`):**
- `IntentionShiftReview` - pending intention shifts queue at top
- `FounderUserInsights` - per-user expandable cards showing memory blob, recent theme cloud (last 30 days), sentiment trend bar (last 14 days), and reply-rate-by-content-type table

**Weekly recap SMS ("here's what we've noticed"):**
- The Monday memory-compaction Sonnet pass also writes an optional `recap_message` — a ≤300-char SMS reflecting 1–2 concrete specifics from the user's week back to them (null when the week has nothing real to recap; never invented)
- Staged on `user_memory.pending_recap` / `recap_generated_at` (migration 018); a compaction with no recap clears any stale one
- Daily-send delivers a fresh (<48h) staged recap **in place of** that morning's regular prompt, `content_type = 'recap'`; `takePendingRecap()` (in `src/lib/ai/memory.ts`) claims-then-clears so a recap can never double-send
- Cost: $0 extra — piggybacks on the existing weekly Sonnet call

**Silence recovery arc (`src/lib/reconnect.ts`):**
- Daily-send checks `user_signals.consecutive_silences` before prompting:
  - At `reconnect_after_silences` (default 5): sends a reconnect message (`content_type = 'reconnect'`) instead of the prompt — names the quiet, offers PAUSE. Sent once per silent stretch (tracked via reconnect outbound newer than `last_reply_at`)
  - At `pause_after_silences` (default 9), only after an unanswered reconnect: sends a farewell and sets `users.status = 'paused'` — never pauses without warning
- Thresholds founder-tunable in `content_selection_config` (migration 018)
- SMS keywords in the Twilio webhook: PAUSE → status paused + confirmation; RESUME/UNPAUSE → status active + confirmation + synthetic reply signal so the silence streak resets (otherwise the arc would immediately re-pause them)
- Replies to recap/reconnect messages link as replies (reset the streak) and count in reply-rate denominators
- Recovery messages are deliberately template-based, not AI-generated
- Pure decision logic (`decideSilenceRecovery`) unit-tested in `src/lib/reconnect.test.ts`

**Timezone + preferred send hour (Phase 1 of Phase 2 UI; cron honoring deferred):**
- `users.preferred_send_hour` (0–23, default 7) added to settings UI
- Daily-send still goes out at 7:45 AM Pacific globally — preference is stored but not yet honored
- UI copy: "We'll send around your preferred hour soon. For now all messages go out at 7:45 AM Pacific."
- Will activate when Vercel Pro upgrade enables hourly crons

**Daily-send bug fix:**
- The "already sent today" check now excludes `content_type = 'ack'` so a user who replied to a prompt still receives the next day's morning message

**Cron Jobs (updated):**
- **Scheduled Send**: `40 14 * * *` (7:40 AM Pacific) - processes pending scheduled messages
- **Daily Send**: `45 14 * * *` (7:45 AM Pacific) - AI-generated daily prompts
- **Silence Detection**: `0 12 * * *` (4-5 AM Pacific) - flags unreplied messages
- **Weekly Memory**: `0 12 * * 1` (Monday 4-5 AM Pacific) - compacts user replies + detects intention shifts

**Database Tables Added (migration 013):**
- `message_themes` - one row per (message_id, theme) pair with required category
- `user_memory` - current memory blob per user (JSONB), version, token_count
- `user_memory_history` - archived previous memory versions
- `onboarding_responses` - intention, vision, obstacles, aligned_state per user
- `intention_shift_suggestions` - founder-reviewed intention updates
- `content_selection_config` - singleton table for runtime-tunable selection rules
- `soft_acks` - rotating library of acknowledgement phrases (15 seeded)
- `messages.insights` JSONB column added (enrichment payload)
- `messages.ack_sent` BOOLEAN column added
- `messages.content_type` CHECK extended to include `'ack'`
- `users.preferred_send_hour` INTEGER added

**Database changes (migration 018):**
- `user_memory.pending_recap` TEXT + `recap_generated_at` TIMESTAMPTZ (staged weekly recap)
- `messages.content_type` CHECK extended with `'recap'` and `'reconnect'`
- `content_selection_config.reconnect_after_silences` (default 5) + `pause_after_silences` (default 9)

**Cost notes:**
- Enrichment + ack: Haiku, ~$0.0002 per inbound
- Daily prompt: Haiku, ~$0.0002 per send
- Weekly memory: Sonnet, ~$0.005 per active user per week
- Soft acks: $0 (database lookup, no LLM call)
- Prompt caching deliberately not enabled (system prompt is well under Haiku's 2048-token cache minimum at current scale)

#### Monetization & Growth (July 2026)
Plan: `docs/prds/../plans/2026-07-04-monetization-growth.md`. Migration: `020_value_ladder_dunning.sql`.

**Free-trial value ladder (`src/lib/billing/`):**
- `computeEntitlement()` (entitlement.ts) — single source of plan logic: `paid` (monthly/yearly with active/trialing/past_due), `trial` (inside 10-day window, or missing data — fails toward generosity), `expired`. Founder/admin always `paid`.
- Trial starts at onboarding completion: `completeFullOnboarding` sets `subscriptions.trial_ends_at = now() + 10 days` (write-once). Existing users grandfathered with 14 days at migration time.
- `daily-send` gates on entitlement first: `expired` users exit the daily loop into the upgrade path — trial-end SMS personalized from their memory theme (template-based, deliberately no LLM), one follow-up 7 days later, then quiet. Inbound enrichment + acks continue for everyone.
- `weekly-memory` skips expired users (no Sonnet spend on gated accounts).
- Dashboard: "Trial — N days left" / "Trial ended" chips in settings; non-dismissible `TrialEndedBanner` on `/dashboard` when expired.

**Failed-payment dunning (`src/lib/billing/dunning.ts`):**
- `invoice.payment_failed` → SMS notice (content_type `billing`), throttled to one per 5 days via `subscriptions.dunning_notified_at` (Stripe fires the event on every Smart Retry). Enable Smart Retries in the Stripe dashboard.
- `customer.subscription.deleted` → farewell SMS with the way back; recovery to `active` clears the throttle.
- `billing` messages never suppress the daily prompt and never count toward silence; `upgrade` messages excluded from silence detection, replies to them reply-linked (hot lead).

**One-tap SMS upgrade links (`src/lib/billing/token.ts`):**
- Plan: `docs/plans/2026-07-04-sms-upgrade-link.md`. HMAC-signed, purpose-bound tokens (`intent: upgrade|billing`) embedded as `https://www.entiremind.com/u/{token}` in trial-end, follow-up, dunning, and subscription-ended SMS. **Never a login** — a token only authorizes opening a payment flow for its user; `/u/*` routes must never set a session.
- `GET /u/[token]` (public): upgrade intent → plan-choice interstitial (`UpgradePlanPicker` → `POST /api/upgrade-checkout` → Stripe Checkout); billing intent (past_due only) → 302 straight into the Stripe billing portal. Invalid/expired/errors degrade to `/auth?next=/dashboard/settings`.
- Checkout session creation shared between `/api/checkout` (authenticated) and `/api/upgrade-checkout` (tokenized) via `src/lib/billing/checkout.ts`; SMS-driven sessions carry `metadata.source = 'sms-upgrade-link'`.
- Success lands on `/welcome-back` (public; fulfillment is webhook-driven, no browser session needed).
- Expiry: 60 days (upgrade), 14 days (billing). `/u/*` gets `Cache-Control: no-store` + `X-Robots-Tag: noindex` via next.config.
- **Requires env var `UPGRADE_LINK_SECRET`** (32+ random bytes, e.g. `openssl rand -base64 32`). If unset, messages fall back to the settings URL — sends never fail.

**Shareable archetype pages (`src/app/archetype/[slug]/`):**
- Public, statically generated pages for the four archetypes — generic copy only (`ARCHETYPE_PUBLIC` in `src/lib/persona/content.ts`), zero user data. Invalid slugs 404 (`dynamicParams = false`).
- `opengraph-image.tsx` renders the share card per archetype via `next/og` (params is a Promise in Next 16 — must be awaited).
- `ShareArchetypeButton` (native share sheet + clipboard fallback) on the onboarding reveal step and the dashboard persona card.
- Attribution: CTA links `/?src=share-{slug}`; waitlist modals pass `source` through; leads API validates against `^share-(visionary|alchemist|seeker|phoenix)$` and defaults to `landing_page` otherwise. Query share-driven signups via `leads.source LIKE 'share-%'`.

#### Curated Quote Library + Weekly Email Editions
Curated, themed quote library feeding the `quote` SMS content type and a dashboard card, plus an AI-drafted weekly email pushed to ActiveCampaign as a draft campaign.
- **Database migration**: `supabase/migrations/022_quotes_and_weekly_editions.sql`

**Quote library (`quotes` table + `src/lib/quotes/`):**
- 8 themes aligned with manifestation topics: abundance, confidence, trusting-the-process, gratitude, resilience, love, purpose, presence
- Migration seeds a ~12-quote public-domain fallback; the real library is built by `scripts/import-quotes.ts` (`npx tsx scripts/import-quotes.ts [--source zenquotes|quotable] [--target 200]`) — fetches from ZenQuotes (Quotable dataset fallback), filters to ≤120 chars, categorizes via tag map + Haiku batch pass (rejects off-brand quotes), inserts with `source`/`source_tags`
- ZenQuotes attribution: free tier requires "Quotes via ZenQuotes.io" on surfaces displaying imported quotes (check `quotes.source`)
- When `selectContentType` picks `quote`, `generateMessageForUser` pulls from the library (matched to persona `intention_category` via `mapCategoryToQuoteThemes`), formatted `"text" — Author`; excludes the user's last 20 sent quotes via `messages.quote_id`; falls back to the LLM path if the library is empty
- Dashboard: `QuoteOfTheDay` card on `/dashboard` — deterministic per user per day (`pickDeterministicQuote`, yellow left-border accent)
- Founder curates by flipping `quotes.active` in Supabase

**Weekly email editions (`weekly_editions` table + `src/lib/editions/`):**
- Monday cron `/api/cron/weekly-edition-draft` (16:00 UTC): rotates to the least-recently-used theme, picks 3 library quotes (excluding the last 8 editions' quotes), drafts title/intro/reflection/question via direct Anthropic call (`ANTHROPIC_EDITION_MODEL`, default `claude-sonnet-4-6`), renders branded HTML (`src/lib/email-campaigns/template.ts`), and pushes it into the email provider as a **draft campaign**
- **Nothing is ever auto-sent** — the founder reviews, tweaks, and sends from the provider's UI; the provider owns list management, unsubscribe compliance, and delivery
- Daily cron `/api/cron/sync-email-contacts` (13:00 UTC): upserts active users + waitlist leads into the provider list (tagged `user`/`lead`, deduped by email, user wins)
- Provider abstraction `src/lib/email-campaigns/` mirrors the SMS layer; ActiveCampaign is the only adapter (contact sync via v3 API; draft campaign creation via legacy v1 `message_add` + `campaign_create` because v3 cannot link a message to a campaign)

**Required env vars (ActiveCampaign):**
```
ACTIVECAMPAIGN_API_URL=https://youraccount.api-us1.com
ACTIVECAMPAIGN_API_KEY=your_api_key
ACTIVECAMPAIGN_LIST_ID=1
ACTIVECAMPAIGN_FROM_EMAIL=hello@entiremind.com
ACTIVECAMPAIGN_FROM_NAME=Entiremind   # optional, defaults to Entiremind
```

**Manual setup:** create the AC list, verify the sending domain (DKIM) in AC, set env vars in Vercel. Run migration 022 + the import script before the first Monday draft.

#### Marketing Content & Ads Engine (multi-brand)
AI content engine for paid ads (Meta-first) and organic social (Instagram, TikTok, YouTube). Multi-brand by design: every table is keyed by `brands` — Entiremind is seeded as the first brand; future projects are new rows, not code.

**Agentic loop:** trend research → campaign plan → copy/script → image (Gemini "Nano Banana", real) / video (Veo, stub) → founder review → publish/launch (platform adapters, placeholder credentials) → metrics → next week's plan.

**Approval model (enforced in code, not just config):**
- Paid ads ALWAYS require founder review — `terminalStatusFor()` in `src/lib/marketing/pipeline/generate.ts` plus a hard guard in `pipeline/publish.ts` (`reviewed_by` required for `target='ad'`)
- Organic channels have per-channel `publish_mode`: `require_approval` (default) or `auto_publish`; the channels API rejects `auto_publish` for `meta_ads`
- Meta ads are additionally created with `status: "PAUSED"` while `marketing_engine_config.ads_launch_paused` is true

**Dual production path (`content_pieces.production_mode`):**
- `ai_generated`: AI writes copy + generates the image; piece goes to review (or auto-schedule for organic auto_publish channels)
- `founder_filmed`: AI writes a talking-head script → status `awaiting_footage` → founder films and uploads (direct-to-storage via signed upload URL — videos exceed Vercel's ~4.5 MB body limit) → `pending_review`

**Manual control:** every creative field (headline, copy, caption, script, hashtags, image_prompt, CTA, budget, schedule) is founder-editable at any pre-publish status via `PATCH /api/founder/marketing/content/[id]`; images can be regenerated from an edited prompt; pieces can be created fully by hand (`POST /api/founder/marketing/content` with `mode: "manual"`).

**Library (`src/lib/marketing/`):**
- `ai.ts` - `generateStrictJson()` (zod-validated JSON from the existing AI provider adapter; adapters now accept `maxTokens`)
- `prompts/` - campaign-plan, ad-copy, organic-post, video-script, trend-research, image-prompt (brand voice/visual guardrails injected everywhere)
- `media/` - `MediaGeneratorAdapter`; `providers/gemini.ts` (real, `GEMINI_API_KEY`, model `gemini-2.5-flash-image`), `providers/veo.ts` (stub); `storage.ts` uploads to the public `marketing-media` bucket (public so Meta/IG can fetch creative URLs)
- `publishers/` - `PublisherAdapter` registry keyed by platform; `providers/meta.ts` builds the real Marketing API chain (campaign → adset → adimage → adcreative → ad) and IG organic publish, logging placeholder requests + returning `stub_meta_*` ids until `META_*` env vars are set; TikTok/YouTube stubs
- `trends/` - AI trend research (real) + google-trends/tiktok-trends stub sources → `trend_snapshots`
- `pipeline/` - `plan.ts`, `generate.ts`, `regenerate.ts`, `publish.ts`, `metrics.ts`

**Founder UI:** `/dashboard/founder/marketing` (linked from the founder page) — brand selector, review queue (approve/reject/edit + regenerate image), "Awaiting your footage" filming queue with script + upload, campaign list with "Plan content now" / "Run trend research", schedule & published table with "Publish now", per-campaign performance, trend panel, channel settings. Components in `src/components/dashboard/marketing/`.

**API routes (founder-only, `src/app/api/founder/marketing/`):** brands (GET/POST, PATCH [id]), channels PATCH, campaigns (GET/POST, PATCH [id]), content (GET/POST, PATCH [id]), content/[id]/review, /upload (signed-URL two-step), /regenerate, /publish, and generate (modes: research | plan | generate). Shared guard: `requireFounder()` in `src/lib/auth/founder.ts`.

**Crons (all in vercel.json):**
- Marketing Planning: `0 11 * * 1` (weekly Monday) - trend research + plan per active brand
- Marketing Generate: `0 13 * * *` - drain draft pieces (batch cap `max_generations_per_run`, stale-claim reaper)
- Marketing Publish: `30 13 * * *` - publish scheduled pieces due now
- Marketing Metrics: `0 14 * * *` - pull daily metrics into `content_metrics`

**Config:** `marketing_engine_config` singleton (enabled, weekly_pieces_per_brand, batch caps, default budget, ads_launch_paused, video_enabled, image/video provider) — founder-tunable from Supabase without deploy.

**Database (migration 018):** `brands`, `brand_channels`, `trend_snapshots`, `marketing_campaigns`, `content_pieces` (status lifecycle: draft → generating → [awaiting_footage →] pending_review → approved/rejected → scheduled → publishing → published|launched|failed), `media_assets`, `content_metrics`, `marketing_engine_config`, plus the public `marketing-media` storage bucket.

**Required env vars (marketing engine):**
```
GEMINI_API_KEY=...            # real — Nano Banana image generation
GEMINI_IMAGE_MODEL=gemini-2.5-flash-image  # optional

# Placeholders until platform apps are approved (adapters stub until set):
META_ACCESS_TOKEN=
META_AD_ACCOUNT_ID=
META_PAGE_ID=
META_IG_BUSINESS_ID=
META_API_VERSION=v21.0        # optional
TIKTOK_ACCESS_TOKEN=
TIKTOK_ADVERTISER_ID=
YOUTUBE_CLIENT_ID=
YOUTUBE_CLIENT_SECRET=
YOUTUBE_REFRESH_TOKEN=
```

**Not yet wired (placeholders in place):** Veo video generation, live Meta/TikTok/YouTube API calls (Meta needs app review + Business verification: `ads_management`, `pages_manage_ads`, `instagram_content_publish`), live trend sources, real metrics pulls.

#### Public Archetype Quiz + SEO Plumbing + Site Config (July 2026)
Migration: `025_public_quiz_leads.sql`.

**Public quiz (`/quiz`, no auth):**
- Same eight tap screens as the authed `ArchetypeFlow` — identical step components, `questions.ts` config, and pure `scoreProfile()`; only the ending differs, built on the design-philosophy "partial value before contact capture" principle: taps → **partial reveal** (archetype name + hook line — the feel-seen moment) → **email gate** (name/phone/SMS-consent optional, honeypot field) → **full reveal** (same `buildRevealContent()` reading onboarding users get) + share
- Components in `src/components/quiz/`; sessionStorage persistence so refresh keeps progress; quiz share copy in `src/lib/persona/share.ts` (archetype-level only — inner-critic content never appears in public copy; unit-tested)
- API `POST /api/quiz/lead` — zod-validated, server re-runs `scoreProfile()` (client results never trusted), **upserts on `leads.email`**: retakes refresh quiz fields but never clobber original `source`, revoke prior `sms_consent`, or overwrite a stored phone. New leads get `source='quiz'` (or validated `share-{slug}`)
- Share attribution loop: `/archetype/[slug]` CTAs now link `/quiz?src=share-{slug}`; the gate forwards `source`; funnel queries see `landing_page` / `quiz` / `share-*`
- Analytics: `quiz_start`, `quiz_step`, `quiz_partial_reveal`, `quiz_gate_submit` (also fires GA4 `generate_lead` with `lead_source: quiz`), `quiz_complete`, `quiz_share_click` in `src/lib/analytics.ts`
- ActiveCampaign contact sync tags quiz leads `quiz-lead` + `archetype-{slug}` — nurture automations segment in AC, no code
- `leads` columns added (migration 025): `archetype`, `quiz_answers`, `quiz_version`, `quiz_completed_at`

**SEO plumbing:**
- `src/app/sitemap.ts` (public pages + quiz + 4 archetype pages), `src/app/robots.ts` (disallow /dashboard, /onboarding, /auth, /api, /u), `src/app/opengraph-image.tsx` (site-default OG card), full `metadataBase`/OpenGraph/Twitter defaults in `layout.tsx`

**Site config (`src/config/site.ts`):**
- `siteConfig` (name, tagline, description, url, supportEmail, keywords, gtmId) + `absoluteUrl()` — the templating seed for future business ideas. New code imports it; existing hardcoded "Entiremind" strings migrate opportunistically when files are touched.

### Not Yet Implemented
- Hourly send cadence honoring `preferred_send_hour` (waiting on Vercel Pro)
- True timezone-aware delivery (Phase 2)
- Embedding-based reply retrieval for richer prompts (Phase 3)
- Bandit-style content selection replacing rules (Phase 3)
- User-facing insights surface ("here's what we've noticed") (Phase 3)
- Fully autonomous intention updates without founder approval (Phase 4)

#### Technique Playbook
A curated, founder-editable library of distilled thinking-tools (from books like *Designing Your Life*, *Don't Believe Everything You Think*, *The Mountain Is You*, neuroscience-of-manifestation) stored as **prompt recipes** the daily-SMS engine injects, matched to a user's cognitive-distortion profile + current state. Internal-only — never shown to users.
- **Database migration**: `supabase/migrations/023_techniques.sql`
- **House stance**: `docs/methodology.md` — "thoughts are material, not master"; enact-don't-teach; IP hygiene (own names, no branded exercises, `source_*` internal-only); `gentle` safety flag.

**Selection (`src/lib/techniques/`):**
- `pickTechniqueForUser(context, contentType)` in `generateMessageForUser` after content-type selection (past the quote fast-path); returns `null` (probability roll, empty library, or no eligible match) → generic prompt path runs unchanged (zero regression)
- Rolls `technique_apply_probability` (default 0.50; 0 disables); hard filters (content type · `gentle` when struggling/silent · tone compat · exclude last `technique_no_repeat_count`); scores `+3` distortion overlap, `+2` sentiment fit, `+1` category, `+priority`, `+jitter`
- When a technique is picked, `buildUserPrompt(context, contentType, technique)` replaces the generic content-type instruction with a recipe frame ("turn into ONE question that enacts the approach — never name or explain it"); all persona/memory/reply blocks still stack
- Every send tagged `messages.technique_id` (via `SendSmsOptions.techniqueId` / `GeneratedMessage.techniqueId`) → per-technique reply rate for free
- Config knobs on `content_selection_config`: `technique_apply_probability`, `technique_no_repeat_count`

**Curation:**
- `scripts/digest-techniques.ts <notes.md>` — paste book takeaways (+ `Source: Title — Author`), Sonnet drafts technique rows in house voice with IP rules, inserts as `status='draft'`
- Founder dashboard "Technique Playbook" section (`/dashboard/founder`): list + per-technique sends/reply-rate, edit-in-place, activate/retire/create. API `src/app/api/founder/techniques/route.ts` (create/update/activate/retire, founder-gated)
- 10 seed techniques ship active in migration 019, one per distortion family

**Deferred to v2:** signal-weighted (bandit) selection, reply-rate-by-distortion cross-tabs, A/B recipe variants.

---

## Deployment

### Vercel Configuration

**Project**: `blairs-projects-7e709a29/2026-entiremind`

**Required Environment Variables (set in Vercel Dashboard):**
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY

# SMS (Twilio)
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_MONTHLY_PRICE_ID
STRIPE_YEARLY_PRICE_ID

# Cron
CRON_SECRET

# SMS upgrade links (openssl rand -base64 32)
UPGRADE_LINK_SECRET

# AI (choose one provider)
AI_PROVIDER=anthropic  # or 'openai'
ANTHROPIC_API_KEY      # if using anthropic (default)
OPENAI_API_KEY         # if using openai

# Admin
ADMIN_EMAIL
```

**Deploy Commands:**
```bash
vercel --prod          # Deploy to production
vercel                 # Deploy preview
vercel logs            # View deployment logs
```

### External Service Configuration

**Twilio Console** (Phone Numbers → Messaging):
- Webhook URL: `https://entiremind.com/api/sms/webhook/twilio`
- Method: POST

**Supabase Dashboard** (Authentication → URL Configuration):
- Site URL: `https://entiremind.com`
- Redirect URLs: `https://entiremind.com/**`, `https://www.entiremind.com/**`
