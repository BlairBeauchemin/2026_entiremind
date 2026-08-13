# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: **women roughly 30–50 who are already manifestation-curious.** They
arrive fluent in the vocabulary — manifestation, intention, journaling,
law-of-attraction — and have usually tried the adjacent things: a gratitude
journal, a meditation app, a vision board, a course. The recurring failure is not
belief, it is continuity. The practice lapses within a few weeks and the lapse
feels like a personal shortcoming.

They sign up wanting a practice that survives contact with an ordinary week.

## Product Purpose

Entiremind is an SMS-based system that helps a person align thoughts, intentions,
and actions toward what they want to manifest.

The mechanic is a daily text and whatever comes back. A prompt goes out each
morning; the user replies, or does not. Both are signal. The system enriches each
reply, remembers across weeks, and adapts what it sends next.

Success is a user replying to a message nobody asked them to reply to — an
unprompted reply is the north-star metric. Secondary signals are reply rate by
prompt type, time-to-reply, message length, silence after prompts, and engagement
change after payment.

## Positioning

**The practice happens in the user's text thread, not in an app they must
remember to open.** There is no streak to protect, no home screen icon, no
session to start. The surface is the one place a person already looks dozens of
times a day.

The second differentiator is that the system **remembers and changes.** Weekly
compaction turns replies into a memory blob — themes, vision, obstacles,
emotional state, open threads — that shapes subsequent prompts. A user who says
"focus on my business, not my relationship" is heard, and the next morning
reflects it. The product's competitive advantage is stated internally as learning
velocity rather than feature count.

The dashboard exists for trust, reflection, and control. It is deliberately not
the engagement surface.

## Operating Context

- One AI-generated prompt per user per morning (currently 7:45 AM Pacific for
  everyone; a per-user `preferred_send_hour` is stored but not yet honored).
- Replies arrive by SMS at any hour and always receive a response — an
  AI-generated mirror line for substantive replies, a soft acknowledgement from a
  curated library for short ones.
- Keyword control lives in the thread: STOP, HELP, PAUSE, RESUME.
- A silence-recovery arc: after ~5 consecutive silences the system names the quiet
  and offers PAUSE; after ~9, and only following an unanswered reconnect, it sends
  a farewell and pauses the account. It never pauses without warning first.
- A Monday memory pass may stage a weekly recap SMS reflecting the user's own week
  back to them, sent in place of that morning's prompt.
- Entry points on the web: a public archetype quiz, a waitlist modal, and shareable
  per-archetype pages. Onboarding is a seven-step flow ending in a welcome SMS.

## Capabilities and Constraints

- **Live and working:** two-way SMS (Twilio, A2P 10DLC approved), AI daily prompt
  generation, reply enrichment and acknowledgement, weekly memory compaction,
  intention-shift detection with founder review, a public archetype quiz, a
  curated quote library, Stripe subscriptions, and a founder review dashboard.
- **Pricing:** $12.99/month or $99/year, each beginning with a 10-day free trial.
  Joining the waitlist requires no card.
- **Business stage:** pre-launch. The waitlist is open; nothing is purchasable
  yet. Public surfaces must not imply the product can be bought today.
- **Archetypes:** four — Visionary, Alchemist, Seeker, Phoenix. Public archetype
  copy is generic by design and contains no user data. Inner-critic content is
  private to the authenticated experience and must never surface publicly.
- **SMS constraints:** messages are plain text, no rich formatting, and length
  matters. Recap messages are capped at ~300 characters.
- **Deliberately not built:** streaks, leaderboards, heavy dashboards, large
  content libraries, and fully autonomous AI. These are explicit non-goals, not
  backlog items.

## Brand Commitments

- **Name:** Entiremind. Domain entiremind.com (canonical host is `www`).
- **The trusted-friend test** governs every user-facing decision, per
  `docs/design-philosophy.md`: warm and honest, never a growth hack. No fake
  urgency, no shame-based loss framing, no dark patterns, no productivity theater.
- **Six behavioral principles** are binding on user-facing surfaces: smart
  defaults, goal-gradient/progress, reciprocity, IKEA/endowment, loss-aversion,
  and anchoring/contrast. These govern behavior and persuasion, not visual style.
- **No guilt mechanics.** A single calm reflection cue is permitted; a streak or
  don't-break-the-chain reflex is not.
- **Volunteered visual constraint, recorded without expansion:** the user has
  named an abstract human head or brain rendered as tangled/squiggly line as the
  central motif, on the grounds that the product is about changing how you think.
  The existing teal/purple/yellow palette is explicitly open for replacement.
  All other visual decisions are undecided and belong to new-work.

## Evidence on Hand

- **No real social proof exists.** No user testimonials, no named customers, no
  published results, no user counts. The current landing page's "Testimonials"
  section is in fact a benefits list and contains no quotes — nothing fabricated
  has shipped.
- The founder has approved **clearly-marked placeholder testimonials** for design
  purposes, to be replaced with real ones later. These must be visibly
  identifiable as placeholder and must not render in production while unreplaced.
  Fabricated quotes presented as genuine are out of bounds.
- Real assets available: the working product itself (a live SMS loop), the
  archetype quiz and its four archetype readings, and the founder's own story.
- **Usage data is not yet established as citable.** Do not state reply rates,
  member counts, or outcome claims until the founder supplies real figures.

## Product Principles

1. **The thread is the product.** Design decisions serve the text conversation
   first; the web exists to start it, explain it, and give the user control.
2. **Silence is information, not failure.** Non-response is a first-class signal
   the system acts on gently, never a lapse the user is made to feel.
3. **Remember, then adapt.** Every reply should make the next message better. The
   user should feel met, not processed.
4. **Honest before persuasive.** Where a persuasion lever and the trusted-friend
   test conflict, the test wins — including when that costs conversion.
5. **Continuity over intensity.** The product's promise is a practice that
   survives an ordinary week, not a burst of motivation.

## Accessibility & Inclusion

- WCAG AA contrast is the established floor.
- Body copy on the message surfaces is set at 18px or larger for mobile
  readability; the messages feed uses semantic `<article>`, `<time>`, and
  `<section>` markup with ARIA labels and visible focus states.
- The primary audience skews toward reading on a phone, frequently one-handed and
  in low-attention moments. Mobile is the design case, not the adaptation.
