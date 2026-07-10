# Monetization & Growth — Implementation Plan

**Branch:** `claude/security-review-validation-qivnr8` (planning); implementation on feature branches per part
**Date:** 2026-07-04
**Scope:** Three features from the July 2026 roadmap review:

- **Part A** — Free/paid value ladder (trial → personalized paywall)
- **Part B** — Dunning for failed payments
- **Part C** — Shareable archetype results

Recommended build order: **B → A → C**. B is the smallest and recovers real
revenue from day one. A needs a pricing/packaging decision (open questions
below) but is the conversion engine. C is growth and can ship independently.

---

## Current state (what these build on)

- `subscriptions` table exists per user (plan: free/monthly/yearly; status
  includes `trialing` and `past_due`) with Stripe checkout, webhook, and
  billing-portal routes working.
- **Nothing is gated by plan today.** `daily-send` sends to every active,
  onboarded user regardless of subscription — payment is currently a tip jar.
- `invoice.payment_failed` sets `status='past_due'` and stops.
  `customer.subscription.deleted` reverts to free. The user is never told.
- Archetypes (visionary / alchemist / seeker / phoenix) have display names +
  personalized paragraphs in `src/lib/persona/content.ts`, revealed at the
  end of onboarding (`reveal-step.tsx`) and never seen again.
- `user_memory` holds each user's themes/vision/obstacles — the raw material
  for a personalized upgrade pitch no competitor can copy.

---

## Part B — Dunning for failed payments (build first)

**Goal:** a paying user whose card fails finds out by SMS within minutes and
can fix it in two taps. Involuntary churn is typically 20–40% of SaaS churn;
recovery here is mechanical.

### B1. Stripe dashboard configuration (no code)
- Enable **Smart Retries** (Billing → Revenue recovery): 3–4 retries over
  ~2 weeks, then cancel the subscription. The final cancellation arrives as
  `customer.subscription.deleted`, which we already handle.

