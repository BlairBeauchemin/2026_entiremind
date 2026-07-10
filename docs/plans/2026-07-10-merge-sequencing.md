# Merge Sequencing Plan — July 2026

**Status:** Ready to execute
**Date:** 2026-07-10

Seven active branches and three open PRs are unmerged, and none of them know about each other. Five of them independently claim migration number `018`. This document gives a safe merge order, the exact conflict surface of each step, the migration renumbering, and what to verify after each merge.

**How to use it:** work top to bottom. For each step: rebase the branch onto the latest `main`, resolve the listed conflicts, renumber the migration if the step says so, merge, run the migration in the Supabase SQL editor, then run the verification line. Don't start a step until the previous one is verified.

---

## Current state

| # | Branch / PR | What it is | Migration(s) claimed | Size |
|---|---|---|---|---|
| 1 | `claude/video-transcript-access-2yff0t` | Design-philosophy doc + psychology backlog | none | docs only |
| 2 | `claude/gtm-integration-plan-af2mqu` | GTM/GA4 analytics layer | none | ~440 lines, 18 files |
| 3 | `claude/market-research-feature-gaps-iggbou` | Pricing section, testimonials loop, copy pass, instant first prompt | `018_testimonials` | ~1,000 lines, 17 files |
| 4 | `claude/security-review-validation-qivnr8` | Security fixes, Telnyx removal, value ladder/trial, dunning, weekly recap, one-tap upgrade links, public archetype pages | `018_weekly_recap_silence_recovery`, `019_value_ladder_dunning` | ~3,400 lines, 60 files |
| 5 | PR #8 (`claude/messaging-test-tool-o8u82i`) | Founder messaging simulator + prompt versioning | `018_messaging_simulator` | large |
| 6 | PR #9 (`claude/motivational-quotes-app-review-uzmn14`) | Quote library + ActiveCampaign weekly editions | `018_quotes_and_weekly_editions` | large |
| 7 | PR #10 (`claude/technique-playbook`) | Technique playbook (stacked on PR #9) | `019_techniques` | medium |
| 8 | `claude/content-engine-ads-social-plan-1tyxtn` | Multi-brand marketing content engine | `018_marketing_engine` | ~6,600 lines, 74 files |

Migration renumbering rule: `main` is at `017`. Whoever merges first with a migration keeps the next free number; every later branch renames its migration file during its rebase. Migrations are run manually in the Supabase SQL editor, so **filename order in this table = run order**. Renaming = `git mv` the file + grep the branch for the old filename (PR descriptions and docs may reference it).

---

## Merge order

### Step 1 — `claude/video-transcript-access-2yff0t` (docs only)

- **Why first:** zero risk, and `docs/design-philosophy.md` becomes required reading for everything after it.
- **Conflicts:** none (touches only `docs/` and one README line).
- **Migration:** none.
- **Verify:** `docs/design-philosophy.md` and `docs/prds/2026-07-08-psychology-principles-backlog.md` exist on main.

### Step 2 — `claude/gtm-integration-plan-af2mqu` (analytics)

- **Why second:** no migration, self-contained, and every later branch that touches the landing/checkout surfaces should rebase over the instrumented versions rather than the other way around.
- **Conflicts with main:** none expected (first app-code merge).
- **Migration:** none.
- **Env:** move the hardcoded GTM id to `NEXT_PUBLIC_GTM_ID` in Vercel (the branch reads it from env).
- **Founder follow-up:** configure GA4 (and any ad-platform) tags inside the GTM container per `docs/marketing/gtm-setup.md` — events are inert until then.
- **Verify:** `npm run build`; GTM Preview on the deployed site shows `lead_form_open` → `generate_lead` on a waitlist submit.

### Step 3 — `claude/market-research-feature-gaps-iggbou` (landing + testimonials)

- **Keeps `018_testimonials.sql`** — first migration to land, no rename needed.
- **Conflicts (rebase over step 2):** `src/components/landing/hero.tsx` (GTM branch instrumented the CTA; market-research reworded it — keep both: new copy + `analytics.leadFormOpen` call).
- **Verify:** run migration 018; landing shows pricing + testimonials sections; hero CTA still fires the GTM event; `npm run test:run`.

### Step 4 — `claude/security-review-validation-qivnr8` (security + monetization + share pages)

- **Renumber:** `018_weekly_recap_silence_recovery` → **`019`**, `019_value_ladder_dunning` → **`020`**.
- **Why before the PRs:** it rewrites the SMS webhook and cron routes for security; the simulator and quotes PRs must adapt to the hardened versions, not vice versa.
- **Conflicts (biggest step — expect a real rebase session):**
  - vs step 2: `waitlist-modal-single.tsx`, `waitlist-modal-two-step.tsx`, `reveal-step.tsx`, `settings-subscription.tsx`, `settings/page.tsx`, `package.json` — keep GTM calls AND the new share/attribution/upgrade code side by side.
  - vs step 3: `api/sms/webhook/twilio/route.ts`, `lib/onboarding/actions.ts`, `lib/persona/content.ts`, `lib/sms/types.ts` — merge testimonial-collection hooks with the hardened webhook.
