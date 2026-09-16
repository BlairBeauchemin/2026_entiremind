import Image, { type StaticImageData } from "next/image";
import { PhoneMockup } from "@/components/landing/phone-mockup";

/**
 * The photographic stage the hero is built on.
 *
 * The room IS the hero — edge to edge, with the headline set on the plaster and
 * the live `PhoneMockup` standing on the table. The plates are generated WITHOUT
 * a phone in them: baking the message thread into the photograph would make the
 * conversation — the entire product — unselectable, invisible to screen readers
 * and soft on high-DPI displays. The photograph supplies light, material and
 * place; every word on the screen is real DOM.
 *
 * Two measured numbers drive every offset below, taken off the plates rather
 * than guessed: the tablecloth edge sits 16-18% up from the bottom of the frame,
 * and the cobalt vase occupies the far right from about x 86% outward. So the
 * phone belongs near x 66% — clear of the vase on one side and of the headline's
 * text field on the other.
 *
 * ## The one invariant that keeps the phone on the table
 *
 * `object-cover` crops whenever the container's ratio differs from the asset's,
 * and which axis it crops decides which percentage offsets are trustworthy:
 *
 *   - container relatively WIDER than the plate -> width-driven; vertical
 *     offsets drift as the viewport changes. This must never happen.
 *   - container relatively TALLER -> height-driven; the rendered height equals
 *     the box height exactly, so vertical offsets are stable and only the
 *     horizontal ones drift.
 *   - ratios equal -> no crop at all, both axes exact.
 *
 * Every branch below is sized so the box is never relatively wider than its
 * plate, which is why the heights look oddly specific. `min-h-[215vw] sm:min-h-[150vw]` on the
 * 3:4 plate forces a 0.70 ratio; `aspect-[16/9]` with a `min-h` floor on the
 * 16:9 plate either matches exactly or falls to the taller case. Horizontal
 * drift is absorbed by the wide run of empty tabletop the plates were composed
 * for, and `object-position` favours the right so a crop never eats the vase.
 */
interface V3HeroSceneProps {
  /** Wide plate for md and up. Swapping candidates is a one-line change. */
  wide: StaticImageData;
  /** 3:4 plate for phones. */
  tall: StaticImageData;
  /**
   * Where the table surface sits in `wide`, as a distance up from the bottom of
   * the frame. This travels WITH the plate because it differs between them —
   * measured off the rendered page by luminance profile, not estimated. Get it
   * wrong and the device stands in front of the table rather than on it.
   */
  tableLine: string;
  children: React.ReactNode;
}

export function V3HeroScene({
  wide,
  tall,
  tableLine,
  children,
}: V3HeroSceneProps) {
  return (
    <div className="relative isolate">
      <div
        /* w-full is load-bearing, not decoration: with width left to block
           layout, `aspect-ratio` resolves the box's WIDTH from the min-height
           instead of its height, so at 1024 the stage computed 1351px wide and
           shoved the headline off-centre. Pinning the width makes aspect-ratio
           govern height only. */
        className="relative w-full overflow-hidden
                   min-h-[215vw] sm:min-h-[150vw]
                   md:min-h-[780px]
                   lg:aspect-[16/9] lg:min-h-[880px]"
      >
        <Image
          src={tall}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover md:hidden"
        />
        <Image
          src={wide}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 hidden object-cover object-[62%_50%] md:block"
        />

        <div className="mx-auto max-w-[1180px] px-6 pt-28 sm:pt-32 lg:pt-28 xl:pt-32">
          {children}
        </div>
      </div>

      {/*
       * One phone instance for every layout — rendering two would duplicate the
       * whole thread for screen readers.
       *
       * Below lg it sits in normal flow and is pulled up so it straddles the
       * plate's lower edge at full 340px. `PhoneMockup` is a hard-coded 340x680
       * 1:2 object; shrinking it to fit inside the frame would put the message
       * bubbles near 10px on the one surface where the product is actually read.
       *
       * At lg it becomes absolute and stands on the tablecloth, at the plate's
       * own measured table line rather than a shared guess.
       */}
      <div
        style={{ "--table-line": tableLine } as React.CSSProperties}
        className="relative z-10 mx-auto w-fit
                   -mt-[26%] sm:-mt-[24%]
                   md:mr-[6%] md:ml-auto md:-mt-[10%]
                   lg:absolute lg:bottom-[var(--table-line)] lg:left-[66%] lg:mt-0
                   lg:-translate-x-1/2 lg:rotate-[-2deg]
                   [--ph:0.78] min-[380px]:[--ph:1]
                   lg:[--ph:0.74] xl:[--ph:0.84] 2xl:[--ph:0.94]"
      >
        {/* Outer box reserves the SCALED footprint so surrounding flow stays
            correct; the inner box scales from its top-left corner. `--ph` moves
            in discrete steps because there is no portable pure-CSS way to make a
            px-sized DOM subtree track a container's width.

            The tilt is on the wrapper rather than PhoneMockup's `rotated` prop:
            at -2 degrees the rotated bounding box grows to ~363px and overflows
            a 390px viewport, so only the lg branch tilts. */}
        <div
          style={{
            width: "calc(340px * var(--ph))",
            height: "calc(680px * var(--ph))",
          }}
        >
          <div
            className="origin-top-left"
            style={{ transform: "scale(var(--ph))" }}
          >
            <PhoneMockup rotated={false} />
          </div>
        </div>
      </div>

      {/* The thread is written copy, not a transcript. Say so.

          This sits below the photograph rather than on it: over the tablecloth
          even solid ink only reaches 4.84:1, and this is 10px tracked caps. On
          linen text-muted is 6.6:1. */}
      <p className="mx-auto mt-6 max-w-[1180px] px-6 text-center text-attribution font-medium uppercase text-muted lg:mt-4 lg:text-right">
        Illustrative conversation
      </p>
    </div>
  );
}
