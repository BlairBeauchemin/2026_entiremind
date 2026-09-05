# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary:** women roughly 28–45 engaged in self-development — the audience already
reading, journaling, and using manifestation/astrology/mindfulness tools.

Their situation: they have a goal or a life change they genuinely want, and they have
already tried the app-shaped solutions (Headspace, Calm, journaling apps, habit
trackers) and let them lapse. The job is not "learn a technique" — it is *stay in
contact with what I said I wanted* on ordinary days, without another app to maintain
and without being made to feel behind.

This is a crowded, visually clichéd category (Co-Star, The Pattern, Insight Timer,
Roxie occupy adjacent ground). The audience is confirmed; the fact that it is the
most saturated segment is a constraint future work must design *against*, not a
reason to re-aim the product.

## Product Purpose

Entiremind is an SMS-based manifestation companion. It texts a person one prompt a
day, reads whatever they text back, remembers it, and adapts the next prompt.

Success is defined narrowly and unusually: the North Star is **unprompted user
replies to SMS** — not sessions, not retention, not time-in-app. Supporting signals
are reply rate by prompt type, time-to-reply, message length, silence after prompts,
and engagement change after payment. Payment itself is treated as a behavioral
signal, not only as revenue.

The company competes on **learning velocity, not features**: the loop is
Action → Signal → Learning → Adjustment → Action.

## Positioning

The mechanism a neighboring product could not truthfully copy: **there is nothing to
open.** The product surface is the SMS thread itself. A reply is the entire
interaction model, silence is stored as an explicit behavioral state rather than a
gap in the data, and the web dashboard is deliberately *not* the engagement surface —
it exists for trust, reflection, and control only.

The house stance, from `docs/methodology.md`, reconciles sources that normally
contradict each other:

> **Thoughts are material, not master.** You don't obey your thoughts and you don't
> fight them — you choose which ones to feed, and you act to gather evidence for the
> life you're building.

This lets thought-skepticism and manifestation coexist, and it is the line the whole
product speaks from. It also rules out both hustle-culture framing and uncritical woo.

## Operating Context

- The product is used **in the phone's native messages app**, interleaved with texts
  from real people. Every design decision competes with that context: a message must
  survive being read on a lock screen, one-handed, mid-morning.
- Daily prompt currently sends at a single fixed time (7:45 AM Pacific) for everyone;
  `preferred_send_hour` is stored but not yet honored.
- Weekly rhythm: memory compaction and an optional recap message on Mondays.
- Silence is a first-class state. A silence-recovery arc names the quiet and offers
  PAUSE rather than nagging; it can pause an account, but never without warning.
- The founder reviews raw replies and tunes the system by hand; selection thresholds
  live in a database config table, tunable without a deploy.

## Capabilities and Constraints

**Confirmed capabilities:** two-way SMS (Twilio); AI-generated daily prompts with
per-user memory and a four-way rhetorical mode axis (question / mirror / callback /
attunement); reply enrichment (sentiment, themes, emotional state) with a mirror
or soft-ack response to every substantive inbound; an eight-screen archetype quiz —
served inside a 15-step authed onboarding and as an 11-step public flow at `/quiz`;
shareable public archetype pages; Stripe subscriptions; a curated quote library; a
weekly email edition drafted for founder review; an internal technique playbook; a
founder simulator that exercises the whole pipeline against test personas without
sending SMS.

**Hard constraints:**

- **160 characters, no emojis** for SMS. This is the primary product surface and it
  carries no typography, no color, and no layout — the brand must survive being plain
  text.
- Pricing is live in the product: **$12.99/month, $99/year**, with a 10-day free
  trial. Shown on the landing page; the in-dashboard upgrade path still carries no
  dollar figures.
- Phone numbers are unique per account — required for SMS routing.
- Nothing is auto-sent to users on the marketing side, and paid ads always require
  founder review.

**Future direction (recorded, not scheduled):** physical products — guided journals
and card decks — once a user base exists, with Intelligent Change's *The Life
Designer* as the format model. Nothing is designed or committed. The one binding
consequence today: **the visual system must survive being printed**, which rules out
identity that depends on screen gradients, glow, or backlit colour.

**Explicitly undecided:** whether SMS-only remains inviolable. It is the current
confirmed mechanic and the basis of the positioning above, but it was *not* pinned as
an immutable constraint when asked, so future work should treat a broadened surface
as a possible product decision rather than an assumed one.

## Brand Commitments

- **Name:** "Entiremind" is fixed. Its typographic treatment is fully open.
- **Voice:** calm, warm, lightly magical. Never hustle-culture, clinical, preachy, or
  productivity-flavored. A companion, not a coach — the product does not explain,
  teach, or diagnose.
