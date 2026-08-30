# Waitlist Modal Implementation Plan

> **Historical record.** This plan shipped in February 2026. Its five component
> listings were written in a palette that was retired in the August 2026
> DESIGN.md migration and no longer resolves to anything, so each has been
> replaced by a pointer to the component that actually shipped. The prose —
> goals, flow, state machine, analytics wiring, acceptance criteria — is
> unchanged and still accurate.
>
> Take every colour, radius and type value from `DESIGN.md`, which is the only
> visual authority. The original listings are preserved verbatim in git history.

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace inline lead capture forms with a two-step modal flow for pre-launch waitlist capture with conversion tracking.

**Architecture:** A single modal component triggered from three locations (hero, pricing, nav). Two-step form with inline crossfade transition. Submits to existing `/api/leads` endpoint (updated to accept name). Redirects to new `/thank-you` page for conversion pixel firing.

**Tech Stack:** Next.js 16, React, Framer Motion, Tailwind CSS, Supabase

---

### Task 1: Database Migration - Add Name Column

**Files:**
- Create: `supabase/migrations/009_leads_name.sql`

**Step 1: Create migration file**

```sql
-- Add name column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS name TEXT;

-- Update existing rows to have empty name (optional, for data consistency)
UPDATE leads SET name = '' WHERE name IS NULL;

-- Make name required for new rows going forward
-- Note: Keeping nullable for backwards compatibility with existing data
```

**Step 2: Run migration locally**

Run: `npx supabase db push` or apply via Supabase dashboard

**Step 3: Commit**

```bash
git add supabase/migrations/009_leads_name.sql
git commit -m "feat(db): add name column to leads table"
```

---

### Task 2: Update Leads API to Accept Name

**Files:**
- Modify: `src/app/api/leads/route.ts`

**Step 1: Update the API to require name, email, and phone**

