# GTM Setup Guide — Paid Acquisition Tracking

How to configure the Google Tag Manager container so GA4, Google Ads, Meta
(Facebook/Instagram), and TikTok all track the Entiremind conversion funnel.

**The code side is already done.** The app loads GTM from the
`NEXT_PUBLIC_GTM_ID` env var and pushes typed dataLayer events at every
funnel step (see `src/lib/analytics.ts`). Everything in this guide happens in
the **GTM web UI** (tagmanager.google.com) — no deploys needed to add or
change pixels.

---

## 1. IDs you need (placeholders until you have real ones)

| What | Looks like | Where to get it | Where it goes |
|---|---|---|---|
| GTM container | `GTM-XXXXXXX` | tagmanager.google.com → create container (Web) | `NEXT_PUBLIC_GTM_ID` env var (code — the only ID in code) |
| GA4 Measurement ID | `G-XXXXXXXXXX` | analytics.google.com → Admin → Data Streams → Web | GTM: Google Tag |
| Google Ads Conversion ID | `AW-XXXXXXXXX` | ads.google.com → Goals → Conversions → new conversion action | GTM: conversion + remarketing tags |
| Google Ads conversion labels | one per conversion action | shown when you create each conversion action | GTM: each Ads conversion tag |
| Meta Pixel ID | `XXXXXXXXXXXXXXX` (15–16 digits) | business.facebook.com → Events Manager → Data Sources | GTM: Custom HTML tags |
| TikTok Pixel ID | `XXXXXXXXXXXXXXXXXX` | ads.tiktok.com → Assets → Events → Web Events | GTM: Custom HTML tags |

### Env var setup

```bash
# .env.local
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
```

Also set it in the Vercel dashboard (Project → Settings → Environment
Variables) for **Production and Preview**, then redeploy. When the var is
unset, GTM does not load at all — keep it unset locally unless you're testing
tags.

---

## 2. Events the site sends (already live in code)

| dataLayer event | Fires when | Parameters |
|---|---|---|
| `lead_form_open` | Landing CTA opens the waitlist modal | `cta_location` (nav / hero / bottom_cta) |
| `generate_lead` | Waitlist form submitted OK (then user lands on `/thank-you`) | `lead_source`, `modal_version`, `currency`, `value: 0` |
| `sign_up` | First visit to `/onboarding` after auth (once per session) | `method` |
| `onboarding_complete` | Onboarding finished, welcome SMS queued | — |
| `begin_checkout` | Upgrade clicked, redirecting to Stripe | `currency`, `value`, `items[]` |
| `purchase` | Back from Stripe with `?success=true` (deduped: fires once, URL param stripped) | `transaction_id`, `currency`, `value`, `items[]` |

Purchase values are the placeholder prices in `src/lib/analytics.ts`
(`PLAN_VALUES`) — **update those when pricing is final.**

---

## 3. GTM Variables to create

**Data Layer Variables** (Variables → New → Data Layer Variable), named
exactly after the key: `value`, `currency`, `transaction_id`, `items`,
`cta_location`, `lead_source`, `modal_version`, `method`.

**Constants** (Variables → New → Constant) so you paste each platform ID
once: `GA4 Measurement ID`, `Ads Conversion ID`, `Meta Pixel ID`,
`TikTok Pixel ID`.

---

## 4. Triggers to create

**Custom Event triggers** (Triggers → New → Custom Event), event name must
match exactly: `lead_form_open`, `generate_lead`, `sign_up`,
`onboarding_complete`, `begin_checkout`, `purchase`.

**History Change trigger** (built-in type): fires page_views on soft
navigations — this is a Next.js single-page app, so without it you only get
the first page_view. (If you instead enable GA4 Enhanced Measurement's
"Page changes based on browser history events", skip this — pick one, not
both.)

**Optional — Page View trigger on `/thank-you`** (Page Path equals
`/thank-you`): a URL-based alternative for the lead conversion. ⚠️ Per
platform, use **either** the `generate_lead` event trigger **or** the
`/thank-you` page trigger — never both, or you'll double-count leads.
Recommended: event-based.

---

## 5. Tags per platform

### Google Analytics 4
1. **Google Tag** (tag type: Google Tag), Tag ID = GA4 Measurement ID
   constant. Trigger: All Pages + History Change.