- **Enact, don't teach.** A technique is a way of *asking*, never a lesson. The user
  never sees a method named or explained; they receive one question that quietly does
  the work. If a line could be read as advice, it is wrong.
- **The trusted-friend test** (`docs/design-philosophy.md`) governs every user-facing
  decision: would this feel warm and honest from a trusted friend, or like a growth
  hack? Categorically excluded — manufactured urgency or scarcity, shame or guilt as
  a lever, streaks, leaderboards, productivity theater, hidden costs, obscured
  pause/cancel, and dark patterns of any kind.
- **The four archetypes are permanent product structure:** The Visionary ("You see it
  before it exists"), The Alchemist ("You turn intention into motion"), The Seeker
  ("You know exactly what you're done with"), The Phoenix ("You rebuild through
  action"). Any visual system must give them a home. Named inner critics ("The
  Imposter Whisper," "The All-or-Nothing Trap," "The Drill Sergeant," "The Other
  Shoe") exist alongside them.
- **Quiz-before-signup is permanent:** real value is delivered before contact capture
  — taps, then a partial reveal, then the gate, then the full personalized reading.
- **IP hygiene:** techniques are informed by books, never copies. Source titles and
  authors are internal lineage only and are never surfaced to users.
- **Named aspirational reference: Intelligent Change** (intelligentchange.com). The
  founder has confirmed this brand as the target for tone, copy and visual style —
  same category, same audience, physical journals and card decks. Their stated
  position, *"Manifestation isn't magic. It's clarity, belief, and consistent
  action,"* is functionally identical to this product's own methodology, which makes
  them a genuine reference rather than merely an admired one. Their **commerce**
  patterns are explicitly *not* adopted: mystery-discount popups, struck-through
  pricing, and volume-purchase urgency all fail the trusted-friend test above.

## Evidence on Hand

**There is no customer proof. The product is pre-launch.** Future work must not
fabricate any.

Specifically:
- No paying subscribers, no live users generating replies, no testimonials.
- `src/components/landing/testimonials.tsx` is named misleadingly — it is a
  "What You'll Experience" benefits section containing no customer quotes.
- The invented social-proof line that used to sit in
  `src/components/landing-v2/sacred-hero.tsx` (a follower count beside stock avatars)
  **was removed on 30 August 2026**. What remains at that spot is a comment explaining
  why the slot is deliberately empty. Real proof goes there when it exists, and not
  before — do not reintroduce a number, a count, or an avatar row.
- Note that `/v2` (which renders `landing-v2/*`) is a live but unlinked alternate
  landing page; the production landing at `/` renders `landing/*`. A claim removed
  from one is not removed from the other.

**Real assets that do exist:** the archetype and inner-critic writing in
`src/lib/persona/content.ts`; the seeded technique library; the curated quote library;
the methodology and design-philosophy documents. These are genuine and citable.

## Product Principles

1. **The reply is the product.** Every decision is judged by whether it makes a real
   human more likely to text back. Not opens, not sessions.
2. **Silence is information, never failure.** Non-response is stored, interpreted, and
   answered gently — it is never punished, counted against the user, or broken with
   escalating pressure.
3. **Give before asking.** Real value lands before any request for an email, a phone
   number, or a payment. The quiz reveal is the flagship case.
4. **It must work as plain text.** The core surface has no visual affordances at all.
   Anything that only works with typography and color is decoration on top of the
   product, not the product.
5. **Warmth is a constraint, not a tone.** The trusted-friend test can veto a decision
   that would otherwise convert better. Persuasion serves the user's own stated
   intention or it does not ship.
6. **The user authors their intention.** The system may notice that someone's attention
   has drifted and say so — once, gently, with a link to change it. It never edits the
   intention itself, and neither does the founder. This is the one place where "the
   system decides" is not an improvement.
7. **The system runs itself.** Nothing that reaches a user waits on a human to approve
   it. Judgment is applied to outcomes after the fact and expressed as config, not as a
   queue in the request path. Four gates survive this rule and only these four: paid ad
   launches (unattended spend), organic social publishing (brand voice in public),
   weekly email sends (list compliance), and testimonial publishing (the user's
   consent). None of them is about founder taste.

## Accessibility & Inclusion

- The dashboard message feed already targets 18px+ type and WCAG AA contrast, with
  semantic HTML (`<article>`, `<time>`, `<section>`), ARIA labels, and visible focus
  states — treat this as the established floor, not a ceiling.
- Motion must respect `prefers-reduced-motion`; the existing ambient animations are
  already gated on it in `globals.css`.
- Mobile-first is a product fact, not a preference: the audience is reached on a
  phone, in a messages app.
