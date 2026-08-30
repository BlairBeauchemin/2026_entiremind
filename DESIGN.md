---
name: Entiremind
description: A lightly magical SMS companion — linen paper, cobalt ink, gold reserved for foil.
colors:
  cobalt: "#2A3A9C"
  cobalt-deep: "#233285"
  cobalt-wash: "#E7E9F4"
  linen: "#F2EFE9"
  surface: "#F8F5EE"
  ink: "#14120F"
  muted: "#5B5346"
  rule: "#D8CFBE"
  leaf: "#C9A24B"
  destructive: "#9A2B25"
  night: "#070A16"
  night-mid: "#0A1428"
  night-horizon: "#14243F"
  night-raised: "#101728"
typography:
  display:
    fontFamily: "Prata, Georgia, 'Times New Roman', serif"
    fontSize: "clamp(2.25rem, 1.4rem + 4vw, 4rem)"
    fontWeight: 400
    lineHeight: 1.08
    letterSpacing: "-0.01em"
  section:
    fontFamily: "Prata, Georgia, serif"
    fontSize: "clamp(2rem, 1.5rem + 2.2vw, 3.75rem)"
    fontWeight: 400
    lineHeight: 1.0
    letterSpacing: "normal"
  heading:
    fontFamily: "Prata, Georgia, serif"
    fontSize: "clamp(1.5rem, 1.1rem + 1.8vw, 2.25rem)"
    fontWeight: 400
    lineHeight: 1.18
    letterSpacing: "normal"
  lead:
    fontFamily: "Karla, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  body:
    fontFamily: "Karla, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  small:
    fontFamily: "Karla, ui-sans-serif, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
  label:
    fontFamily: "Karla, ui-sans-serif, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.1em"
  attribution:
    fontFamily: "Karla, ui-sans-serif, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.18em"
  device:
    fontFamily: "Karla, ui-sans-serif, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.45
    letterSpacing: "normal"
rounded:
  none: "0px"
  sm: "2px"
  md: "4px"
  pill: "999px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "40px"
  section: "128px"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.linen}"
    rounded: "{rounded.sm}"
    padding: "16px 40px"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-deep}"
    textColor: "{colors.linen}"
    rounded: "{rounded.sm}"
    padding: "16px 40px"
  button-primary-compact:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.linen}"
    rounded: "{rounded.sm}"
    padding: "10px 24px"
  button-secondary:
    backgroundColor: "{colors.linen}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "16px 40px"
  button-on-night:
    backgroundColor: "{colors.linen}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "12px 24px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "32px"
  card-roomy:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "40px"
  card-on-cobalt:
    backgroundColor: "{colors.cobalt-deep}"
    textColor: "{colors.linen}"
    rounded: "{rounded.sm}"
    padding: "32px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.small}"
    rounded: "{rounded.sm}"
    height: "48px"
    padding: "4px 12px"
  badge:
    backgroundColor: "{colors.cobalt-wash}"
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 16px"
  eyebrow:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
  error-panel:
    backgroundColor: "{colors.destructive}"
    textColor: "{colors.destructive}"
    rounded: "{rounded.sm}"
    padding: "12px"
---

# Design System: Entiremind

## Overview

**Creative North Star: "The Printed Almanac"**

An almanac is a daily companion you keep on a shelf — printed, dated, plain, and
consulted every morning. It is not an app pretending to be paper; it is paper that
happens to arrive by text. Entiremind sends one question a day and reads the answer,
and the whole visual system exists to make that exchange feel like something that was
set in type rather than rendered on a screen.

That constraint is literal, not romantic. Physical journals and card decks are a
stated product direction, so the identity is built to survive being printed: no
gradients standing in for depth, no glow, no backlit colour, no drop shadows. Depth is
a change of paper — linen to surface, or linen to cobalt — and hairlines in a warm
rule colour. Anything that would vanish on a press is not in the system.

The register is calm and warm, never clinical and never mystical-for-its-own-sake. The
house stance is *"thoughts are material, not master"*, so the visual language may carry
symbolism but must never imply prediction. There is exactly one place that leaves
daylight, and it is a place rather than a mode: The Space (`/space`) is a night sky.

**Key Characteristics:**

- Warm linen ground carries almost every surface; cobalt is spent, not sprayed
- High-contrast serif for meaning, humanist grotesque for mechanics — never blurred
- Near-square corners (2px); the pill is reserved for badges and true circles
- No shadows, no glass, no gradients, with two named exceptions
- Emphasis is a mid-sentence italic, never a heavier weight
- Gold behaves like foil: it appears only where it can physically be seen

