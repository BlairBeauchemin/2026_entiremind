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
- **SMS Engine**: Telnyx integration for two-way messaging, scheduled + event-based
- **Web Dashboard**: Minimal profile, subscription status, pause/resume controls (not primary engagement surface)
- **Signal Storage**: Behavioral signals persisted per user, queryable by founder
- **Founder Review**: Inspect raw replies, tag patterns, guide system evolution

### Tech Stack
- **Frontend**: Next.js 15 with App Router, TypeScript, Tailwind CSS v4
- **Backend**: Supabase (Postgres, Auth, Edge Functions)
- **Messaging**: Telnyx (SMS) with webhooks to API routes
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
2. SMS engine (Telnyx integration, two-way messaging) ✅
3. Signal storage and founder review interface ✅
4. User dashboard (profile, subscription, pause/resume) ✅
5. Stripe subscription integration

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
- Auth flow: `/auth` page → email input → magic link sent → callback verifies → redirect to dashboard
- Proxy-based route protection for `/dashboard/*` (Next.js 16+ convention)
- Auto-redirect: unauthenticated users → `/auth`, authenticated users on `/auth` → `/dashboard`
- Sign out functionality in dashboard sidebar

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

#### SMS Engine (Telnyx)
- **Telnyx SDK** installed and configured (`telnyx` npm package)
- **Send SMS**: `src/lib/telnyx.ts` - wrapper functions for sending SMS
- **Send endpoint**: `src/app/api/sms/send/route.ts` - authenticated SMS sending
- **Webhook endpoint**: `src/app/api/sms/webhook/route.ts` - receives inbound SMS from Telnyx
- **Welcome SMS**: Automatically sent after user completes onboarding
- **Database**: `messages` table stores all inbound/outbound SMS with status tracking
- Required env vars: `TELNYX_API_KEY`, `TELNYX_PHONE_NUMBER`, `TELNYX_MESSAGING_PROFILE_ID`

#### Founder Review Interface
- **Founder page**: `src/app/dashboard/founder/page.tsx` - admin-only message viewer
- **Message table**: `src/components/dashboard/founder-message-table.tsx` - displays all user messages
- Access restricted to emails in `ADMIN_EMAIL` environment variable
- Shows: direction (in/out), user name, phone, message text, status, timestamp

#### Database Tables Implemented
- `users` - user profiles with phone, email, timezone, onboarding status
- `intentions` - user intention statements (active/completed/archived)
- `messages` - outbound + inbound SMS with Telnyx message IDs and delivery status

### Not Yet Implemented
- Stripe subscription integration
- Scheduled/recurring SMS prompts
- Behavioral signals table and tracking
- Message analytics and patterns
