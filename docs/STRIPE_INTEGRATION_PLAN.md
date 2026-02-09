# Stripe Integration Plan

## Overview

Add Stripe subscription billing to Entiremind so users can upgrade from the free pretotype tier to a paid plan. The integration uses Stripe Checkout (hosted payment page) and Stripe Customer Portal (self-service billing management), keeping implementation lean and secure.

**Guiding principle:** Payment is a behavioral signal. We track subscription events as signals alongside SMS engagement data, not just as billing state.

---

## Current State

### What exists
- `Subscription` TypeScript type in `src/lib/types.ts` (plans: free/monthly/yearly)
- `SettingsSubscription` component in `src/components/dashboard/settings-subscription.tsx` (renders plan card, uses mock data)
- Settings page passes `mockSubscription` to the component (`src/app/dashboard/settings/page.tsx:33`)
- `users.status` field in the database (active/paused/cancelled)
- Landing page pricing section shows $0/month with lead capture form (`src/components/landing/pricing.tsx`)
- Dashboard sidebar shows hardcoded "Free Plan" badge

### What's missing
- `subscriptions` database table
- Stripe SDK dependencies
- Environment variables for Stripe keys
- API routes for checkout, webhooks, and subscription management
- Real subscription data flowing to the UI
- Stripe Customer Portal configuration

---

## Implementation Steps

### Step 1: Database — Create `subscriptions` table

**File:** `supabase/migrations/003_subscriptions.sql`

```sql
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'past_due', 'trialing')),
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);
CREATE INDEX idx_subscriptions_stripe_subscription_id ON subscriptions(stripe_subscription_id);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage subscriptions" ON subscriptions
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Auto-update timestamp trigger
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create free subscription on user signup
CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_created_subscription
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_subscription();
```

Also update `supabase/schema.sql` with the table definition and update `src/lib/supabase.ts` to add `subscriptions` to the `Database` type.

---

### Step 2: Install dependencies & set environment variables

**Dependencies:**
```bash
npm install stripe
```

Note: We do NOT need `@stripe/react-stripe-js` or `@stripe/stripe-js` because we're using Stripe Checkout (hosted page) rather than embedded Elements. This keeps the bundle smaller and avoids PCI scope.

**Environment variables** (add to `.env.local`):
```
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**File:** `src/lib/stripe.ts` — Stripe server client
```typescript
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-01-27.acacia",
  typescript: true,
});
```

---

### Step 3: Stripe product/price setup

Configure in Stripe Dashboard (not code):
- **Product:** "Entiremind Subscription"
- **Price (Monthly):** e.g. $9.99/month, recurring
- **Price (Yearly):** e.g. $89.99/year, recurring

Store Price IDs as environment variables:
```
STRIPE_MONTHLY_PRICE_ID=price_...
STRIPE_YEARLY_PRICE_ID=price_...
```

---

### Step 4: API route — Create Checkout Session

**File:** `src/app/api/checkout/route.ts`

Flow:
1. Authenticate the user (via Supabase server client)
2. Look up or create a Stripe customer for this user
3. Store `stripe_customer_id` in the `subscriptions` table
4. Create a Stripe Checkout Session with:
   - `mode: "subscription"`
   - `customer`: the Stripe customer ID
   - `line_items`: the selected price ID
   - `success_url`: `/dashboard/settings?checkout=success`
   - `cancel_url`: `/dashboard/settings?checkout=cancelled`
   - `metadata`: `{ user_id, supabase_user_id }` for webhook correlation
5. Return the checkout session URL

```typescript
// Pseudocode
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { priceId } = await request.json();

  // Get or create Stripe customer
  let { data: subscription } = await supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", user.id)
    .single();

  let customerId = subscription?.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;
    await supabase
      .from("subscriptions")
      .update({ stripe_customer_id: customerId })
      .eq("user_id", user.id);
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${origin}/dashboard/settings?checkout=success`,
    cancel_url: `${origin}/dashboard/settings?checkout=cancelled`,
    metadata: { supabase_user_id: user.id },
  });

  return Response.json({ url: session.url });
}
```

---

### Step 5: API route — Stripe Webhook Handler

**File:** `src/app/api/webhooks/stripe/route.ts`

This is the most critical piece. Stripe sends events here when subscription state changes.

**Events to handle:**

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Set `stripe_subscription_id`, update plan to monthly/yearly, status to active |
| `customer.subscription.updated` | Sync status, `current_period_end`, `cancel_at_period_end` |
| `customer.subscription.deleted` | Set plan to free, status to cancelled |
| `invoice.payment_failed` | Set status to `past_due` |

```typescript
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response("Invalid signature", { status: 400 });
  }

  // Use service role client (webhook has no user session)
  const supabase = createServiceRoleClient();

  switch (event.type) {
    case "checkout.session.completed": { /* update subscription record */ }
    case "customer.subscription.updated": { /* sync status changes */ }
    case "customer.subscription.deleted": { /* revert to free */ }
    case "invoice.payment_failed": { /* mark past_due */ }
  }

  return Response.json({ received: true });
}
```

**Important:** The webhook route must read the raw request body (not parsed JSON) for signature verification. Next.js App Router `request.text()` handles this correctly.

---

### Step 6: API route — Customer Portal Session

**File:** `src/app/api/billing-portal/route.ts`

Stripe Customer Portal lets users manage their subscription (update payment method, cancel, switch plans) without us building custom UI.

```typescript
export async function POST() {
  // Authenticate user, get stripe_customer_id from subscriptions table
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/dashboard/settings`,
  });
  return Response.json({ url: portalSession.url });
}
```

Configure the Customer Portal in Stripe Dashboard to allow:
- Cancel subscription
- Switch between monthly/yearly
- Update payment method

---

### Step 7: Server action — Fetch subscription data

**File:** `src/lib/subscription/actions.ts`

```typescript
"use server";

