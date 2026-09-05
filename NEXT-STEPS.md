# Next Steps — September 5, 2026

Where everything stands and what's open. Ordered by urgency, written to be read from a phone.

**Quick links**
- Vercel: https://vercel.com/blairs-projects-7e709a29/2026-entiremind
- Supabase SQL editor: https://supabase.com/dashboard/project/cprzebhlwfibajrrtuqp/sql
- Founder dashboard: https://www.entiremind.com/dashboard/founder

---

## 0. WHERE WE LEFT OFF — docs alignment + automation (Sept 5)

Two things landed together on `docs/align-to-reality-and-automate`:

**The docs now describe what's actually built.** They had drifted badly — `prd.md` hadn't
been touched since February and named database tables that were never created; four shipped
systems (message modes, the founder simulator, testimonials, the funnels) appeared in no
doc at all; `CLAUDE.md` carried three wrong migration numbers and said onboarding was 7
steps when it's 15.

**Founder-approval gates are gone except where they earn their place.** Techniques now go
live when you digest them. Message modes are switched on. Intention drift texts the *user*
instead of queueing for you — and critically, **nothing rewrites a user's intention**; the
old "approve" action that did is deleted.

**Still gated, deliberately:** paid ad launches, organic social publishing, weekly email
sends, testimonial publishing.

### To finish this off

1. **Run migration `029_autonomous_operation.sql`** in the Supabase SQL editor. Until you
   do, message modes stay off and drift nudges will fail on the status constraint.
2. **Sanity check** — `select feeling_seen_enabled, intention_shift_min_confidence from
   content_selection_config;` → should be `true, 0.60`.
3. **Watch the next few daily sends.** Prompts should start varying between questions,
   mirrors, callbacks and plain statements. If they all still read as questions,
   `feeling_seen_enabled` didn't take.
4. ~~Activate the Craft pass system prompt.~~ **Already done** — it was activated
   2026-07-25 and has driven every daily prompt since (verified against production; the
   live body matches the 026 seed unedited). Nothing to do here.

---

## 1. Open decisions (flagged, not acted on)

- **The "Two Months Free" badge understates your discount.** $12.99 × 12 = $155.88; $99
  saves $56.88 — about **4.4 months free**. Two months would be $129.90. Your pricing
  claim, so I left it alone (`src/components/landing/pricing.tsx:85`).
- **`/v2` is a live, publicly reachable landing page** using `landing-v2/*`, while `/` uses
  `landing/*`. Noindexed and unlinked, but it's a second front door — intentional or not.
- **Dead auth code** — `phone-auth-form.tsx`, `otp-verification-form.tsx`,
  `email-otp-form.tsx` are imported by no route. Deletion candidates.
- **Cron collision** — `sync-email-contacts` and `marketing-generate` both fire at
  `0 13 * * *`.

---

## 2. Dashboard chores (still open from July)

- **Vercel env vars**: `NEXT_PUBLIC_GTM_ID` (GTM-WBJQRSNT), `UPGRADE_LINK_SECRET`
  (`openssl rand -base64 32`), the four `ACTIVECAMPAIGN_*` vars, `GEMINI_API_KEY`
  (https://aistudio.google.com/apikey — without it the marketing-generate cron fails on
  image pieces).
- **ActiveCampaign**: create the list, verify the sending domain (DKIM), then the two AC
  crons start working.
- **GTM container**: add GA4 tags per `docs/marketing/gtm-setup.md` — events fire today but
  land nowhere.
- **Stripe**: enable Smart Retries (the dunning flow assumes it).
- **Schedule the reconcile cron** when a Vercel cron slot frees:
  `{ "path": "/api/cron/reconcile-enrichment", "schedule": "0 8 * * *" }`.

---

## 3. Needs a computer

- `npx tsx scripts/import-quotes.ts` to build the real quote library (needs
  `ANTHROPIC_API_KEY`; `--source quotable` avoids ZenQuotes attribution). Until then
  quotes use the ~12 seeded fallbacks.
- Feed a book through `scripts/digest-techniques.ts <notes.md>` to grow the playbook past
  the 10 seeds. **Note:** techniques now go live immediately — running the script is the
  decision.

---

## 4. Known-open, lower priority

- Per-IP rate limiting on `/api/quiz/lead` (has zod + honeypot + idempotent upsert today)
- ~26 hardcoded "Entiremind" strings still to migrate to `siteConfig` (opportunistic)
- Hourly send cadence honoring `preferred_send_hour` (needs Vercel Pro)
- Marketing engine live platform credentials (Meta/TikTok/YouTube app approvals)
- User-facing insights surface — the one PRD in `docs/prds/` still describing unbuilt work

---

## Context for future-you

- **August** was the design system: `DESIGN.md` is now the single visual authority, the
  whole codebase moved onto the Daylight palette (cobalt on linen), and The Space
  (`/space`) shipped — affirmations under an accumulating night sky.
- **Still no real users.** Nothing in the product has been tested against a stranger.
