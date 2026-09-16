import Image from "next/image";
import { PhoneMockup } from "@/components/landing/phone-mockup";
import plateDesktop from "../../../public/images/v3/hero-plate-desktop.webp";
import plateMobile from "../../../public/images/v3/hero-plate-mobile.webp";

/**
 * The photographic hero: a generated environment plate with the live
 * `PhoneMockup` standing in it.
 *
 * The plate is deliberately generated WITHOUT a phone in it. Baking the message
 * thread into the photograph would make the conversation — the entire product —
 * unselectable, invisible to screen readers, and soft on high-DPI displays. So
 * the photograph supplies only light, material and place; every word on the
 * screen is real DOM.
 *
 * Two things here look like over-engineering and are not:
 *
 *  - **Desktop container aspect matches the asset aspect exactly (3:4).**
 *    `object-cover` crops whenever they disagree, and the crop amount changes
 *    with container width, so a fixed percentage anchor would drift against the
 *    depicted vase as you resize. Matching the ratio makes cover a no-op and the
 *    anchors exact at every width. For the same reason the desktop plate is
 *    constrained by max-width only — height-capping it reintroduces the crop.
 *
 *  - **Below `lg` the phone straddles the plate's lower edge instead of sitting
 *    inside it.** `PhoneMockup` is a hard-coded 340×680 px, a 1:2 object. There
 *    is no way to fit that inside a landscape plate on a 390px screen without
 *    scaling to ~0.5, which renders the message bubbles at 7-8px. On a
 *    mobile-first product that is a legibility regression, not a style choice,
 *    so on small screens the photograph becomes a band and the phone stands in
 *    front of it at full size.
 *
 * One `PhoneMockup` serves both layouts — `lg:absolute` flips the positioning
 * mode. Rendering two would duplicate the whole thread for screen readers.
 */
export function V3HeroScene() {
  return (
    <div className="relative">
      {/*
       * --- below lg: a band, with the phone standing in front of it.
       *
       * Cropping is free here because nothing registers to the photograph.
       *
       * On a phone the band goes full-bleed (`-mx-6`) and slim. Inside the
       * gutter it would be 342px wide against a 340px device — the mockup
       * covers it completely and the photograph reads as a brown rectangle.
       * Edge to edge it becomes a band the device stands in front of, which is
       * also the one full-bleed case DESIGN.md allows: a single image.
       */}
      <div className="relative -mx-6 aspect-[5/3] overflow-hidden sm:mx-0 sm:aspect-[4/3] sm:rounded-sm lg:hidden">
        <Image
          src={plateMobile}
          alt=""
          priority
          sizes="100vw"
          className="object-cover object-[64%_38%] sm:object-[62%_50%]"
          fill
        />
      </div>

      {/* --- lg and up: the true composite. Ratio must stay 3:4, see above. */}
      <div className="relative hidden aspect-[3/4] w-full overflow-hidden rounded-sm lg:block">
        <Image
          src={plateDesktop}
          alt=""
          priority
          sizes="(min-width: 1280px) 620px, 52vw"
          className="object-cover"
          fill
        />
      </div>

      {/*
       * The one live phone.
       *
       * `--ph` is the scale. Discrete steps, not a fluid calc: there is no
       * portable pure-CSS way to make a px-sized DOM subtree track a container
       * width, and at these stops the phone holds ~72-73% of the plate's height
       * across the whole desktop range, which is invisible drift.
       *
       * `bottom-[17%]` is not a guess — it is where the tablecloth's edge falls
       * in the desktop plate (measured at 17.4% from the bottom), so the device
       * stands on the table rather than floating in front of it.
       *
       * The tilt lives here rather than on PhoneMockup's `rotated` prop: at -2°
       * the rotated bounding box grows to ~363px, which overflows a 390px
       * viewport. Tilting only at lg keeps the mobile box exactly 340px.
       */}
      <div
        className="
          relative z-10 mx-auto w-fit
          -mt-[38%] sm:-mt-[38%] md:-mt-[30%]
          lg:absolute lg:bottom-[17%] lg:left-[56%] lg:mt-0
          lg:-translate-x-1/2 lg:rotate-[-2deg]
          [--ph:0.78] min-[380px]:[--ph:1]
          lg:[--ph:0.58] xl:[--ph:0.84]
        "
      >
        {/* Outer box reserves the SCALED footprint so the surrounding flow is
            correct; the inner box does the scaling from its top-left corner. */}
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

      {/* The thread is written copy, not a transcript. Say so. */}
      <p className="mt-6 text-center text-attribution font-medium uppercase text-muted">
        Illustrative conversation
      </p>
    </div>
  );
}
