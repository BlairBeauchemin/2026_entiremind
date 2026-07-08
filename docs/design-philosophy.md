# Entiremind Design Philosophy

*Behavioral design principles for every user-facing decision.*

Entiremind competes on **learning velocity, not features**. The product is a calm,
lightly magical companion that texts back. That means the way we design — the copy on
a button, the order of a flow, whether a number has context — is not decoration. It is
the product.

This document is required reading before any change to a user-facing surface
(onboarding, SMS, dashboard, paywall, landing). It codifies six persuasion principles
drawn from established behavioral science, translated into Entiremind rules.

---

## The guardrail (read this first)

Our brand promise is **calm, lightly magical, "no guilt, no nagging."** These
principles are tools of *service*, never pressure. Before shipping anything that uses
a lever below, it must pass the **trusted-friend test**:

> Would this feel warm and honest coming as a text from a trusted friend — or would it
> feel like a growth hack?

If it would feel manipulative, we don't ship it. Concretely, we **never**:

- manufacture fake urgency or fake scarcity ("only 2 spots left!"),
- use shame or guilt as a loss lever ("you're falling behind"),
- build streaks, leaderboards, or productivity theater,
- hide the real cost of an action, or obscure how to pause/cancel,
- dark-pattern a user into a purchase or a reply.

Persuasion here always points at the same target: helping the user actually move
toward what they said they want. If a technique doesn't serve *their* intention, it's
out — no matter how well it converts.

---

## The six principles

Each principle below gives the psychology, **the Entiremind rule**, where it already
lives in our product, and a do / don't in our voice.

### 1. Smart defaults — reduce decision fatigue

*More choices don't mean better; they mean harder. When Iyengar & Lepper displayed 24
jams, 3% bought; with 6, 30% did. 70–90% of users never change a default — a good
default reads as a recommendation.*

**Rule:** Pre-select the most common choice. Never make the user decide something we
can already infer or reasonably assume.

- **Where it lives:** `preferred_send_hour` defaults to 7; timezone defaults; content
  selection has sensible config defaults.
- **The boundary:** the archetype quiz answers must stay the user's *own* — pre-selecting
  persona answers would both corrupt scoring and destroy the endowment effect (§4).
  Smart defaults are for logistics (send time, plan, phone format), not for identity.
- **Do:** pre-fill a known name/phone from lead capture; pre-select the plan most people pick.
- **Don't:** show an empty form field when we already know the answer.

### 2. Goal-gradient / progress — never start at zero

*People accelerate as they near a goal. In the car-wash study, a card with 2 of 10
stamps pre-filled completed at ~2× the rate of an empty 8-stamp card — same work, better
framing. You get to choose where the starting line is.*

**Rule:** Reframe already-done work as step one. Show momentum, and "almost there" near
the finish. Never render progress as 0% or a flat, uncountable bar.

- **Where it lives — and the gap:** onboarding progress is currently a flat row of 15
  undifferentiated dots with no head-start and no "almost done" cue. This is the clearest
  miss in the product.
- **Do:** "You've already told us who you are — 2 steps left." A gentle "you've reflected
  12 times" on the dashboard (calm, not a streak — see CLAUDE.md).
- **Don't:** streaks, "don't break your chain," counters that punish a missed day.

### 3. Reciprocity — give before you ask

*When someone gives first, we feel a pull to give back. Cialdini ranked it the single
most powerful driver of behavior; grocery samples lift purchases dramatically. Costco,
Spotify, and Notion all give real value before the ask.*

**Rule:** Deliver something genuinely useful *before* asking for anything — a signup, a
payment, a reply.

- **Where it lives:** our best example is the SMS loop — every substantive inbound reply
  gets a mirror or a soft-ack, so the system always answers. The free personalized
  archetype read is given before any payment.
- **The gap:** the paywall violates this — a bare "Upgrade" button with no recap of the
  value the user has already accumulated.
- **Do:** show the user what Entiremind has learned about them *before* the upgrade ask;
  deliver the first real prompt while the reveal is still fresh.
- **Don't:** "create an account to see your results"; lock value the user already earned
  behind a wall.

### 4. IKEA effect / endowment — we value what we build and own

*People value things they built themselves far more than identical things they didn't
(the IKEA effect). Merely *owning* something is enough (endowment). Duolingo has you
finish a lesson before it ever asks you to sign up.*

**Rule:** Let users build something and see their own words reflected back *before* we
ask them to commit. The more they invest, the more leaving feels like a loss.

- **Where it lives:** the 15-step archetype quiz is the flagship — users build their
  intention, vision, and values and receive a persona they own. CTAs say "Continue,"
  not "Sign up."
- **The gap:** vision and aligned-state answers are collected but never echoed back until
  the very end. There's a lot of unused endowment mid-flow.
- **Do:** reflect the user's own phrasing back within the flow; give them a persona/result
  that is unmistakably *theirs* (and shareable).
- **Don't:** a bare email + password screen with nothing on it that belongs to the user.

### 5. Loss aversion / status-quo bias — frame the ask as "keep," not "get"

*Kahneman showed the pain of losing is ~2× the pleasure of gaining the same thing.
Humans are wired to protect what they already have.*

**Rule:** Frame commitments as protecting what the user has built — their memory, their
archetype, their reflections — rather than acquiring something new. **Gently.** This is
the principle most likely to collide with our guardrail, so loss framing is always
warm, never guilt.

- **Where it lives — and the gap:** loss framing today is only reactive (cancellation and
  past-due copy). The pause flow is neutral; there is no proactive "here's what stays with
  you" framing.
- **Do:** "Your reflections and everything Entiremind has learned about you stay right
  here." "We'll hold your place."
- **Don't:** "you'll lose your streak," countdowns, "you're about to fall behind,"
  anything that reads as a threat.

### 6. Anchoring / contrast — control the first number

*The brain evaluates every number relative to the one it saw just before. $50 feels
huge alone, trivial ("2.6%") next to a $1,900 laptop. Restaurants anchor with a $90
steak so the $40 salmon feels reasonable.*

**Rule:** Never show a price — or any number — in isolation. Control what the user sees
first: a per-day breakdown, a savings percentage, or an honest reference point.

- **Where it lives — and the gap:** **no prices appear anywhere in the product today** —
  monthly vs. yearly is shown with no dollar figures at all. This is the single biggest
  anchoring miss.
- **Do:** "$X/year — about a coffee a month," yearly shown against monthly with the real
  savings %, value recap before the number.
- **Don't:** a lone "$50/mo"; a fake crossed-out "original" price we never charged.

---

## Design-review checklist

Run every user-facing change against these questions. This is the mechanism that keeps
the philosophy alive — reference it in PRs.

- [ ] **Reciprocity** — Does this screen ask for something before giving real value?
- [ ] **Anchoring** — Is any number (especially a price) shown without context?
- [ ] **Goal-gradient** — Does progress start at zero when it doesn't have to?
- [ ] **Smart defaults** — Is a field empty where we already know the common answer?
- [ ] **Endowment** — Has the user built or been shown something that's *theirs* before we ask them to commit?
- [ ] **Loss aversion** — If we're asking them to keep/stay, is it framed as protecting what they built (warmly), not as a threat?
- [ ] **Guardrail** — Does every line pass the trusted-friend test?

---

*Companion documents:* the current, prioritized application backlog lives at
`docs/plans/2026-07-08-psychology-principles-backlog.md`.
