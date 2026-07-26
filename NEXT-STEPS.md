# Next Steps — July 11, 2026

Where everything landed after the big merge + quiz session, and what's left.
Written to be read from a phone. Sections are ordered by urgency.

**Quick links**
- PR #11 (quiz + SEO + funnel): https://github.com/BlairBeauchemin/2026_entiremind/pull/11
- Preview of the quiz: https://2026-entiremind-git-claude-proj-47bbc2-blairs-projects-7e709a29.vercel.app/quiz
- Vercel dashboard: https://vercel.com/blairs-projects-7e709a29/2026-entiremind
- Supabase SQL editor: https://supabase.com/dashboard/project/cprzebhlwfibajrrtuqp/sql

---

## 0. NEW (July 26) — enrichment / memory learning-loop fix

Branch `claude/enrichment-memory-loop-fix`. Fixes the silent enrichment drops
(daily gen's `ANTHROPIC_MODEL=claude-sonnet-5` was also being used by
enrichment, which timed out / returned thinking blocks and left `insights` null).

**Do these after merge:**

1. **Run migration `027_reply_steer.sql`** (Supabase SQL editor). Adds
   `user_memory.active_steer`, `steer_set_at`, `steer_nudged`. Safe to re-run.
   Until it runs, the steer feature simply stays dormant (code reads the columns
   defensively) — enrichment hardening works regardless.

2. **(Optional) set `ANTHROPIC_ENRICH_MODEL` in Vercel** → leave unset to default
   to Haiku (recommended). Enrichment no longer inherits `ANTHROPIC_MODEL`, so the
   Sonnet daily-gen model can't slow it down again. Optional `ENRICH_TIMEOUT_MS`
   (default 10000).

3. **Backfill the existing null-insights replies** — the reconcile cron is built
   but NOT scheduled (Vercel cron-slot limit). Run it once by hand:
   ```
   curl -H "Authorization: Bearer $CRON_SECRET" \
     https://www.entiremind.com/api/cron/reconcile-enrichment
   ```
   When a cron slot frees up, add to `vercel.json`:
   `{ "path": "/api/cron/reconcile-enrichment", "schedule": "0 8 * * *" }`.

4. **Revert the TEMP test knobs** in `content_selection_config` (SQL editor):
   `mirror_target_per_week` 20 → 2, `callback_target_per_week` 0 → 1,
   `technique_apply_probability` 0 → 0.50. Also review the "Craft pass v1
   (feeling-seen)" `system_prompts` row's `is_active`. (The manually rewritten
   `user_memory` blob for 714-872-2834 was test data.)

**Verify after deploy:** text in "can we focus on manifestation?" → check
`select insights->>'directive', (select active_steer from user_memory um where
um.user_id = m.user_id) from messages m where direction='inbound' order by
created_at desc limit 1;` and confirm the next morning's prompt is about
manifestation, not the shoulder.

---

## 1. URGENT — run the migrations (needs ~15 min, phone browser works)

Production `main` was deployed today with 8 merged branches. The code expects
tables that don't exist until these run. Until then, some new features will
error (existing SMS + billing keep working; the testimonial capture hook on
inbound SMS is the one live path that can log errors).

Open the Supabase SQL editor and run each file's contents **in this order**
(files are in `supabase/migrations/` on GitHub — copy/paste one at a time):

1. `018_testimonials.sql`
2. `019_weekly_recap_silence_recovery.sql`
3. `020_value_ladder_dunning.sql`
4. `021_messaging_simulator.sql`
5. `022_quotes_and_weekly_editions.sql`
6. `023_techniques.sql`
7. `024_marketing_engine.sql`
8. `025_public_quiz_leads.sql` (this one is on PR #11's branch until it merges)

The Supabase dashboard works fine from a phone browser. If you'd rather wait
for a computer, that's OK — just know the cron jobs (silence detection,
weekly memory, daily send extras) may log errors until then.