2. **GA4 Event tags** (tag type: Google Analytics: GA4 Event) — one per
   custom event, event name matching the dataLayer event, forwarding the
   relevant parameters (`value`, `currency`, `transaction_id`, `items`,
   `cta_location`, …). GA4 automatically dedupes purchases on
   `transaction_id`.

### Google Ads
1. **Conversion Linker** tag — trigger: All Pages (required for accurate
   conversion attribution).
2. **Conversion tags** (Google Ads Conversion Tracking), one per conversion
   action you created in Ads:
   - "Waitlist Lead" → trigger `generate_lead`
   - "Purchase" → trigger `purchase`, with Conversion Value = `{{value}}`,
     Currency = `{{currency}}`, Transaction ID = `{{transaction_id}}`
   - Optional secondary: "Onboarding Complete" → trigger
     `onboarding_complete`
3. **Remarketing tag** — trigger: All Pages (enables audience building).

### Meta (Facebook/Instagram) Pixel
GTM has no native Meta template, so use **Custom HTML** tags:
1. **Base pixel** — the standard `fbq('init', '{{Meta Pixel ID}}'); fbq('track', 'PageView');`
   snippet from Events Manager. Trigger: All Pages + History Change.
2. **Event tags** (each fires the matching Custom Event trigger, with tag
   sequencing set to fire the base pixel first):
   - `generate_lead` → `fbq('track', 'Lead');`
   - `sign_up` → `fbq('track', 'CompleteRegistration');`
   - `begin_checkout` → `fbq('track', 'InitiateCheckout', {value: {{value}}, currency: '{{currency}}'});`
   - `purchase` → `fbq('track', 'Purchase', {value: {{value}}, currency: '{{currency}}'}, {eventID: '{{transaction_id}}'});`

   The `eventID` on Purchase enables dedup if you later add the Conversions
   API (server-side).

### TikTok Pixel
Also **Custom HTML** (or the TikTok template from the Community Template
Gallery):
1. **Base pixel** — `ttq.load('{{TikTok Pixel ID}}')` snippet from TikTok
   Events Manager. Trigger: All Pages + History Change.
2. **Event tags**:
   - `generate_lead` → `ttq.track('SubmitForm');`
   - `sign_up` → `ttq.track('CompleteRegistration');`
   - `begin_checkout` → `ttq.track('InitiateCheckout', {value: {{value}}, currency: '{{currency}}'});`
   - `purchase` → `ttq.track('CompletePayment', {value: {{value}}, currency: '{{currency}}'});`

---

## 6. Validation checklist

1. **GTM Preview** (Tag Assistant): connect to the site, then walk the
   funnel and confirm each event appears with its parameters and the right
   tags fire:
   - Load landing page → container + All Pages tags
   - Navigate between pages → History Change page_views
   - Open waitlist modal → `lead_form_open`
   - Submit waitlist → `generate_lead`, then `/thank-you` loads
   - Sign in and land on `/onboarding` → `sign_up`
   - Finish onboarding → `onboarding_complete`
   - Click Upgrade → `begin_checkout`
   - Return to `/dashboard/settings?success=true` → `purchase` fires
     **once**, the URL param disappears, and a refresh does **not** re-fire it
2. **GA4 DebugView** (Admin → DebugView) shows the mapped events live.
3. **Meta Pixel Helper** browser extension + Events Manager → Test Events.
4. **TikTok Pixel Helper** browser extension.
5. Publish the GTM container (Submit → Publish) — Preview mode changes are
   not live until published.

---

## 7. Future work (deliberately not done yet)

- **Consent Mode v2 + cookie banner** — REQUIRED before running any EU/UK
  traffic. Currently GTM loads unconditionally (US-only traffic assumption).
- **Real plan prices** in `PLAN_VALUES` (`src/lib/analytics.ts`) — currently
  placeholder $29 / $199.
- **True transaction ID**: append `session_id={CHECKOUT_SESSION_ID}` to the
  `success_url` in `src/app/api/checkout/route.ts` and pass it through
  `PurchaseTracker` instead of falling back to a timestamp when the Stripe
  webhook hasn't landed yet.
- **Server-side events**: Meta Conversions API and TikTok Events API for
  resilience against ad blockers / iOS; the Purchase `eventID` is already
  wired for Meta dedup.
- **Server-side GTM** if volume ever justifies it.
