---
name: Entiremind
description: A lightly magical SMS companion — linen ground, cobalt ink, gold reserved for foil.
colors:
  cobalt: "#2A3A9C"
  cobalt-deep: "#233285"
  cobalt-wash: "#E7E9F4"
  linen: "#F2EFE9"
  surface: "#F8F5EE"
  ink: "#14120F"
  muted: "#5B5346"
  leaf: "#C9A24B"
  rule: "#D8CFBE"
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
  heading:
    fontFamily: "Prata, Georgia, serif"
    fontSize: "clamp(1.5rem, 1.1rem + 1.8vw, 2.25rem)"
    fontWeight: 400
    lineHeight: 1.18
    letterSpacing: "normal"
  body:
    fontFamily: "Karla, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Karla, ui-sans-serif, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.2em"
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
  md: "20px"
  lg: "32px"
  xl: "56px"
  section: "clamp(56px, 9vw, 112px)"
components:
  button-primary:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.linen}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "14px 32px"
  button-primary-hover:
    backgroundColor: "{colors.cobalt-deep}"
    textColor: "{colors.linen}"
    rounded: "{rounded.sm}"
    padding: "14px 32px"
  button-secondary:
    backgroundColor: "{colors.linen}"
    textColor: "{colors.cobalt}"
    typography: "{typography.label}"
    rounded: "{rounded.sm}"
    padding: "13px 31px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.sm}"
    padding: "24px"
  card-cobalt:
    backgroundColor: "{colors.cobalt}"
    textColor: "{colors.linen}"
    rounded: "{rounded.sm}"
    padding: "24px"
  input:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "12px 14px"
  eyebrow:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
  badge:
    backgroundColor: "{colors.cobalt-wash}"
    textColor: "{colors.cobalt-deep}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "5px 12px"
---

# Entiremind Design System

> **This was a SEED; the world has now shipped.** Every surface was migrated onto
> this palette and type system in one pass — `src/app/globals.css` holds the tokens,
> and no retired name survives anywhere in `src/`. Colour, typography and the named
> rules below are **decided and binding**.
>
> Component-level values below are still the seed's directional starting points
> rather than observed truth. **Next step: run `/impeccable document` in scan mode**
> and let the built world correct them. One known mismatch to settle there: several
> landing section openers render at 48–60px, above the 36px `heading` step — either
> the ramp gains a step or those headings come down.

## Overview

Entiremind is an SMS companion that texts one question a day and listens to the
answer. The brand has to work in two places that could not be less alike: a plain
160-character text message with no formatting at all, and a web surface that must
look established enough for a stranger to hand over a phone number.

The world is **daylight**: warm linen paper, near-black ink, a single saturated
cobalt, and gold used the way a printer uses foil — sparingly, and only where it
can actually be seen. It should read as something **printed** rather than something
rendered. That is a deliberate constraint, not a style preference: physical journals
and card decks are a stated future direction, and an identity built on gradients,
glow or backlit colour cannot survive being put on paper.

There is **one exception, and it is a place rather than a mode**: The Space
(`/space`) is a night sky. See "One night surface" below. Everything else is
daylight, and there is no theme switch anywhere in the product.

The register is calm and warm, never clinical and never mystical-for-its-own-sake.
The house stance is *"thoughts are material, not master"* — the visual language may
carry symbolism, but it must never imply prediction.

## Colors

### Primary

**Cobalt `#2A3A9C`** is the company. It carries every structural element: primary
buttons, links, the logotype, focus rings, active states, and any surface that needs
to assert brand. It was chosen over a brighter cobalt specifically because gold
ornament clears 4.01:1 on it — at `#3B4EBF` gold drops to 2.89:1 and the foil
treatment becomes impossible.

`cobalt-deep #233285` is hover/pressed only. `cobalt-wash #E7E9F4` is for tint
backgrounds and badges — never for text.

### Neutral

**Linen `#F2EFE9`** is the default ground everywhere. **Surface `#F8F5EE`** is the
raised card sitting on it — the shift is deliberately small, because depth here comes
from a change of paper, not from a shadow. **Ink `#14120F`** is body and heading text
(16.29:1 on linen). **Muted `#5B5346`** is secondary text and captions (6.60:1).
**Rule `#D8CFBE`** is borders and hairlines only.

### Accent

**Leaf `#C9A24B`** is gold, and it is **ornament only** — emblems, hairline rules,
and small marks. It is never text, never a button, never a fill behind text. Gold on
linen measures 2.09:1, which fails even the 3.0:1 floor for non-text graphics, so the
restriction below is a legibility fact, not taste. Gold has exactly two homes: cobalt
and night.

