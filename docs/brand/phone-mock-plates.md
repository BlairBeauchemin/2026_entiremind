# Phone mock plates

Three photographic "stages" for the landing-page phone mock, with the real
thread composited on top in DOM. Viewable at `/mock/phone` (noindex, not linked
from anywhere).

Nothing on the landing page changed. `hero.tsx`, `testimonials.tsx` and `/v2`
still render the drawn `PhoneMockup`, which is unchanged.

## Why hybrid

The reference images the founder picked are photographs — linen, raking
daylight, matte cobalt, deckle-edge paper. DESIGN.md has no photography
direction for the Daylight world, and `public/` had no brand imagery at all, so
this is the first of either.

The SMS copy is the most important content on the page, so it is **not** baked
into the photograph. A model cannot set Prata and Karla, and copy baked into a
JPEG cannot be edited. Instead the photograph supplies light and ground with a
**blank** phone screen, and `ThreadScreen` is projected onto the glass.

DESIGN.md's bans on gradients, glow and shadows govern UI surfaces, not
photographs — a photograph of linen in daylight is made of gradients. The bans
still bind every pixel of the composited screen, which stays flat: no gloss, no
glare, no added shadow.

## The plates

| File                                | Composition                   | Notes                                             |
| ----------------------------------- | ----------------------------- | ------------------------------------------------- |
| `public/mock/phone/plate-flat.webp` | Overhead, phone flat on linen | Screen square to camera; near-affine projection   |
| `public/mock/phone/plate-hand.webp` | Held in hand                  | Largest screen area, so most legible when small   |
| `public/mock/phone/plate-lean.webp` | Leaning on a cobalt arch      | Real perspective; closest to the chosen reference |

Generated with Higgsfield `gpt_image_2_5`, `4:5`, `quality: high`,
`resolution: 2k`, with the founder's hero reference passed as
`image_references`. Nine candidates (three per composition) at 3 credits each;
**27 credits total**, no re-rolls needed. Two of the nine submissions came back
`429 rate_limit_reached` and were simply not retried — seven candidates was
enough to choose from.

Originals were 1792×2240 PNG (17 MB total). Shipped as WebP at 1400px wide,
quality 82 — **616 KB total**. Corner fractions are resolution-independent, so
re-encoding does not invalidate them.

### Prompt spine

Every prompt carried these, and they are the parts that matter:

- Warm linen `#F2EFE9` ground, woven texture; single warm window light, raking,
  long soft shadow; medium-format editorial, shallow depth of field.
- Props only from the brand world: matte cobalt `#2A3A9C` plaster forms, small
  brass disc, deckle-edge cream paper.
- **Screen blank and powered off** — flat, evenly lit warm off-white, no UI, no
  icons, no text.
- **No glare, reflection, highlight or fingerprint over the screen.** This is
  the load-bearing constraint. Anything on the glass breaks the composite.
- All four screen corners visible and unobstructed; screen plane near-parallel
  to the camera.
- "Printed and tactile, not a 3D render, not a glossy tech advertisement."
- For `lean`: _"NOT a phone stand, NOT a dock, NOT a tripod, NOT an electronics
  accessory"_ — the founder explicitly did not want a stand. A sculptural
  plaster form reads as a prop; say so four ways or the model reaches for a
  gadget.

## Re-measuring the corners after a re-shoot

`PLATES` in `src/lib/mock/plates.ts` stores each screen's four corners as
fractions of the plate. They were **measured, not eyeballed**: threshold the
image for bright, desaturated pixels, take connected components, discard any
component touching the image border (that is the linen), and the largest
survivor is the screen — the bezel is what encloses it. The extreme points by
`x+y` and `x−y` give tl/br and tr/bl.

Verify a new measurement by compositing the quad back over the plate as a
translucent polygon and looking at it. A wrong corner does not throw; it renders
a slightly skewed screen, which is easy to miss and impossible to unsee later.

`src/lib/mock/plates.test.ts` asserts every plate still yields a real transform.
That test exists because a null transform renders a blank screen over a
perfectly good photograph, which reads as a CSS bug and is not one — exactly the
failure hit while building this.

## How the composite works

`src/lib/mock/screen-projection.ts` solves the homography taking the flat
340×680 screen rect to the four measured corners and emits a CSS `matrix3d`.
A 2D rotate-and-scale cannot land a trapezoid, and `plate-lean` is a trapezoid.

The composite is laid out in a fixed 560×700 stage so the matrix has a stable
coordinate space; `.plate-stage` in `globals.css` scales the whole stage as one
unit at narrow widths, because scaling the photograph and the screen separately
would slide the screen off the glass. Verified: **no horizontal overflow at
390px**.