- **Prerequisite:** this branch **removes Telnyx entirely** — confirm `SMS_PROVIDER=twilio` in production and that Telnyx isn't needed as a fallback before merging.
- **Verify:** run migrations 019 + 020; `/archetype/visionary` renders with its OG image and garbage slugs 404; a waitlist submit from `/?src=share-visionary` stores `leads.source='share-visionary'`; webhook signature validation still accepts a real Twilio POST (send a test SMS); full test suite.

### Step 5 — PR #8, messaging simulator

- **Renumber:** `018_messaging_simulator` → **`021`**.
- **Conflicts (rebase over step 4):** `api/cron/daily-send`, `detect-silence`, `weekly-memory`, `api/sms/webhook/twilio`, `lib/ai/memory.ts`, `lib/supabase.ts` — re-apply the simulator's `is_test` exclusions and `asOf` threading on top of the hardened cron/webhook code.
- **Verify:** run migration 021; create a test persona, step one simulated day, confirm no SMS path is reachable (personas have `phone = NULL`); crons still exclude `is_test` users; full test suite.

### Step 6 — PR #9, quote library + ActiveCampaign

- **Renumber:** `018_quotes_and_weekly_editions` → **`022`**.
- **Conflicts (rebase over steps 4–5):** `api/cron/daily-send/route.ts` (three-way: security hardening + simulator `asOf` + quote fast-path), `lib/ai/index.ts`, `lib/ai/types.ts`, `dashboard/page.tsx`, `lib/sms/index.ts`, `vercel.json`.
- **Prerequisites (founder):** ActiveCampaign account with a list created, sending domain DKIM-verified, and Vercel env vars set: `ACTIVECAMPAIGN_API_URL`, `ACTIVECAMPAIGN_API_KEY`, `ACTIVECAMPAIGN_LIST_ID`, `ACTIVECAMPAIGN_FROM_EMAIL`. **Check the cron budget first (see below)** — this adds 2 cron jobs.
- **Post-merge:** run migration 022; run `npx tsx scripts/import-quotes.ts` to build the quote library.
- **Verify:** contact sync cron upserts users + leads into AC (check the AC list); Monday cron creates a **draft** campaign (never auto-sends); quote content type sends a real attributed quote.

### Step 7 — PR #10, technique playbook

- GitHub auto-retargets it to `main` once PR #9 merges; its diff then shows only technique changes.
- **Renumber:** `019_techniques` → **`023`**.
- **Conflicts:** minimal after retarget (it was built on the quotes branch).
- **Verify:** run migration 023; `select name, status, gentle from techniques;` shows 10 seeds; dial `technique_apply_probability` to taste (0 disables).

### Step 8 — `claude/content-engine-ads-social-plan-1tyxtn` (multi-brand marketing engine)

- **Renumber:** `018_marketing_engine` → **`024`**.
- **Why last despite being newest:** it's ~6.6k lines but almost entirely new files — it merges cleanly late, and everything it conflicts on (`dashboard/founder/page.tsx`, `lib/ai/*`, `lib/supabase.ts`, `vercel.json`, `api/founder/intention-shifts`) will have settled by then.
- **Conflicts (rebase over steps 4–7):** `dashboard/founder/page.tsx` (touched by steps 3, 5), `lib/ai/index.ts` / `types.ts` / providers (touched by steps 5, 6), `lib/supabase.ts`, `vercel.json` (merge cron lists), `package.json`.
- **Prerequisite:** cron budget (adds 4 more jobs) and whatever media-gen env vars its README/plan specifies (Gemini/Veo keys).
- **Verify:** run migration 024; founder → Marketing page loads; create a brand + campaign draft; planning/generate crons run with `CRON_SECRET`.

---

## Cron budget (check before steps 6 and 8)

`main` has 4 daily crons. Step 6 adds 2, step 8 adds 4 → **10 total**. The Vercel Hobby plan does not allow this many cron jobs (and CLAUDE.md notes hourly crons are already blocked pending Pro). Options:

1. **Upgrade to Vercel Pro** before step 6 — also unblocks the deferred `preferred_send_hour` feature.
2. Or gate the new vercel.json entries: merge the code but comment the cron entries out until the upgrade, triggering manually via `curl -H "Authorization: Bearer $CRON_SECRET"` in the meantime.

## Stale branches — delete after merging the above

| Branch | Status | Action |
|---|---|---|
| `claude/audit-twilio-approval-B5uI5` | 0 unmerged commits | delete |
| `claude/planning-session-4rzgzc` | 0 unmerged commits (merged as PR #7) | delete |
| `feature/waitlist-modal` | 0 unmerged commits | delete |
| `claude/user-insights-surface` | 2 doc commits whose content (founder-ops playbook, PRD) already landed on main via commit `44d5b66` | delete |
| `claude/plan-stripe-integration-eTRKP` | Feb planning branch; Stripe integration long since shipped | delete |
| `claude/add-login-button-VdWSo` | Feb branch; its features (SMS abstraction, privacy/terms, login nav) all exist on main via later work | delete |
| `claude/inspirational-text-script-pOSXk` | one 109-line SMS test script | cherry-pick `55a8f36` if you still want the script, then delete |

## After all merges

- `main` is at migration **024**; the next feature migration is **025**.
- Kick off Phase B of `docs/plans/…` (this session's approved plan): site config + SEO plumbing, the public `/quiz` with the behavioral email gate, and the founder conversion funnel — all verified to exist on no current branch.
- New quiz leads will flow into ActiveCampaign via PR #9's sync with archetype tags; build the nurture automation in AC, not in code.