### Named Rules

**Gold lives on the dark grounds, ink lives on linen.** A line-art emblem rendered on
cobalt or on night is gold (4.01:1 and 8.23:1). The same emblem on a linen ground is
**ink**, with gold permitted only as small decorative sparkles that carry no meaning.
This is what the reference brand actually does — foil on the coloured boxes, black
line art on the linen cover — and it is the only way one gold value survives every
ground in the system.

**Cobalt is the company; the archetype colour is the person.** Cobalt owns every
structural surface. A user's archetype colour appears in exactly two places — the
quiz reveal and the share/OG card — and nowhere else. Cobalt is not an archetype
colour; The Visionary gets its own accent like the other three.

**Never show a colour with no job.** Every value above has one role. If a new colour
is needed, it has to displace one of these rather than join them.

**One night surface, and it is not a dark mode.** The Space (`/space`) is a night
sky, and it is the only place in the product that is not on linen. The distinction is
load-bearing: a dark *mode* is the same interface re-coloured and follows the viewer
everywhere, which this product does not have and will not get. A dark *surface* is
one place you deliberately go, the way a full-bleed cobalt band is one place — the
sky is the content, not a theme applied to content. There is no toggle, nothing
outside `/space` may use the night tokens, and `prefers-color-scheme` is not read
anywhere.

The night ramp is `night #070A16` (the sky at its darkest), `night-mid #0A1428` and
`night-horizon #14243F` (the two stops that make the sky a real gradient, which a sky
genuinely is — the no-gradient rule is about faking depth on paper, not about
depicting an actual night), and `night-raised #101728` (the drawer sitting on the
sky).

What changes on that ground, measured:

| | on night | |
|---|---|---|
| Linen text | 17.20:1 | body and the affirmation |
| Gold ornament | 8.23:1 | the stars — this is gold's second home |
| Rule hairline | 12.77:1 | borders |
| **Cobalt** | **2.05:1** | **unavailable — it disappears** |

So on night the company is carried by **linen and gold**, not by cobalt. A primary
action there is a *paper* button — linen ground, ink label — because cobalt would
vanish and gold may never fill a button on any ground. Secondary text bottoms out at
`linen/60` (6.45:1); `linen/35` measures 2.87:1 and fails.

### Retired

`teal #204147`, `navy #2E2A58`, `purple #cbbbe3`, `yellow #f9d97a`, `cream #fdfbf7`.
These were documented inconsistently in `CLAUDE.md` for months — teal was declared
primary while the code used navy. All five are **gone from the codebase** as of the
big-bang migration: no aliases were left behind, so a retired name is now a build-time
nothing rather than a silent fallback. **This file is the only palette authority.**

Retired alongside them, for the same printed-object reason: full-page blurred colour
orbs, `backdrop-blur` glass panels, drop shadows, and background gradients. Paper does
not glow. The one permitted shadow is a single soft contact shadow under the phone
mockup, which is an object sitting on the page rather than a raised panel.

### Open decision

The four archetype accents (Visionary, Alchemist, Seeker, Phoenix) are **not chosen
yet.** Constraint when they are: all four sit at similar depth and saturation to
cobalt so they read as siblings rather than a rainbow, and each must clear 4.5:1
against linen for text and 3.0:1 for ornament. Decide when the reveal is designed —
do not invent them earlier.

## Typography

**Prata** for display and headings. **Karla** for body, UI and labels. Serif carries
meaning; sans carries mechanics. The two never blur — a button never uses the serif,
a headline never uses the sans.

Prata is an independent choice in the same *class* as the reference brand's face, and
is deliberately **not** an attempt to match it. Copying a competitor's exact typeface
produces a knockoff, not a peer.

That reference face is now confirmed rather than guessed. Intelligent Change ships
**Canela** (Commercial Type) for display, **Canela Text** for running copy, and
**Euclid Circular A** (Swiss Typefaces) for the sans — self-hosted woff2, both
commercial licences. The earlier teardown's "reads as Canela or Tiempos Headline" was
half right. What that settles is the *strategy*, which is the part worth learning
from: a warm literary serif carrying voice, a geometric grotesque carrying mechanics.
Prata + Karla runs the same structure in a different accent — Prata has far higher
stroke contrast than Canela's near-sans modulation, and Karla is humanist where Euclid
is geometric. Same idea, different face, no licence to buy.

### Hierarchy

