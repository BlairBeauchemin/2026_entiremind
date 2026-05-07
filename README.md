# Entiremind

A lightly magical, SMS-based manifestation system that helps users align their thoughts, intentions, and actions to manifest their goals.

**Live**: https://www.entiremind.com

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS v4
- **Backend**: Supabase (Postgres, Auth)
- **Hosting**: Vercel (auto-deploys from `main`)
- **Messaging**: Twilio SMS (A2P 10DLC approved)
- **Payments**: Stripe subscriptions
- **Components**: shadcn/ui, Framer Motion

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Development Commands

```bash
npm run dev          # Start dev server with Turbopack
npm run build        # Production build
npm run typecheck    # TypeScript type checking
npm run lint         # ESLint with auto-fix
npm run format       # Prettier formatting
```

## Environment Variables

Copy `.env.example` to `.env.local` and fill in:

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `SMS_PROVIDER` - `twilio` or `telnyx`
- `TWILIO_*` - Twilio credentials
- `STRIPE_*` - Stripe credentials
- `CRON_SECRET` - Secret for cron job authentication

## Key Features

- **Landing page** with waitlist capture (name, email, phone)
- **SMS engine** with provider abstraction (Twilio/Telnyx)
- **User dashboard** with profile, settings, pause/resume controls
- **Founder dashboard** (`/dashboard/founder`) with:
  - Message scheduling UI (schedule, send now, cancel)
  - User message viewer with status and direction
- **Stripe subscriptions** with checkout and billing portal
- **Daily cron** for scheduled message delivery (7:45 AM Pacific)

## Documentation

See [CLAUDE.md](./CLAUDE.md) for detailed implementation docs.