Replace the entire file with:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone } = body;

    // Validate all required fields
    const hasName = name && typeof name === "string" && name.trim();
    const hasEmail = email && typeof email === "string" && email.trim();
    const hasPhone = phone && typeof phone === "string" && phone.trim();

    if (!hasName) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!hasEmail) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    if (!hasPhone) {
      return NextResponse.json(
        { error: "Phone number is required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate phone format
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      return NextResponse.json(
        { error: "Invalid phone number" },
        { status: 400 }
      );
    }

    // Check if Supabase is configured
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log("Lead captured (Supabase not configured):", { name, email, phone });
      return NextResponse.json(
        { success: true, message: "Lead captured" },
        { status: 201 }
      );
    }

    const supabase = createServiceRoleClient();

    // Insert lead into database
    const { error } = await supabase.from("leads").insert({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      source: "landing_page",
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This email is already on the waitlist" },
          { status: 409 }
        );
      }
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to save lead" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Lead captured" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error capturing lead:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 2: Verify types pass**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/app/api/leads/route.ts
git commit -m "feat(api): require name field in leads endpoint"
```

---

### Task 3: Create Thank-You Page

**Files:**
- Create: `src/app/thank-you/page.tsx`

**Step 1: Create the thank-you page**

> The JSX that stood here was written in the retired palette and would not
> compile to anything today. It has been replaced by a pointer rather than
> rewritten, because the shipped component is the accurate record and this
> document is the reasoning behind it.
>
> **As built:** `src/app/thank-you/page.tsx`
>
> The original 47-line listing is preserved verbatim in git history
> (`git log -p -- docs/plans/2026-02-21-waitlist-modal-implementation.md`).

**Step 2: Verify page builds**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/thank-you/page.tsx
git commit -m "feat: add thank-you page for conversion tracking"
```

---

### Task 4: Create Waitlist Modal Component

**Files:**
- Create: `src/components/landing/waitlist-modal.tsx`

**Step 1: Create the two-step modal component**

> The JSX that stood here was written in the retired palette and would not
> compile to anything today. It has been replaced by a pointer rather than
> rewritten, because the shipped component is the accurate record and this
> document is the reasoning behind it.
>
> **As built:** `src/components/landing/waitlist-modal-two-step.tsx` and `src/components/landing/waitlist-modal-single.tsx`
>
> The original 295-line listing is preserved verbatim in git history
> (`git log -p -- docs/plans/2026-02-21-waitlist-modal-implementation.md`).

**Step 2: Verify types pass**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/landing/waitlist-modal.tsx
git commit -m "feat: add two-step waitlist modal component"
```

---

### Task 5: Update Hero Section

**Files:**
- Modify: `src/components/landing/hero.tsx`

**Step 1: Replace inline form with CTA button and modal**

Replace the entire file with:

> The JSX that stood here was written in the retired palette and would not
> compile to anything today. It has been replaced by a pointer rather than
> rewritten, because the shipped component is the accurate record and this
> document is the reasoning behind it.
>
> **As built:** `src/components/landing/hero.tsx`
>
> The original 116-line listing is preserved verbatim in git history
> (`git log -p -- docs/plans/2026-02-21-waitlist-modal-implementation.md`).

**Step 2: Verify types pass**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/landing/hero.tsx
git commit -m "feat: replace hero inline form with modal trigger"
```

---

### Task 6: Update Pricing Section

**Files:**
- Modify: `src/components/landing/pricing.tsx`

**Step 1: Replace inline form with CTA button and modal**

Replace the entire file with:

> The JSX that stood here was written in the retired palette and would not
> compile to anything today. It has been replaced by a pointer rather than
> rewritten, because the shipped component is the accurate record and this
> document is the reasoning behind it.
>
> **As built:** `src/components/landing/pricing.tsx`
>
> The original 89-line listing is preserved verbatim in git history
> (`git log -p -- docs/plans/2026-02-21-waitlist-modal-implementation.md`).

**Step 2: Verify types pass**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/landing/pricing.tsx
git commit -m "feat: replace pricing inline form with modal trigger"
```

---

### Task 7: Update Navigation with Join Waitlist Button

**Files:**
- Modify: `src/components/landing/navigation.tsx`

**Step 1: Add modal state and Join Waitlist button**

Replace the entire file with:

> The JSX that stood here was written in the retired palette and would not
> compile to anything today. It has been replaced by a pointer rather than
> rewritten, because the shipped component is the accurate record and this
> document is the reasoning behind it.
>
> **As built:** `src/components/landing/navigation.tsx`
>
> The original 128-line listing is preserved verbatim in git history
> (`git log -p -- docs/plans/2026-02-21-waitlist-modal-implementation.md`).

**Step 2: Verify types pass**

Run: `npm run typecheck`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/landing/navigation.tsx
git commit -m "feat: add Join Waitlist button to navigation"
```

---

### Task 8: Remove Deprecated Lead Capture Form

**Files:**
- Delete: `src/components/landing/lead-capture-form.tsx`

**Step 1: Verify no imports remain**

Run: `grep -r "lead-capture-form" src/`
Expected: No results (all references removed in previous tasks)

**Step 2: Delete the file**

```bash
rm src/components/landing/lead-capture-form.tsx
```

**Step 3: Verify build still works**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: remove deprecated lead-capture-form component"
```

---

### Task 9: Final Verification

**Step 1: Run full lint and typecheck**

Run: `npm run lint:check && npm run typecheck`
Expected: No errors (warnings acceptable)

**Step 2: Run production build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Test locally**

Run: `npm run dev`

Manual verification:
- [ ] Click "Reserve My Spot" in hero → modal opens
- [ ] Click "Reserve My Spot" in pricing → modal opens
- [ ] Click "Join Waitlist" in nav → modal opens
- [ ] Step 1: Enter name + email, click Continue → goes to step 2
- [ ] Step 2: Enter phone, check consent, click Reserve → redirects to /thank-you
- [ ] Thank-you page displays correctly
- [ ] Modal closes on X click
- [ ] Modal closes on overlay click
- [ ] Back button in step 2 returns to step 1

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete waitlist modal implementation"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Database migration | `009_leads_name.sql` |
| 2 | Update API | `api/leads/route.ts` |
| 3 | Thank-you page | `app/thank-you/page.tsx` |
| 4 | Modal component | `waitlist-modal.tsx` |
| 5 | Hero update | `hero.tsx` |
| 6 | Pricing update | `pricing.tsx` |
| 7 | Nav update | `navigation.tsx` |
| 8 | Remove old form | `lead-capture-form.tsx` |
| 9 | Final verification | All files |
