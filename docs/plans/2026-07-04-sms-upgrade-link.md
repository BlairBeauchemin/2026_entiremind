# One-Tap Upgrade Link in SMS — Implementation Plan

**Date:** 2026-07-04
**Follows:** `docs/plans/2026-07-04-monetization-growth.md` (Part A shipped;
this removes its known friction point)

---

## Problem

The trial-end and follow-up SMS link to `/dashboard/settings`, which requires
an authenticated session. An SMS click opens a cold mobile browser: the user
hits the auth wall, waits for a magic-link email, switches apps, and comes
back — five steps of friction at the exact moment they've decided to pay.
The dunning texts ("update your card") have the identical problem.

## Goal

Tap the link in the SMS → land on Stripe Checkout (or the billing portal for
dunning) with everything prefilled. **No sign-in.** The link must be safe to
sit in an SMS inbox: it can only ever start a payment flow for that one user
— it is never a login.

---

## Design

### Token: purpose-bound, signed, stateless

`base64url(payload) + "." + base64url(HMAC-SHA256(secret, payload))`

- **payload**: `{ uid, intent, exp }` — user id, `"upgrade" | "billing"`,
  unix expiry.
- **secret**: new env var `UPGRADE_LINK_SECRET` (32+ random bytes; Vercel +
  `.env.local`). Dedicated secret — never reuse CRON_SECRET or Supabase keys.
- **expiry**: 60 days. Long enough that the follow-up's "whenever you're
  ready" stays true; bounded so a leaked old message eventually goes dead.
- **Stateless by design** — no token table, no cleanup cron. Verification is
  `crypto.timingSafeEqual` on the recomputed HMAC. Brute force is infeasible
  (256-bit MAC); revocation isn't needed because of the narrow scope below.

**What a stolen token can do** (threat model, documented in code): open a
plan-choice page and start a Stripe Checkout/portal session *for that user*.
It exposes no message history, no memory, no dashboard. The Stripe surfaces
show the user's email — the one PII leak — which is why the token expires
and why intent `billing` requires the subscription to actually be past_due.
Accepted tradeoff: the token is at rest in our `messages` table (RLS: own
rows + admins) and at Twilio, same as any link we text.

### Flow: `GET /u/[token]` (public page, no auth)

1. Verify signature + expiry. Invalid/expired → redirect to
   `/auth?next=/dashboard/settings` (the old path still works as fallback).
2. Load user + subscription (service role).
3. **intent=upgrade**:
   - Already `paid` → redirect to `/dashboard/settings` (no double-subscribe).
   - Otherwise render a minimal public interstitial in the brand style:
     "Welcome back, {first name}" + two buttons (Monthly / Yearly with
     prices) + quiet trust line. Two taps total from SMS, zero sign-in.
     Buttons POST `{ token, plan }` to `/api/upgrade-checkout`.
4. **intent=billing** (dunning links, milestone 2):
   - Subscription has a `stripe_customer_id` → create a billing-portal
     session server-side and 302 straight to it (true one-tap; the portal
     is Stripe-hosted and handles its own verification).
   - No customer → fall back to `/auth`.

Why an interstitial instead of 302-to-checkout: plan choice (monthly vs
yearly) has to live somewhere, Stripe Checkout can't switch plans inline,
and the page gives expired tokens and edge cases a graceful landing. The
cost is one extra tap; the yearly option pays for it.

### `POST /api/upgrade-checkout`

- Body: `{ token, plan }`. Re-verify the token server-side (never trust the
  page); validate plan against `PlanType`.
- Create the Checkout session exactly as `/api/checkout` does today
  (existing customer or create; `metadata.supabase_user_id`; price id via
  `getPriceId`). Add `metadata.source = "sms-upgrade-link"` so conversion
  from SMS is measurable in Stripe and in the webhook.
- **Refactor**: extract the session-creation body of `/api/checkout` into
  `src/lib/billing/checkout.ts#createCheckoutSessionForUser(userId, plan,
  opts)`; both routes call it. No behavior change for the dashboard path.
- `success_url`: `/welcome-back` (new tiny public page: "You're in — your
  messages resume tomorrow morning", plus a sign-in link for the dashboard).
  Fulfillment needs no browser session — the existing webhook activates the
  subscription from metadata, and the next daily-send sees `paid`.
- `cancel_url`: back to `/u/[token]` so they can pick the other plan.

### Wiring into the messages

- `src/lib/billing/token.ts` — `signUpgradeToken()`, `verifyUpgradeToken()`.
- `buildTrialEndMessage` / `buildUpgradeFollowupMessage` take a `link`
  parameter; daily-send signs a token per expired user at send time and
  passes `https://www.entiremind.com/u/{token}`.
- Milestone 2: `buildPaymentFailedMessage` gets the same treatment with
  intent `billing` (14-day expiry — dunning is time-boxed by the retry
  cycle).
- URL length ~90 chars — fine for SMS; no shortener needed at this scale.

---

## Milestones

1. **Token lib + upgrade path** — token.ts, `/u/[token]` page,
   `/api/upgrade-checkout`, checkout refactor, `/welcome-back`, message
   builders + daily-send wiring, `UPGRADE_LINK_SECRET` in envs.
2. **Dunning links** — intent `billing`, portal 302, dunning message update.
3. **Metrics pass (optional)** — surface `source=sms-upgrade-link`
   conversions on the founder dashboard next to the trial cohort funnel.

## Testing

- **Unit**: round-trip sign/verify; tampered payload rejected; tampered
  signature rejected; expired rejected; wrong-intent rejected; timing-safe
  compare used.
- **Integration (Stripe test mode)**: token → interstitial → checkout
  session created with correct customer/metadata; already-paid redirect;
  cancel_url round-trip.
- **Live-drive** (as with Parts A–C): boot the prod build, walk
  valid/expired/garbage tokens, assert no auth cookie is ever set by any
  `/u/*` response.
- **Security checks**: `/u/[token]` sets `Cache-Control: no-store` and
  `X-Robots-Tag: noindex`; token never appears in server logs (log a
  truncated prefix only); interstitial shows first name only.

## Effort

Milestone 1 is one focused session; milestone 2 is small (an hour-ish);
milestone 3 whenever the founder dashboard next gets touched.

## Open questions

1. Interstitial vs straight-to-monthly-checkout (recommend interstitial —
   yearly choice + graceful fallbacks; see Design).
2. 60-day token expiry OK? Shorter is safer, longer keeps the follow-up's
   promise honest.
3. Should the interstitial show the two prices inline (needs price copy in
   code — Stripe price IDs don't carry display strings)? Recommend yes,
   hardcoded next to the existing plan copy in settings.
