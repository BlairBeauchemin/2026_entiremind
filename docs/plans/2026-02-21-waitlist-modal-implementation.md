# Waitlist Modal Implementation Plan

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

```tsx
import { Navigation } from "@/components/landing/navigation";
import { Footer } from "@/components/landing/footer";
import { Check } from "lucide-react";

export const metadata = {
  title: "You're on the list | Entiremind",
  description: "Thank you for joining the Entiremind waitlist.",
};

export default function ThankYouPage() {
  return (
    <div className="bg-cream text-teal-900 font-sans min-h-screen relative overflow-x-hidden selection:bg-em-purple-300/30 selection:text-teal-900">
      {/* Background Grain Texture */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grain mix-blend-multiply" />

      {/* Ambient Background Gradients */}
      <div className="fixed top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-em-purple-300/15 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-em-yellow-400/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <Navigation />

      <main className="relative z-10 py-40 px-6">
        <div className="max-w-xl mx-auto text-center">
          <div className="w-16 h-16 rounded-full bg-navy/10 flex items-center justify-center mx-auto mb-8">
            <Check className="w-8 h-8 text-navy" />
          </div>

          <h1 className="font-serif text-4xl md:text-5xl text-navy font-medium mb-6">
            You&apos;re on the list
          </h1>

          <p className="text-lg text-teal-900/70 font-light leading-relaxed mb-4">
            We&apos;ll text you when it&apos;s your turn to begin the loop.
          </p>

          <p className="text-sm text-teal-900/50 font-light">
            Keep an eye on your inbox for updates.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
```

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

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface WaitlistModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WaitlistModal({ isOpen, onClose }: WaitlistModalProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    setStep(2);
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setError("Please enter a valid phone number");
      return;
    }

    if (!smsConsent) {
      setError("Please agree to receive SMS messages");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Something went wrong");
      }

      router.push("/thank-you");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setName("");
    setEmail("");
    setPhone("");
    setSmsConsent(false);
    setError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
          >
            <div className="bg-white rounded-3xl shadow-2xl p-8 mx-4">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 text-teal-900/40 hover:text-teal-900 transition-colors"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>

              {/* Progress dots */}
              <div className="flex justify-center gap-2 mb-6">
                <div
                  className={`w-2 h-2 rounded-full transition-colors ${
                    step >= 1 ? "bg-navy" : "bg-teal-900/20"
                  }`}
                />
                <div
                  className={`w-2 h-2 rounded-full transition-colors ${
                    step >= 2 ? "bg-navy" : "bg-teal-900/20"
                  }`}
                />
              </div>

              <AnimatePresence mode="wait">
                {step === 1 ? (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 className="font-serif text-2xl text-navy font-medium text-center mb-2">
                      Join the Waitlist
                    </h2>
                    <p className="text-sm text-teal-900/60 text-center mb-6">
                      Be first to experience manifestation at the speed of
                      thought.
                    </p>

                    <form onSubmit={handleStep1Submit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-teal-900 mb-2 ml-1 uppercase tracking-wider">
                          Name
                        </label>
                        <input
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Your name"
                          className="input-autofill-fix w-full px-4 py-3 bg-cream/50 border border-teal-900/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 text-teal-900 placeholder-teal-900/40 transition-all font-sans"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-teal-900 mb-2 ml-1 uppercase tracking-wider">
                          Email
                        </label>
                        <input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@example.com"
                          className="input-autofill-fix w-full px-4 py-3 bg-cream/50 border border-teal-900/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 text-teal-900 placeholder-teal-900/40 transition-all font-sans"
                          required
                        />
                      </div>

                      {error && (
                        <p className="text-sm text-red-500 text-center">
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="w-full bg-navy text-cream py-3.5 rounded-xl font-medium hover:bg-navy/90 transition-all duration-300 font-sans"
                      >
                        Continue
                      </button>
                    </form>
                  </motion.div>
                ) : (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h2 className="font-serif text-2xl text-navy font-medium text-center mb-2">
                      Almost there
                    </h2>
                    <p className="text-sm text-teal-900/60 text-center mb-6">
                      Enter your phone number to receive SMS updates.
                    </p>

                    <form onSubmit={handleStep2Submit} className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-teal-900 mb-2 ml-1 uppercase tracking-wider">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="(555) 000-0000"
                          className="input-autofill-fix w-full px-4 py-3 bg-cream/50 border border-teal-900/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-navy/20 focus:border-navy/30 text-teal-900 placeholder-teal-900/40 transition-all font-sans"
                          required
                        />
                      </div>

                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={smsConsent}
                          onChange={(e) => setSmsConsent(e.target.checked)}
                          className="mt-1 w-4 h-4 rounded border-teal-900/20 text-navy focus:ring-navy/30"
                          required
                        />
                        <span className="text-xs text-teal-900/70 leading-relaxed">
                          I agree to receive up to 14 SMS messages per week from
                          Entiremind. Message and data rates may apply. Reply
                          STOP to cancel. View our{" "}
                          <Link
                            href="/privacy"
                            className="underline hover:text-teal-900"
                            target="_blank"
                          >
                            Privacy Policy
                          </Link>
                          ,{" "}
                          <Link
                            href="/terms"
                            className="underline hover:text-teal-900"
                            target="_blank"
                          >
                            Terms
                          </Link>
                          , and{" "}
                          <Link
                            href="/sms-policy"
                            className="underline hover:text-teal-900"
                            target="_blank"
                          >
                            SMS Policy
                          </Link>
                          .
                        </span>
                      </label>

                      {error && (
                        <p className="text-sm text-red-500 text-center">
                          {error}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-navy text-cream py-3.5 rounded-xl font-medium hover:bg-navy/90 transition-all duration-300 font-sans disabled:opacity-50"
                      >
                        {isSubmitting ? "Submitting..." : "Reserve My Spot"}
                      </button>

                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="w-full text-sm text-teal-900/60 hover:text-teal-900 transition-colors"
                      >
                        Back
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
```

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

```tsx
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PhoneMockup } from "./phone-mockup";
import { WaitlistModal } from "./waitlist-modal";

export function Hero() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <header
        id="section-hero"
        className="relative pt-40 pb-24 lg:pt-56 lg:pb-40 z-10 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage:
            'url("https://nivbeqiuhotuxbmcvuxt.supabase.co/storage/v1/object/public/project-images/10ae444c-eb2d-49cc-b7cb-99d5ff759dd0/897f91c1-821d-4fed-8574-49161ace98e5.png")',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
          {/* Hero Content */}
          <div className="relative z-10 space-y-10 text-center lg:text-left animate-fade-in-up">
            <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/50 border border-teal-900/10 text-teal-900 text-[11px] font-medium tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-900 animate-pulse" />
              Now accepting early signals
            </div>

            <h1 className="font-serif text-6xl lg:text-8xl leading-[0.95] text-navy font-medium">
              Manifestation at the <br />
              <span className="font-medium">speed of thought.</span>
            </h1>

            <p className="text-lg lg:text-xl text-teal-900 max-w-lg mx-auto lg:mx-0 font-light leading-relaxed font-sans">
              A lightly magical SMS companion that aligns your intentions with
              reality. No apps to open, no dashboards to manage—just signals to
              send.
            </p>

            <div className="pt-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-navy text-cream px-10 py-4 rounded-full text-lg font-medium hover:bg-navy/90 hover:shadow-lg hover:shadow-navy/10 transition-all duration-300 font-sans"
              >
                Reserve My Spot
              </button>
            </div>

            <div className="pt-2 flex items-center justify-center lg:justify-start gap-4 text-sm text-teal-900/70 font-sans font-light">
              <div className="flex -space-x-3 opacity-80">
                {[1, 2, 3].map((i) => (
                  <img
                    key={i}
                    src={`https://i.pravatar.cc/150?u=${i}`}
                    alt="User"
                    className="w-8 h-8 rounded-full border-2 border-cream grayscale"
                  />
                ))}
              </div>
              <span>Join 2,000+ others aligning intentions.</span>
            </div>
          </div>

          {/* Hero Visual / Phone Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative lg:h-[700px] flex items-center justify-center"
          >
            {/* Decorative Elements */}
            <div className="absolute top-20 right-20 w-32 h-32 bg-em-yellow-400/10 rounded-full blur-3xl animate-pulse-slow" />
            <div
              className="absolute bottom-32 left-10 w-40 h-40 bg-em-purple-300/10 rounded-full blur-3xl animate-pulse-slow"
              style={{ animationDelay: "1s" }}
            />

            {/* Floating Cards */}
            <div className="absolute top-[20%] left-[-40px] z-20 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-white shadow-sm animate-float max-w-[220px] hidden md:block">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-teal-900" />
                <span className="text-[10px] font-medium text-teal-900 uppercase tracking-widest">
                  Signal Received
                </span>
              </div>
              <p className="text-lg text-teal-900 font-serif italic leading-tight">
                &ldquo;I want to launch my project.&rdquo;
              </p>
            </div>

            <div className="absolute bottom-[25%] right-[-40px] z-20 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-white shadow-sm animate-float-delayed max-w-[220px] hidden md:block">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-1.5 h-1.5 rounded-full bg-em-purple-300/60" />
                <span className="text-[10px] font-medium text-teal-900 uppercase tracking-widest">
                  Reflection
                </span>
              </div>
              <p className="text-lg text-teal-900 font-serif italic leading-tight">
                &ldquo;What is the smallest step you can take right now?&rdquo;
              </p>
            </div>

            <PhoneMockup />
          </motion.div>
        </div>
      </header>

      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
```

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

```tsx
"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { WaitlistModal } from "./waitlist-modal";

export function Pricing() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section id="section-pricing" className="py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-5xl md:text-7xl text-navy mb-8 font-medium">
            Join the Pretotype
          </h2>
          <p className="text-xl text-teal-900/70 mb-16 max-w-2xl mx-auto font-sans font-light leading-relaxed">
            We are currently in Phase 1. Access is limited to ensure high-quality
            interactions. Sign up now to reserve your spot in the queue.
          </p>

          <div className="bg-white/60 backdrop-blur-xl rounded-[3rem] shadow-2xl shadow-em-purple-300/20 border border-white p-10 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-em-purple-300 via-em-yellow-400 to-teal-900 opacity-50" />

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-left space-y-6">
                <div className="inline-block px-4 py-1 rounded-full bg-teal-900/5 text-teal-900 text-xs font-medium tracking-widest uppercase">
                  Early Access
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-serif text-navy font-medium">
                    $0
                  </span>
                  <span className="text-teal-900/60 font-sans">/ month</span>
                </div>
                <p className="text-teal-900/80 font-sans font-light">
                  Free during the pretotype phase. We only ask for your honest
                  feedback.
                </p>

                <ul className="space-y-3 pt-4">
                  {[
                    "Daily intention prompts",
                    "Personalized reflections",
                    "Direct founder access",
                  ].map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-3 text-sm text-teal-900 font-sans"
                    >
                      <Check className="w-4 h-4 text-teal-900" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* CTA Column */}
              <div className="relative">
                <div className="bg-white/40 p-6 md:p-8 rounded-3xl border border-white/60 backdrop-blur-md text-center">
                  <p className="text-teal-900/70 font-sans font-light mb-6">
                    Reserve your spot today and be among the first to experience
                    the loop.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-navy text-cream py-4 rounded-full font-medium hover:bg-navy/90 hover:shadow-lg hover:shadow-navy/10 transition-all duration-300 font-sans"
                  >
                    Reserve My Spot
                  </button>
                  <p className="text-xs text-teal-900/60 text-center font-sans mt-4">
                    Your information is kept private. No spam, ever.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
```

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

```tsx
"use client";

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { WaitlistModal } from "./waitlist-modal";

export function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <nav className="fixed w-full z-40 top-0 transition-all duration-300">
        <div className="glass-panel border-b border-white/40">
          <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
            {/* Logo */}
            <a href="#" className="flex items-center gap-3 group">
              <span className="font-serif text-3xl font-medium tracking-[2px] text-navy">
                Entiremind
              </span>
            </a>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-10">
              <a
                href="#section-philosophy"
                className="text-teal-900 hover:text-teal-800 font-sans text-sm tracking-wide transition-colors"
              >
                Philosophy
              </a>
              <a
                href="#section-how-it-works"
                className="text-teal-900 hover:text-teal-800 font-sans text-sm tracking-wide transition-colors"
              >
                The Loop
              </a>
              <a
                href="#section-pricing"
                className="text-teal-900 hover:text-teal-800 font-sans text-sm tracking-wide transition-colors"
              >
                Membership
              </a>
            </div>

            {/* Desktop CTA */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/auth"
                className="text-teal-900 font-sans text-sm hover:text-teal-800 transition-colors"
              >
                Login
              </Link>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-navy text-cream px-6 py-2.5 rounded-full text-sm font-medium hover:bg-navy/90 hover:shadow-lg hover:shadow-navy/10 transition-all duration-300"
              >
                Join Waitlist
              </button>
            </div>

            {/* Mobile buttons */}
            <div className="flex md:hidden items-center gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-navy text-cream px-5 py-2 rounded-full text-sm font-medium hover:bg-navy/90 transition-all duration-300"
              >
                Join Waitlist
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-navy p-1"
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden glass-panel border-b border-white/40">
            <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
              <a
                href="#section-philosophy"
                onClick={() => setMobileMenuOpen(false)}
                className="text-teal-900 hover:text-teal-800 font-sans text-sm tracking-wide transition-colors py-2"
              >
                Philosophy
              </a>
              <a
                href="#section-how-it-works"
                onClick={() => setMobileMenuOpen(false)}
                className="text-teal-900 hover:text-teal-800 font-sans text-sm tracking-wide transition-colors py-2"
              >
                The Loop
              </a>
              <a
                href="#section-pricing"
                onClick={() => setMobileMenuOpen(false)}
                className="text-teal-900 hover:text-teal-800 font-sans text-sm tracking-wide transition-colors py-2"
              >
                Membership
              </a>
              <div className="border-t border-white/40 pt-4 mt-2">
                <Link
                  href="/auth"
                  onClick={() => setMobileMenuOpen(false)}
                  className="inline-block text-teal-900 font-sans text-sm hover:text-teal-800 transition-colors"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
```

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