| Role | Face | Notes |
|---|---|---|
| Display | Prata, `clamp(2.25rem, 1.4rem + 4vw, 4rem)` | One per viewport. Tight leading (1.08), slight negative tracking. |
| Heading | Prata, `clamp(1.5rem, 1.1rem + 1.8vw, 2.25rem)` | Section openers. |
| Body | Karla 400, 1.0625rem/1.6 | Max ~68ch measure. |
| Label / eyebrow | Karla 500, 0.6875rem, `0.2em` tracking, uppercase | Section kickers, buttons, controls. |
| Attribution | Karla 500, 0.625rem, `0.18em` tracking, uppercase | Quote sources, captions under emblems. |
| Device | Karla 400, 0.9375rem/1.45 | iOS message facsimile only — see the rule below. Never product UI. |

### Named Rules

**Italic inside the sentence, not around it.** Emphasis is set by switching a clause
to italic mid-sentence — *"our beliefs create the world we live in"* — rather than by
bolding, colouring, or enlarging it. This is the single most characteristic
typographic move in the system.

**Uppercase always gets tracking.** No uppercase text anywhere below `0.18em`
letter-spacing. Untracked caps read as shouting; tracked caps read as engraved.

**The display face never sets a paragraph.** Prata above ~1.5rem only.

**The phone mockup renders iOS, not us.** `src/components/landing/phone-mockup.tsx`
is a facsimile of the phone's own Messages app, which is the entire product surface.
Its bubble radius and its 15px/10px type are Apple's values, and the `device` step
exists so they sit on a documented ramp instead of reading as drift. The messages
inside it are set in the **sans**: a text message carries no typography at all, and
setting the mockup in Prata would advertise something the product cannot do. Nothing
else may use `device`.

## Layout

Generous vertical rhythm — sections separated by `clamp(56px, 9vw, 112px)`, not by
rules or boxes. Reading measure caps at ~68ch. Content is centred within a max width
around 1180px; full-bleed is reserved for a cobalt band or a single image.

Mobile-first is a product fact, not a preference: the audience is reached on a phone.
Every layout must resolve at 390px with no horizontal scroll — wide content (tables,
code, diagrams) scrolls inside its own container, never the page body.

## Elevation & Depth

**There are no drop shadows.** Depth is expressed by a change of ground — linen to
surface, or linen to cobalt — and by hairline rules in `rule #D8CFBE`. This follows
directly from the printed-object goal: paper does not glow, and a system that leans on
shadow cannot be printed. A single soft contact shadow is permitted under a
photographed product object, and nowhere else.

## Shapes

Near-square. Default radius is `2px` — enough to avoid looking accidental, not enough
to read as a web app. Cards, buttons and inputs all take it. **`pill` is reserved for
badges only.** Emblems and line art are drawn with even-weight strokes (~1.3px at
120px), strictly symmetrical, no fills, no perspective, no shading.

## Components

### Buttons

Primary is cobalt with linen text, `2px` radius, `14px 32px` padding, label
typography (uppercase, tracked). Hover deepens to `cobalt-deep` — it does not lift,
scale, or glow. Secondary is linen with a `1px` cobalt border and cobalt text.
Focus-visible is a `2px` cobalt ring at `2px` offset, never a removed outline.

### Cards

Surface on linen, `2px` radius, hairline `rule` border, no shadow. A cobalt card
inverts to linen text and is the only place gold ornament may appear.

### Emblems

One per archetype, all in a single drawing system — the same hand, a different
symbol. Ink on linen, gold on cobalt. An emblem is always paired with its archetype
name in Prata and its essence line beneath; it never floats alone as decoration.

### Inputs

Surface fill, `1px rule` border, `2px` radius, ink text, muted placeholder. Focus
takes the cobalt ring. Error text is never the only signal — pair colour with a
worded message.

## Do's and Don'ts

**Do** let linen carry most of the page, and spend cobalt where it means something.
**Do** put gold on cobalt or on night, and ink on linen.
**Do** set emphasis with a mid-sentence italic.
**Do** track every uppercase string.

**Don't** use gold as text, on any ground, at any size.
**Don't** add a drop shadow to make something feel raised.
**Don't** reintroduce teal, navy, purple, yellow or cream.
**Don't** invent archetype accent colours before the reveal is designed.
**Don't** use the night tokens outside `/space`, or add a theme toggle. One place,
not a mode.
**Don't** reach for cobalt on the night ground — it measures 2.05:1 and vanishes.
**Don't** copy the reference brand's commerce patterns — mystery-discount popups,
struck-through pricing, and volume-purchase urgency all fail the trusted-friend test
in `docs/design-philosophy.md`, which outranks any visual reference.
**Don't** let a surface imply prediction. Symbolism yes; fortune-telling no.