## Colors

A warm neutral field with one saturated structural blue and a single metallic that is
never allowed to carry meaning on its own.

### Primary

- **Cobalt** (`#2A3A9C`): the company. Primary buttons, links, the logotype, focus
  rings, active states, and any full-bleed band that needs to assert brand. Chosen over
  a brighter blue specifically because gold clears 4.01:1 on it — at `#3B4EBF` gold
  drops to 2.89:1 and the foil treatment becomes impossible.
- **Cobalt Deep** (`#233285`): hover and pressed only, plus the ground for cards that
  sit *inside* a cobalt band.
- **Cobalt Wash** (`#E7E9F4`): tint backgrounds and badge fills. Never text.

### Neutral

- **Linen** (`#F2EFE9`): the default ground everywhere, and the text colour on cobalt
  and on night.
- **Surface** (`#F8F5EE`): the raised card sitting on linen. The shift is deliberately
  almost imperceptible, because the depth comes from the change of paper itself.
- **Ink** (`#14120F`): body and headings (16.29:1 on linen).
- **Muted** (`#5B5346`): secondary text, captions, placeholders (6.60:1 on linen). It
  is a warm brown-grey, not a tint of the foreground — a faded ink reads as broken.
- **Rule** (`#D8CFBE`): borders and hairlines only, never text.

### Accent

- **Leaf** (`#C9A24B`): gold, and ornament only — emblems, hairline rules, small marks,
  and the star of an affirmation. It is never text, never a button, never a fill behind
  text. Gold has exactly two homes: cobalt (4.01:1) and night (8.23:1).

### Status

- **Destructive** (`#9A2B25`): the single status colour. Error text, error panel tints
  at 10%, and their hairlines at 25%. A warm brick that belongs to the paper world
  rather than a stock alert red. 6.66:1 on linen and 5.68:1 on its own tint.

Success and warning have **no token yet**. Anything currently green or amber is off
system and awaiting a decision, not a convention to copy.

### Night

Used only inside The Space. **Night** (`#070A16`) is the sky at its darkest,
**Night Mid** (`#0A1428`) and **Night Horizon** (`#14243F`) are the two stops that make
the sky a real gradient, and **Night Raised** (`#101728`) is the drawer sitting on it.

### Named Rules

**The Foil Rule.** Gold lives on the dark grounds; ink lives on linen. A line-art
emblem on cobalt or night is gold. The same emblem on linen is ink, with gold permitted
only as small sparkles that carry no meaning. Gold on linen measures 2.09:1 — it fails
even the 3.0:1 floor for non-text graphics, so this is a legibility fact, not taste.

**The One Night Rule.** The Space is a dark *surface*, not a dark *mode*. A mode is the
same interface re-coloured and follows the viewer everywhere; a surface is one place
you deliberately go, the way a full-bleed cobalt band is one place. The sky is the
content, not a theme applied to content. No toggle, no `prefers-color-scheme`, and
nothing outside `/space` may touch the night tokens. Cobalt measures 2.05:1 there and
is unavailable — on night the company is carried by linen and gold.

**The Company Rule.** Cobalt owns every structural surface. A user's archetype colour
appears in exactly two places — the quiz reveal and the share card — and nowhere else.
Cobalt is not an archetype colour; the Visionary gets its own accent like the other
three, and those four accents are **still unchosen**. Do not invent them before the
reveal is designed.

**The No Spare Colour Rule.** Every value above has one job. A new colour has to
displace one rather than join them.

## Typography

**Display Font:** Prata (with Georgia, Times New Roman)
**Body Font:** Karla (with system sans)

**Character:** A high-contrast transitional serif against a humanist grotesque with
slightly quirky terminals. The serif is bookish and a little formal; the sans is plain
and unfussy. The pairing reads as a printed page with clean captions rather than as a
web app with a decorative headline.

Prata is an independent choice in the same *class* as the reference brand's face and is
deliberately not an attempt to match it. Intelligent Change ships Canela, Canela Text
and Euclid Circular A — confirmed by inspection, all commercial licences. What is worth
learning there is the strategy (a literary serif carrying voice, a geometric grotesque
carrying mechanics), which Prata + Karla runs in a different accent.

### Hierarchy

- **Display** (Prata 400, `clamp(2.25rem, 1.4rem + 4vw, 4rem)`, 1.08, -0.01em): one per
  viewport, page-opening only. Renders 64px at desktop.
- **Section** (Prata 400, `clamp(2rem, 1.5rem + 2.2vw, 3.75rem)`, 1.0): section openers
  — "The Philosophy of Less", "How It Works", "Membership". Renders 48–60px and is what
  gives the landing page its editorial rhythm.