export async function getSubscription() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return data;
}
```

---

### Step 8: Update Settings page to use real data

**File:** `src/app/dashboard/settings/page.tsx`

Replace `mockSubscription` with a real database query:

```typescript
// Remove: import { mockSubscription } from "@/lib/mock-data";

// Add: fetch subscription from database
const { data: subscription } = await supabase
  .from("subscriptions")
  .select("*")
  .eq("user_id", authUser.id)
  .single();

// Pass real data:
<SettingsSubscription subscription={subscription} />
```

---

### Step 9: Update `SettingsSubscription` component

**File:** `src/components/dashboard/settings-subscription.tsx`

Add interactive buttons:
- **Free plan:** "Upgrade" button that calls `/api/checkout` with the selected price and redirects to Stripe Checkout
- **Paid plan:** "Manage Subscription" button that calls `/api/billing-portal` and redirects to Stripe Customer Portal
- Show `cancel_at_period_end` state ("Cancels on {date}")
- Show `past_due` status with a prompt to update payment method

---

### Step 10: Update Database types

**File:** `src/lib/supabase.ts`

Add `subscriptions` table to the `Database` type:

```typescript
subscriptions: {
  Row: {
    id: string;
    user_id: string;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    plan: "free" | "monthly" | "yearly";
    status: "active" | "paused" | "cancelled" | "past_due" | "trialing";
    current_period_end: string | null;
    cancel_at_period_end: boolean;
    created_at: string;
    updated_at: string;
  };
  Insert: { ... };
  Update: { ... };
};
```

---

### Step 11: Update Subscription TypeScript type

**File:** `src/lib/types.ts`

Align the existing `Subscription` interface with the database schema:

```typescript
export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  plan: "free" | "monthly" | "yearly";
  status: "active" | "paused" | "cancelled" | "past_due" | "trialing";
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}
```

---

### Step 12: Update Dashboard sidebar

**File:** `src/components/dashboard/dashboard-sidebar.tsx`

Replace the hardcoded "Free Plan" badge with real subscription data. The dashboard layout already fetches user data — extend it to also fetch the subscription and pass it down through context or as a prop.

---

### Step 13: Update landing page pricing (optional, Phase 2)

**File:** `src/components/landing/pricing.tsx`

When ready to monetize, update the pricing section to show real plan prices and link to Stripe Checkout (for authenticated users) or to the auth flow with a redirect back to checkout.

---

## File Summary

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/003_subscriptions.sql` | Create | Database migration for subscriptions table |
| `supabase/schema.sql` | Update | Add subscriptions table definition |
| `src/lib/stripe.ts` | Create | Stripe server client singleton |
| `src/lib/supabase.ts` | Update | Add subscriptions to Database type |
| `src/lib/types.ts` | Update | Align Subscription interface with DB |
| `src/app/api/checkout/route.ts` | Create | Stripe Checkout session creation |
| `src/app/api/webhooks/stripe/route.ts` | Create | Stripe webhook event handler |
| `src/app/api/billing-portal/route.ts` | Create | Stripe Customer Portal session |
| `src/lib/subscription/actions.ts` | Create | Server action to fetch subscription |
| `src/app/dashboard/settings/page.tsx` | Update | Use real subscription data |
| `src/components/dashboard/settings-subscription.tsx` | Update | Add checkout/portal buttons |
| `src/components/dashboard/dashboard-sidebar.tsx` | Update | Show real plan badge |
| `.env.local` | Update | Add Stripe environment variables |

---

## Stripe Dashboard Configuration (Manual Steps)

These are done in the Stripe Dashboard, not in code:

1. **Create a Stripe account** (if not already done)
2. **Create a Product** called "Entiremind Subscription"
3. **Create Prices**: Monthly ($X/mo) and Yearly ($X/yr)
4. **Configure Customer Portal**: Allow cancel, plan switching, payment method updates
5. **Set up Webhook Endpoint**: Point to `https://yourdomain.com/api/webhooks/stripe` with events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
6. **Copy keys** to `.env.local`: publishable key, secret key, webhook secret, price IDs

---

## Testing Strategy

1. **Use Stripe test mode** — all keys should be `sk_test_*` / `pk_test_*` during development
2. **Use Stripe CLI** for local webhook testing:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
3. **Test card numbers:**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`
   - Requires auth: `4000 0025 0000 3155`
4. **Test flows:**
   - Free user upgrades to monthly
   - Free user upgrades to yearly
   - Paid user cancels (verify `cancel_at_period_end`)
   - Paid user switches plan (monthly <-> yearly)
   - Payment fails (verify `past_due` status)
   - Webhook signature verification (invalid signature returns 400)

---

## Security Considerations

- **Webhook signature verification** is mandatory — never process unverified events
- **Stripe secret key** stays server-side only (never in `NEXT_PUBLIC_*` vars)
- **RLS policies** ensure users can only read their own subscription
- **Service role client** used only in webhook handler (no user session available)
- **Checkout sessions** are created server-side and user is redirected — no sensitive data in the browser
- **Idempotency**: Webhook handler should be idempotent (Stripe may retry events)

---

## Implementation Order

Recommended build sequence:

1. Database migration + types (Steps 1, 10, 11)
2. Stripe client + env vars (Steps 2, 3)
3. Checkout API route (Step 4)
4. Webhook handler (Step 5)
5. Billing portal route (Step 6)
6. Subscription server action (Step 7)
7. Update settings page + component (Steps 8, 9)
8. Update sidebar (Step 12)
9. Testing with Stripe CLI
10. Landing page pricing update (Step 13, when ready to monetize)
