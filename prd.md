# Entiremind — Unified MVP PRD
**Manifestation-First · Loop-Driven · AI-Buildable**

---

## 1. Product Definition

Entiremind is a **lightly magical, SMS-based manifestation system** that helps users align their thoughts, intentions, and actions to manifest their goals and dreams.

On the surface, it feels calm, inspiring, and intuitive.  
Under the hood, it operates as a **real-time behavioral learning loop** that improves through user interaction.

The competitive advantage is **learning velocity**, not features.

---

## 2. Core Thesis

People don’t fail because they lack information.  
They fail because their thoughts go unobserved, unchallenged, and unsupported.

Entiremind helps users:
- Catch limiting thoughts
- Reframe internal narratives
- Build quiet momentum toward what they want to manifest

Each SMS is:
- A moment of support for the user
- A micro-experiment for the system

---

## 3. System Philosophy (Internal)

Entiremind compounds through loops, not roadmaps.

**Action → Signal → Learning → Adjustment → Action**

- Messages ship quickly
- Replies and silence are signals
- Prompts evolve weekly
- Founder judgment compounds early

---

## 4. User Problem (True Pain)

Users already “know what to do.”

What they experience instead:
- Mental resistance
- Avoidance
- Frustration and quiet shame
- A gap between intention and follow-through

Manifestation breaks down not because of belief — but because thoughts aren’t surfaced in the moment.

Entiremind exists to gently surface and shift those moments.

---

## 5. Target Users (MVP)

### Primary User
- High-functioning adult
- Builder / professional / self-improver
- Drawn to manifestation and mindset
- Wants change without force or rigidity

### Internal User (Critical)
**Founder-in-the-loop**
- Reviews replies
- Detects resistance patterns
- Rewrites prompts
- Guides system evolution

Founder intuition is a feature in v0.

---

## 6. Product Goals

### Primary Goal
Build a system that listens to real human behavior and adapts in days, not quarters.

### Secondary Goals
- Recoup paid ad CAC within **7–14 days**
- Increase personalization through interaction (not forms)
- Preserve emotional magic while strengthening system rigor

### Explicit Non-Goals (v0)
- Heavy dashboards
- Productivity theater
- Fully autonomous AI
- Large content libraries

---

## 7. System Phases

### Phase 1: Pretotype (Demand Validation)
- WordPress landing page
- Capture email + phone
- No monetization
- Optional confirmation SMS

### Phase 2: Evergreen MVP (Monetized)
- Paid traffic
- Early payment or free trial
- SMS-first experience
- Monetization treated as behavioral signal

System behavior must be **phase-aware**.

---

## 8. Core User Flows (Source of Truth)

### Flow A: Pretotype Signup
1. User lands on landing page
2. Sees manifestation-first positioning
3. Submits email / phone
4. Stored as lead
5. Optional waitlist confirmation

---

### Flow B: Evergreen Paid Entry
1. User lands from ad
2. Clear promise + emotional resonance
3. Early payment or free trial
4. Payment triggers onboarding SMS

---

### Flow C: Onboarding & Intention Alignment
1. Welcome SMS
2. Prompt to state what they want to manifest
3. User replies in free text
4. System mirrors intent back
5. Emotional buy-in moment

---

### Flow D: Reflection → Monetization Loop (Days 1–14)
1. Prompt sent
2. User replies or stays silent
3. Signal logged
4. Next message adapts
5. Monetization nudges tied to progress

---

## 9. Core Product Loops (Internal)

### Loop 1: Behavioral Learning Loop
- Message sent
- Reply or silence logged
- Signal stored
- Prompt adjusted
- Loop repeats

### Loop 2: Revenue as Signal
- Payment increases commitment
- Paid behavior yields higher-quality signals
- Monetization accelerates learning

### Loop 3: Founder Sweat Equity Loop
- Founder reviews engagement
- Detects patterns
- Rewrites prompts
- Learning compounds into leverage

---

## 10. Functional Requirements

### 10.1 SMS System
- Scheduled + event-based SMS
- Configurable cadence
- Two-way messaging
- Rapid prompt iteration

---

### 10.2 Response Capture
For every inbound message:
- user_id
- timestamp
- raw_text
- message_length
- associated_prompt_id
- silence stored as explicit state

---

### 10.3 Signal Storage
- Behavioral signals persisted per user
- Rule-based interpretation in v0
- Fully queryable by founder

---

### 10.4 Adaptive Messaging
- Rule-based logic initially
- AI-assisted drafting, tone variation, summarization
- Founder override always available

---

### 10.5 Founder Review
- Inspect raw replies
- Tag patterns manually
- Identify winning prompts
- Guide system evolution

---

## 11. User Dashboard (Simple, Intentional)

The dashboard supports trust, reflection, and control.  
It is **not** the primary engagement surface.

### Required (v0)
- Profile overview
  - Phone number
  - Email
  - Timezone
- Subscription status
- Billing management
- Controls:
  - Pause messages
  - Resume messages
  - Cancel subscription

### Optional (v0+)
- Lightweight reflection / message history
- Current intention summary
- Last few system reflections

Design principles:
- Calm
- Minimal
- No charts, streaks, or productivity metrics

---

## 12. Monetization & Commitment

- Subscription-based billing
- Paid vs unpaid behavior must be queryable
- Payment treated as:
  - Revenue
  - Commitment signal
  - Learning accelerant

---

## 13. Success Metrics (PMF Signals)

### North Star
**Unprompted user replies to SMS**

### Supporting Signals
- Reply rate by prompt type
- Time-to-reply
- Message length
- Emotional tone
- Silence after prompts
- Engagement change after payment

De-prioritized:
- App sessions
- Feature usage
- Vanity metrics

---

## 14. Technical Architecture & Stack

### Frontend (Web App)
- **Framework:** Next.js (App Router)
- **Styling:** Tailwind CSS
- **Components:** shadcn/ui
- **Design principles:**
  - Simple layouts
  - Soft spacing
  - Calm typography
  - No visual noise

shadcn components are used as a **base layer**, customized via Tailwind tokens to match Entiremind’s lightly magical aesthetic.

---

### Backend (System of Record)
- **Supabase**
  - Postgres
  - Auth
  - Edge Functions
- Founder must be able to inspect raw data directly.

Core tables:
- users
- messages (outbound + inbound)
- reflections
- behavioral_signals
- subscriptions

---

### Messaging Layer
- SMS-first (primary product surface)
- Provider: Twilio or equivalent
- Webhooks into Supabase Edge Functions
- All learning loops must function via SMS alone

---

### Authentication
- Supabase Auth
- Email magic link
- Phone number required
- Single user role

---

### Payments
- Stripe subscriptions
- Webhooks into Supabase
- Payment state stored per user
- Payment events treated as behavioral signals

---

### AI / LLM Usage
- OpenAI-compatible API
- Used for:
  - Drafting prompts
  - Tone variation
  - Summarization
- Not autonomous
- System must function without AI

---

## 15. Operating Cadence (This *Is* Product Development)

Weekly:
1. Review engagement
2. Identify silence points
3. Rewrite prompts
4. Ship changes
5. Capture insights

---

## 16. Strategic Source of Truth

Entiremind is a **manifestation experience powered by behavioral learning loops**.

The magic is how it feels.  
The moat is how fast it learns.