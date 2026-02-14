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
- **SMS Engine**: Provider-agnostic SMS abstraction (supports Twilio and Telnyx) for two-way messaging
- **Web Dashboard**: Minimal profile, subscription status, pause/resume controls (not primary engagement surface)
- **Signal Storage**: Behavioral signals persisted per user, queryable by founder
- **Founder Review**: Inspect raw replies, tag patterns, guide system evolution

### Tech Stack
- **Frontend**: Next.js 16 with App Router, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (Postgres, Auth, Edge Functions)
- **Hosting**: Vercel (auto-deploys from `main` branch)
- **Messaging**: SMS abstraction layer (`@/lib/sms`) supporting Twilio (default) and Telnyx
- **AI**: OpenAI API (prompt drafting, tone variation, summarization — not autonomous)
- **Components**: shadcn/ui with Radix UI primitives, Lucide icons
- **Animations**: Framer Motion
- **Payments**: Stripe subscriptions (payment as behavioral signal)

### Database Tables
- `users` - user profiles with phone, email, timezone
- `messages` - outbound + inbound SMS
- `reflections` - user intention statements
- `behavioral_signals` - per-user signal data
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

### Dashboard Principles
- Supports trust, reflection, and control
- NOT the primary engagement surface (SMS is)
- No charts, streaks, or productivity metrics
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
3. Submits email + phone
4. Stored as lead
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
2. SMS engine (Twilio/Telnyx integration, two-way messaging) ✅
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

### Completed (as of Feb 2026)

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

#### Environment
- Supabase project configured: `cprzebhlwfibajrrtuqp.supabase.co`
- `.env.local` contains Supabase credentials

#### Production Deployment
- **Domain**: https://entiremind.com (www.entiremind.com redirects)
- **Hosting**: Vercel (`blairs-projects-7e709a29/2026-entiremind`)
- **Vercel Dashboard**: https://vercel.com/blairs-projects-7e709a29/2026-entiremind
- **Deploy**: Push to `main` branch or run `vercel --prod`

**Configured Services:**
- Twilio webhook: `https://entiremind.com/api/sms/webhook/twilio`
- Supabase Auth redirect URLs: `https://entiremind.com/**`, `https://www.entiremind.com/**`
- Supabase Site URL: `https://entiremind.com`

#### SMS Engine (Multi-Provider)
- **Provider abstraction**: `src/lib/sms/` - supports Twilio (default) and Telnyx
- **Provider selection**: Controlled by `SMS_PROVIDER` env var (`twilio` or `telnyx`)
- **Send SMS**: `src/lib/sms/index.ts` - provider-agnostic wrapper functions
- **Send endpoint**: `src/app/api/sms/send/route.ts` - authenticated SMS sending
- **Webhook endpoints**:
  - Twilio: `src/app/api/sms/webhook/twilio/route.ts`
  - Telnyx: `src/app/api/sms/webhook/telnyx/route.ts`
- **Welcome SMS**: Automatically sent after user completes onboarding
- **Database**: `messages` table stores all SMS with `provider` and `external_message_id` columns
- **Legacy code**: `src/lib/telnyx.ts` preserved but deprecated

**Current Status (Feb 2026):**
- Twilio integration code complete and configured in `.env.local`
- Database migration `007_sms_provider_abstraction.sql` has been run
- **Pending**: Twilio account approval/A2P 10DLC registration before live testing
- To switch back to Telnyx: set `SMS_PROVIDER=telnyx` in `.env.local`

**Required env vars (Twilio - default):**
```
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Required env vars (Telnyx - alternative):**
```
SMS_PROVIDER=telnyx
TELNYX_API_KEY=your_api_key
TELNYX_PHONE_NUMBER=+1234567890
TELNYX_MESSAGING_PROFILE_ID=your_profile_id
```

#### Founder Review Interface
- **Founder page**: `src/app/dashboard/founder/page.tsx` - admin-only message viewer
- **Message table**: `src/components/dashboard/founder-message-table.tsx` - displays all user messages
- Access restricted to emails in `ADMIN_EMAIL` environment variable
- Shows: direction (in/out), user name, phone, message text, status, timestamp

#### Database Tables Implemented
- `users` - user profiles with phone, email, timezone, onboarding status
- `intentions` - user intention statements (active/completed/archived)
- `messages` - outbound + inbound SMS with `external_message_id`, `provider` column, and delivery status
- `subscriptions` - Stripe subscription state per user (plan, status, period end, Stripe IDs)

#### Stripe Subscriptions
- **Stripe client**: `src/lib/stripe.ts` - Stripe SDK singleton with API version 2026-01-28.clover
- **Checkout route**: `src/app/api/checkout/route.ts` - Creates Stripe Checkout session for upgrades
- **Webhook handler**: `src/app/api/webhooks/stripe/route.ts` - Handles checkout.session.completed, customer.subscription.updated/deleted, invoice.payment_failed
- **Billing portal**: `src/app/api/billing-portal/route.ts` - Creates Customer Portal session for subscription management
- **Settings UI**: `src/components/dashboard/settings-subscription.tsx` - Upgrade buttons, manage subscription button, status display
- **Sidebar**: Shows actual plan badge from subscription context
- **Flow**: User clicks Upgrade → redirected to Stripe Checkout → webhook updates DB → user redirected back

**Webhook URL (configure in Stripe Dashboard):**
- Production: `https://entiremind.com/api/webhooks/stripe`
- Events to enable: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`

**Required env vars (Stripe):**
```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
STRIPE_MONTHLY_PRICE_ID=price_xxx
STRIPE_YEARLY_PRICE_ID=price_xxx
```

### Not Yet Implemented
- Scheduled/recurring SMS prompts
- Behavioral signals table and tracking
- Message analytics and patterns

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
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
STRIPE_MONTHLY_PRICE_ID
STRIPE_YEARLY_PRICE_ID

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