### B2. Schema (migration 019)
```sql
ALTER TABLE subscriptions ADD COLUMN dunning_notified_at TIMESTAMPTZ;
ALTER TABLE messages DROP CONSTRAINT messages_content_type_check;
-- re-add with 'billing' included
```
`content_type='billing'` keeps dunning texts out of reply-rate math
(exclude from the lists in `src/lib/signals/compute.ts` and
`storeInboundSms` linking — i.e., just don't add it to them) and out of the
"already sent today" suppression? **No — it should suppress nothing and be
suppressed by nothing**: billing notices must send even on a day the user
already got a prompt, so the daily-send suppression query gains
`content_type.neq.billing` alongside the existing ack exclusion.

### B3. Webhook changes (`src/app/api/webhooks/stripe/route.ts`)
- **`invoice.payment_failed`**: after setting `past_due`, look up the user's
  phone + name via `user_id`, and send one SMS
  (`content_type='billing'`):
  > "{Name}, your Entiremind payment didn't go through — usually just an
  > expired card. You can update it in a minute here:
  > https://www.entiremind.com/dashboard/settings — your messages continue
  > in the meantime."
  - Throttle: skip if `dunning_notified_at` is within the last 5 days
    (Stripe fires this event on every retry; 2 texts max across the cycle).
  - Set `dunning_notified_at = now()` after a successful send.
- **`customer.subscription.updated` → status returns to `active`**: clear
  `dunning_notified_at`. (Recovery confirmation SMS: optional, skip for v1 —
  the resumed silence is the confirmation.)
- **`customer.subscription.deleted`**: existing free-plan revert stays; add a
  final SMS:
  > "Your Entiremind subscription has ended. Your reflections and history are
  > saved. Whenever you want to pick the daily practice back up:
  > https://www.entiremind.com/dashboard/settings"
  After Part A ships, this event also flips the user out of entitlement
  automatically (same gate), so no extra logic is needed here.

### B4. Grace policy
`past_due` users keep receiving daily messages through the whole retry
window (they've paid before; cutting them off mid-retry maximizes churn).
Entitlement (Part A) treats `past_due` as entitled; only `deleted` ends it.

### B5. Testing
- Unit: dunning throttle decision (pure function: last notice date + event →
  send/skip).
- Manual: Stripe CLI `stripe trigger invoice.payment_failed` against a dev
  webhook; verify SMS row + `dunning_notified_at`; verify second trigger
  within 5 days sends nothing.

**Estimate:** one short session. No new routes, one migration, one webhook
file, message templates in a small `src/lib/billing/dunning.ts`.

---

## Part A — Free/paid value ladder

**Goal:** every new user gets the full experience for a trial window, then
the daily loop pauses behind a personalized upgrade moment built from their
own memory blob. Payment stops being a tip jar and becomes the price of
continuing a relationship that has already demonstrated value.

### A1. Packaging decision (founder input needed — see Open Questions)
Recommended v1:
- **Trial:** 10 days of the full experience from onboarding completion
  (long enough to hit a weekly recap — the single strongest "it knows me"
  moment — for anyone who onboards Tue–Sun).
- **Free after trial:** inbound always listened to and acked (we never go
  deaf); weekly recap kept? **No — recap is the crown jewel; it goes paid.**
  Free = the relationship is paused, not deleted. Dashboard stays accessible.
- **Paid:** daily prompts, recaps, silence-recovery, intention tracking —
  i.e., everything that exists today.

### A2. Schema (same migration 019)
```sql
ALTER TABLE subscriptions ADD COLUMN trial_ends_at TIMESTAMPTZ;
-- Backfill existing users generously: now() + 14 days, so nobody who
-- onboarded pre-launch gets cut off without a trial-end moment.
UPDATE subscriptions SET trial_ends_at = now() + interval '14 days'
  WHERE plan = 'free' AND trial_ends_at IS NULL;
ALTER TABLE messages ... -- add 'upgrade' to content_type CHECK
```
`trial_ends_at` is set to `now() + 10 days` in `completeFullOnboarding`
(`src/lib/onboarding/actions.ts`) — trial starts at onboarding completion,
not signup, so a stalled signup doesn't burn trial days.

### A3. Entitlement helper (`src/lib/billing/entitlement.ts`)
One pure function used everywhere, service-role loader beside it:
```ts
type Entitlement = "paid" | "trial" | "expired";
function computeEntitlement(sub: {
  plan: string; status: string; trial_ends_at: string | null;
}, now: Date): Entitlement
```
- `plan` monthly/yearly with status `active`/`trialing`/`past_due` → `paid`
- else `trial_ends_at` in the future → `trial`
- else → `expired`
Founder/admin roles bypass (always `paid`).

### A4. Gating in `daily-send`
After the already-sent check, before silence recovery:
- `expired` users: skip prompt. If no `upgrade` message has been sent since
  `trial_ends_at`: generate the **personalized trial-end message** (Haiku,
  from `user_memory` — themes + vision + one open thread) with a checkout
  link, `content_type='upgrade'`:
  > "{Name}, our ten days are up. You've told me about {theme} and where
  > you're headed — I'd like to keep walking with you. Continue here:
  > {link}"
  One follow-up 7 days later (same check pattern as reconnect: an `upgrade`
  outbound newer than `trial_ends_at`, count < 2). Then quiet.
- Silence-recovery and recap paths also sit behind the gate (expired users
  get neither — they get the upgrade path only). Enrichment + acks on
  inbound remain for everyone.
- Checkout link: `https://www.entiremind.com/dashboard/settings` for v1
  (already authenticated + has upgrade buttons). A tokenized one-tap Stripe
  Checkout link is a fast-follow, not v1.

### A5. Trial-end timing nuance
The gate flips at the first daily-send after `trial_ends_at` — no separate
cron. `trialing` Stripe status is unrelated to our app trial (we don't use
Stripe trials; the card is only entered at conversion).

### A6. Dashboard surfaces
- `settings-subscription.tsx` + sidebar plan badge: show "Trial — N days
  left" from `trial_ends_at` (`Entitlement` exposed via the existing
  subscription context).
- Trial-end banner on `/dashboard` when `expired`: same copy as the SMS,
  upgrade button.

### A7. Signals & metrics
- `upgrade` content type excluded from reply-rate denominators; replies to
  it linked (a reply to the paywall message is a hot lead — surface on
  founder dashboard).
- Founder dashboard additions (later milestone): trial cohort funnel —
  onboarded → day-10 reached → upgraded / expired-silent.

### A8. Testing
- Unit: `computeEntitlement` matrix (plan × status × trial date), upgrade
  follow-up throttle.
- Integration: daily-send with a mixed user set (paid / mid-trial / just
  expired / expired-with-1-upgrade-sent / expired-quiet).
- Manual: fake user with `trial_ends_at = yesterday`, run cron locally,
  verify upgrade SMS + no prompt.

**Estimate:** 1–2 sessions. Riskiest piece is copy/tone of the trial-end
message — draft 3 variants, founder picks.

---

## Part C — Shareable archetype results

**Goal:** the archetype reveal becomes a public artifact people share,
feeding top-of-funnel with warm traffic (each share lowers blended CAC for
the Phase 2 paid-traffic plan).

### C1. Public archetype pages — `/archetype/[slug]`
- Four static pages (visionary, alchemist, seeker, phoenix), statically
  generated (`generateStaticParams`), **zero user data** — content comes
  from `ARCHETYPE_NAMES` + a public-safe variant of the archetype paragraphs
  (the personalized fill-ins replaced with universal copy; new
  `ARCHETYPE_PUBLIC_DESCRIPTIONS` in `src/lib/persona/content.ts`).
- Page = archetype card (name, essence line, 3 traits, "how you move toward
  what you want") in the lightly-magical visual language + CTA: "Discover
  your archetype" → `/onboarding?src=share-{slug}`.
- No index page; slugs validated against `ARCHETYPES`, 404 otherwise.

### C2. OG images
- `opengraph-image.tsx` per slug via `next/og` `ImageResponse`: archetype
  name over the theme palette (dark teal #204147 / soft purple #cbbbe3 /
  warm yellow #f9d97a). This is what actually gets shared — design effort
  goes here, not the page.

### C3. Share affordances
- `reveal-step.tsx`: "Share your archetype" button — native share sheet
  (`navigator.share`) with copy-link fallback; shares
  `https://www.entiremind.com/archetype/{slug}`. Never includes quiz
  answers or any personal data.
- Dashboard: small archetype card (users who completed the quiz) with the
  same share button — existing users share too, not just new ones.

### C4. Attribution
- `?src=share-{slug}` propagates through the landing → waitlist/onboarding
  flow into `leads.source` (leads API already stores `source`; extend the
  waitlist modal + onboarding entry to read the param from the URL).
- Metric: signups with `source LIKE 'share-%'` — visible on founder
  dashboard later; queryable in Supabase immediately.

### C5. Testing
- Static generation of all 4 slugs + 404 for garbage slugs.
- OG image renders (build-time check) and validates in the socialsharepreview
  checkers.
- Share URL contains no PII (assert page HTML has no user-derived strings).

**Estimate:** one session, mostly design. No schema changes, no new deps
(`next/og` is built into Next).

---

## Sequencing & dependencies

```
Part B (dunning)          ── independent, ship first
Part A (value ladder)     ── shares migration 019 with B; gate logic
                             depends on nothing from B but B's grace policy
                             (past_due = entitled) is defined by A's helper
Part C (share pages)      ── fully independent, can parallel A
```
One migration (019) covers A + B: `trial_ends_at`, `dunning_notified_at`,
content_type CHECK extended with `'billing'` and `'upgrade'`.

## Open questions (founder decisions before Part A implementation)

1. **Trial length** — plan assumes 10 days. Alternatives: 7 (faster signal,
   may miss the first weekly recap) or 14 (safer, slower revenue signal).
2. **Free tier after trial** — plan assumes acks-only (relationship paused).
   Alternative: keep 1 message/week free as a persistent hook. Recommend
   against for v1: it blunts the upgrade moment and doubles the gate logic.
3. **Trial-end message tone** — warm-personal (recommended, drafted above)
   vs. neutral-transactional. Needs founder read on brand risk of the AI
   "asking to be paid."
4. **Existing users** — plan grandfathers them into a fresh 14-day trial at
   migration time. Confirm before running 019 in production.
5. **Pricing display on archetype pages** — none in v1 (pages sell the quiz,
   not the subscription). Confirm.