- **Heading** (Prata 400, `clamp(1.5rem, 1.1rem + 1.8vw, 2.25rem)`, 1.18): sub-heads and
  card titles. Renders 24–36px.
- **Lead** (Karla 400, 20px/1.625, ink): the paragraph directly under a display or
  section opener.
- **Body** (Karla 400, 17px/1.6, muted for secondary and ink for primary): running text.
  Cap the measure around 68ch.
- **Small** (Karla 400, 14px/1.625): dense UI, table cells, helper text, inputs.
- **Label** (Karla 500, 11px, 0.1em, uppercase): eyebrows, badges, controls.
- **Attribution** (Karla 500, 10px, 0.18em, uppercase): quote sources, timestamps,
  captions under emblems.
- **Device** (Karla 400, 15px/1.45): iOS message facsimile only — see below.

### Named Rules

**The Mid-Sentence Italic Rule.** Emphasis is set by switching a clause to italic
inside the sentence — *"manifestation that texts back"* — never by bolding, colouring
or enlarging it. This is the single most characteristic typographic move in the system,
and it is also a necessity: Prata ships one weight, so asking for bold produces a
synthesised smear. Headings are pinned to 400 in the base layer.

**The Tracked Caps Rule.** No uppercase string anywhere without letter-spacing.
Untracked caps read as shouting; tracked caps read as engraved. The floor in practice
is 0.1em, and the attribution step goes to 0.18em.

**The Two Voices Rule.** The serif carries meaning, the sans carries mechanics, and
they never blur. A button never uses the serif; a headline never uses the sans. In the
dashboard message card this is what distinguishes the prompt from the reply — a
difference in kind, not in weight.

**The Foreign Chrome Rule.** `phone-mockup.tsx` renders someone else's design system on
purpose. Its bubble radius (18px) and its 15px/10px type are Apple's values, and the
`device` step exists so they sit on a documented ramp instead of reading as drift. The
messages inside it are set in the **sans**: a text message carries no typography at all,
and setting the mockup in Prata would advertise something the product cannot do.
Nothing else may use `device`.

## Layout

Content is centred in a `1180px` (`max-w-7xl`) container with `24px` gutters. Sections
are separated by generous vertical rhythm — `128px` top and bottom at desktop, `96–112px`
inside cobalt bands — never by rules or boxes. Full-bleed is reserved for a cobalt band
or a single image; a floating rounded slab reads as a card, edge-to-edge reads as a
change of paper.

Reading measure caps around 68ch. Card grids run 2–4 columns at desktop with `32px`
gutters and collapse to a single column below `768px`.

Mobile-first is a product fact rather than a preference: the audience is reached on a
phone, in a messages app. Every layout resolves at `390px` with no horizontal scroll,
and wide content scrolls inside its own container rather than the page body. The fixed
navigation is `96px` tall and sits on an opaque linen ground.

## Elevation & Depth

**There are no drop shadows.** This follows directly from the printed-object goal:
paper does not glow, and a system that leans on shadow cannot be pressed. Depth is
expressed two ways and only two ways — a change of ground (linen → surface, or linen →
cobalt → cobalt-deep) and a `1px` hairline in rule.

Two exceptions exist, both physical rather than decorative:

### Shadow Vocabulary

- **Contact shadow** (`box-shadow: 0 18px 40px -24px rgba(20,18,15,0.45)`): permitted
  under the phone mockup, which is an object sitting on the page rather than a raised
  panel. Nowhere else.
- **Night scrim** (`text-shadow: 0 2px 24px rgba(7,10,22,0.85)`): the affirmation at
  `/space` sits over moving stars and needs the sky darkened directly behind the
  letterforms. A legibility device, not elevation.

### Named Rules

**The Pressed-Flat Rule.** If an element needs to feel raised, change its paper. Do not
reach for a shadow, a blur, a glass panel, or a glow — all four were removed from this
codebase deliberately and none of them survive being printed.

## Shapes

Near-square. The default radius is `2px` — enough to avoid looking accidental, not
enough to read as a web app. Cards, buttons, inputs and panels all take it. The larger
Tailwind steps are clamped to `4px` in `globals.css` on purpose: the system should not
be *able* to produce a bubbly corner.

`rounded-full` is reserved for badges, status dots, avatars and true circles — anything
where roundness is the geometry rather than a softening. The two arbitrary radii in the
codebase are both physical objects: the phone body (`3.25rem`) and its iOS message
bubbles (`18px`).

