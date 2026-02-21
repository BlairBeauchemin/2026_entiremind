# Waitlist Modal Design

**Date:** 2026-02-21
**Status:** Approved
**Purpose:** Convert landing page inline forms to a modal-based waitlist capture flow for pre-launch paid traffic campaigns.

## Overview

Replace the current inline lead capture forms with a two-step modal triggered by CTA buttons. This supports conversion tracking for paid traffic and collects name, email, phone, and SMS consent.

## User Flow

1. User clicks "Reserve My Spot" (hero/pricing) or "Join Waitlist" (nav)
2. Modal opens with dark overlay
3. **Step 1:** User enters name and email, clicks "Continue"
4. **Step 2:** User enters phone, checks SMS consent, clicks "Reserve My Spot"
5. Form submits to `/api/leads`
6. User redirects to `/thank-you` page (conversion tracking fires here)

## Modal Component

### Trigger Points

| Location | Button Text | Style |
|----------|-------------|-------|
| Hero section | "Reserve My Spot" | Primary navy button |
| Pricing section | "Reserve My Spot" | Primary navy button |
| Navigation | "Join Waitlist" | Compact navy button |

### Visual Design

- **Overlay:** Dark semi-transparent scrim, click outside closes modal
- **Modal:** White/light background, soft shadow, centered
- **Close button:** X in top-right corner
- **Animation:** Framer Motion fade-in overlay, scale-up modal
- **Step transition:** Inline crossfade, modal size stays consistent

### Step 1: Identity

- **Heading:** "Join the Waitlist"
- **Subheading:** "Be first to experience manifestation at the speed of thought."
- **Fields:**
  - Name (text, required)
  - Email (email, required)
- **Button:** "Continue"
- **Progress:** Two dots, first filled

### Step 2: Phone + Consent

- **Fields:**
  - Phone number (tel, required)
- **Checkbox (required):**
  - "I agree to receive up to 14 SMS messages per week from Entiremind. Message and data rates may apply. Reply STOP to cancel."
  - Links to: Privacy Policy, Terms of Service, SMS Policy
- **Button:** "Reserve My Spot"
- **Progress:** Two dots, second filled

## Thank-You Page

**URL:** `/thank-you`

- Same page wrapper as legal pages (nav, footer, background)
- Centered content:
  - Checkmark icon
  - Heading: "You're on the list"
  - Subheading: "We'll text you when it's your turn to begin the loop."
- Clean URL for conversion pixel firing (Meta, Google, etc.)
- Minimal — no additional asks or forms

## API Changes

### POST `/api/leads`

**Current payload:**
```json
{
  "email": "string",
  "phone": "string"
}
```

**Updated payload:**
```json
{
  "name": "string",
  "email": "string",
  "phone": "string"
}
```

All fields required. Validate server-side.

## Database Changes

- Add `name` column to `leads` table (text, not null)
- Or verify column exists and update constraints

## Files to Create

| File | Purpose |
|------|---------|
| `src/components/landing/waitlist-modal.tsx` | Two-step modal component |
| `src/app/thank-you/page.tsx` | Thank-you/conversion page |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/landing/hero.tsx` | Replace inline form with CTA button, add modal |
| `src/components/landing/pricing.tsx` | Replace inline form with CTA button, add modal |
| `src/components/landing/navigation.tsx` | Add "Join Waitlist" button |
| `src/app/api/leads/route.ts` | Accept and validate `name` field |

## Files to Remove

| File | Reason |
|------|--------|
| `src/components/landing/lead-capture-form.tsx` | No longer used after migration |

## Success Criteria

- [ ] Modal opens from all three trigger points
- [ ] Two-step flow works with validation
- [ ] Form submits to `/api/leads` with all fields
- [ ] Redirect to `/thank-you` on success
- [ ] Conversion tracking can fire on thank-you page
- [ ] Mobile responsive
- [ ] Matches brand aesthetic (calm, clean, lightly magical)