**After the migrations, two quick sanity checks** (same SQL editor, from the
merged PRs' verify steps):

- `select name, status, gentle from techniques;` → should show 10 seed rows
  (PR #10). Dial `technique_apply_probability` in `content_selection_config`
  to taste — 0 disables techniques instantly, default is 0.50
- `select count(*) from quotes;` → should show ~12 seeded fallback quotes
  (PR #9; the real library comes from the import script, section 4)

## 2. Phone-friendly — review + merge PR #11

- Try the quiz on the preview link above (it's the real thing, end to end)
- Read the copy that needs your review (all v1 draft under your copy rule):
  - `src/lib/persona/share.ts` — archetype hook lines + share text
  - `src/components/quiz/partial-reveal.tsx` + `quiz-gate.tsx` — gate copy
- Merge PR #11 from the GitHub app/mobile site when happy
- Claude is watching the PR and will handle CI failures + review comments

## 3. Phone-friendly — dashboard settings (each ~5 min)

- **Vercel env vars** (Vercel dashboard → Settings → Environment Variables):
  - `NEXT_PUBLIC_GTM_ID` = GTM-WBJQRSNT (code falls back to this, but set it)
  - `UPGRADE_LINK_SECRET` = 32+ random bytes (needs a terminal to generate —
    or use any password generator, 44+ chars)
  - `ACTIVECAMPAIGN_API_URL`, `ACTIVECAMPAIGN_API_KEY`,
    `ACTIVECAMPAIGN_LIST_ID`, `ACTIVECAMPAIGN_FROM_EMAIL`
  - `GEMINI_API_KEY` — marketing engine image generation ("Nano Banana");
    without it the daily marketing-generate cron fails on image pieces.
    Get one at https://aistudio.google.com/apikey
  - (An old `SMS_PROVIDER` var, if set, is now ignored — Twilio is the only
    provider after the Telnyx removal. Safe to delete, harmless to keep.)
- **ActiveCampaign** (their web app): create the list, verify sending domain
  (DKIM records — needs your DNS provider's app/site), then the two AC crons
  start working
- **GTM container** (tagmanager.google.com): add GA4 tags triggered off the
  events per `docs/marketing/gtm-setup.md` — until then events fire but land
  nowhere
- **Stripe dashboard**: enable Smart Retries (the dunning flow assumes it)
- **GitHub**: delete the 7 stale branches listed at the bottom of
  `docs/plans/2026-07-10-merge-sequencing.md` (GitHub mobile can do this)

## 4. Needs a computer — later

- Run `npx tsx scripts/import-quotes.ts` to build the real quote library
  (needs `ANTHROPIC_API_KEY` in env; `--source quotable` avoids ZenQuotes
  attribution requirements). Until then quotes use the 12 seeded fallbacks.
- Feed a book through `scripts/digest-techniques.ts <notes.md>` when you want
  to grow the technique playbook past the 10 seeds.
- Generate `UPGRADE_LINK_SECRET` properly: `openssl rand -base64 32`

## 5. When you're back — worth a look

- **Founder dashboard** now has: Acquisition Funnel (leads → signups →
  onboarded → paid, per source), Technique Playbook, testimonial review,
  intention shifts, simulator (`/dashboard/founder/simulator`), Marketing
  Engine (`/dashboard/founder/marketing`)
- **Try the simulator** before the next real cohort (PR #8's verify step):
  create a preset persona, "Step 1 day", check the per-day "why" drawer,
  run the remaining week, view the end-of-week memory. Note: production
  message generation is byte-identical to before until you explicitly
  "Activate" a new system-prompt version there
- **Marketing engine switches** live in the `marketing_engine_config` table
  (Supabase): `enabled`, weekly piece count, `ads_launch_paused` (paid ads
  additionally always require your review — enforced in code)
- **Set up an AC nurture automation** for quiz leads — they arrive tagged
  `quiz-lead` + `archetype-{slug}`, so a per-archetype welcome sequence is
  pure AC config, no code

## What shipped today (context for future-you)

- All 7 branches + 3 PRs merged to main in dependency order; five colliding
  "018" migrations renumbered to 018–024; a constraint bug fixed that would
  have broken testimonials (`messages_content_type_check` rebuilt without
  `testimonial_request` by two later migrations)
- Public quiz at `/quiz`: 8 taps → partial reveal (free) → email gate →
  full reading → share; server re-scores answers; leads upsert by email
  without clobbering source/consent; share pages now funnel into the quiz
  with attribution
- SEO: sitemap, robots, OG/Twitter cards, default OG image
- `src/config/site.ts`: the brand-config seed for templating future ideas
- Verified: 234 tests, clean build, Playwright walk of the whole quiz flow,
  all GTM events firing

## Deferred / known-open items

- Per-IP rate limiting on `/api/quiz/lead` (has zod + honeypot + idempotent
  upsert; Vercel bot protection recommended as a dashboard toggle)
- Migrating the ~26 remaining hardcoded "Entiremind" strings to `siteConfig`
  (happens opportunistically as files are touched)
- Hourly send cadence honoring `preferred_send_hour` (needs Vercel Pro)
- Marketing engine live platform credentials (Meta/TikTok/YouTube app
  approvals) — adapters stub until env vars are set