Line art is drawn with even-weight strokes (~1.3px at 120px), strictly symmetrical, no
fills, no perspective, no shading.

## Components

### Buttons

- **Shape:** near-square (`2px`), never a pill.
- **Primary:** cobalt ground, linen label, `16px 40px` padding at hero scale and
  `10px 24px` in navigation and dense contexts. Sentence case at 18px (hero) or 14px
  (compact) — this is the built reality and it differs from the tracked-caps label the
  seed proposed.
- **Hover / Focus:** the ground deepens to cobalt-deep. It does not lift, scale, or
  glow. Focus-visible is a `2px` cobalt ring at `2px` offset; the outline is never
  removed.
- **Secondary:** linen or transparent ground with a `1px` cobalt border and ink label,
  same padding as primary.
- **On night:** a *paper* button — linen ground, ink label — because cobalt disappears
  at 2.05:1 there and gold may never fill a button.

### Cards / Containers

- **Corner Style:** `2px`.
- **Background:** surface on linen; cobalt-deep when the card sits inside a cobalt band.
- **Shadow Strategy:** none — see Elevation & Depth.
- **Border:** `1px` rule hairline, all four sides. A thick one-sided accent border is a
  refused pattern and was removed from the message and quote cards.
- **Internal Padding:** `32px` standard, `40px` for roomy editorial cards.

### Inputs / Fields

- **Style:** surface fill, `1px` rule border, `2px` radius, `48px` tall, ink text at
  14px with muted placeholder.
- **Focus:** the border shifts to cobalt and takes the cobalt ring.
- **Error:** destructive text beneath the field. Colour is never the only signal — pair
  it with a worded message. Panel errors use a destructive/10 tint with a destructive/25
  hairline.
- **Autofill:** overridden to keep the surface fill and ink text rather than the
  browser's pale blue.

### Badges

- **Style:** cobalt-wash or surface ground, ink label, `999px` radius, `6px 16px`
  padding, 11px uppercase tracked 0.1em.
- **State:** status badges (Past Due, Cancelled, Trial Ended) share the shape and swap
  the ground tint.

### Navigation

Fixed, `96px` tall, opaque linen with a `1px` rule bottom hairline. The wordmark is
Prata at 24px mobile / 30px desktop, tracked `2px`. Links are ink at 14px and resolve to
cobalt on hover — this is cobalt doing its documented job as the link colour. Below
`768px` the links collapse behind a hamburger and the CTA shortens to fit beside the
wordmark.

### The Sky (signature)

`/space` renders a canvas starfield: a sparse ambient field seeded from the user's id
plus one bright gold star per affirmation, placed by its own id hash and ignited when
saved. One rAF loop, no React state per frame; the breath is published to CSS as
`--breath` and read by a `calc()`. Glows are pre-rendered sprites rather than per-star
gradients. `prefers-reduced-motion` removes twinkle, drift, pan, flare and glow, and
turns ignition into a fade.

## Do's and Don'ts

### Do:

- **Do** let linen carry most of the page, and spend cobalt where it means something.
- **Do** put gold on cobalt or on night, and ink on linen.
- **Do** set emphasis with a mid-sentence italic rather than a heavier weight.
- **Do** track every uppercase string — 0.1em floor, 0.18em for attribution.
- **Do** express depth as a change of ground plus a `1px` rule hairline.
- **Do** pair every error colour with a worded message.
- **Do** resolve every layout at `390px` with no horizontal page scroll.

### Don't:

- **Don't** use gold as text, on any ground, at any size.
- **Don't** add a drop shadow, glass panel, blurred orb or background gradient to make
  something feel raised.
- **Don't** reintroduce teal `#204147`, navy `#2E2A58`, purple `#cbbbe3`, yellow
  `#f9d97a` or cream `#fdfbf7`. They resolve to nothing now, by design.
- **Don't** use the night tokens outside `/space`, or add a theme toggle.
- **Don't** reach for cobalt on the night ground — it measures 2.05:1 and vanishes.
- **Don't** invent archetype accent colours before the reveal is designed.
- **Don't** put a colour value in a JS prop (`rgb(...)` inside a `style` or an `animate`
  object). The detector only reads literal hex and class names, so a colour hidden there
  survives migrations invisibly — this happened twice in this codebase.
- **Don't** copy the reference brand's commerce patterns — mystery-discount popups,
  struck-through pricing and volume-purchase urgency all fail the trusted-friend test in
  `docs/design-philosophy.md`, which outranks any visual reference.
- **Don't** let a surface imply prediction. Symbolism yes; fortune-telling no.
