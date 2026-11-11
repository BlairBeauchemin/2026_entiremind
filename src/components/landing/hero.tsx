"use client";

import { motion } from "framer-motion";
import { HeroScene } from "./hero-scene";
import { heroInter } from "./hero-font";
import { EmailWaitlistForm } from "./email-waitlist-form";
import { useWaitlistAsk } from "./signup-variant";

// The prints, board and phone drift gently. Off under reduced motion.
const HERO_MOTION = ["float-strong"] as const;

/**
 * "copy-first" (default): headline, subhead and ask, then the phone scene.
 * "phone-first": below lg, the scene moves up between the headline and the
 * subhead (headline, scene, subhead, ask). The DOM order is unchanged (h1
 * first; the scene is decorative and aria-hidden): the copy wrapper becomes
 * `display: contents` below lg so its children can be ordered around the
 * scene. From lg up both layouts are the same two columns.
 */
export type HeroLayout = "copy-first" | "phone-first";

// Per-layout classes. copy-first keeps the exact classes the hero has always
// had, so /, /lp/form and /lp/modal render as before.
const LAYOUT = {
  "copy-first": {
    grid: "gap-12 lg:gap-8",
    copy: "relative z-10 text-center lg:text-left animate-fade-in-up",
    piece: "",
    h1: "",
    scene: "-mb-4 lg:-mb-6",
    sub: "mt-5 lg:mt-8",
    ask: "",
  },
  "phone-first": {
    grid: "gap-0 lg:gap-8",
    // No box below lg (its children join the grid); a block again from lg.
    copy: "contents lg:block lg:relative lg:z-10 text-center lg:text-left",
    // The wrapper's fade can't run on a box that isn't there, so each piece
    // fades in itself, with the same timing.
    piece: "relative z-10 animate-fade-in-up",
    h1: "order-1 lg:order-none",
    // In the middle now, so no trim under it below lg; lg is unchanged.
    scene: "order-2 lg:order-none mt-4 lg:mt-0 lg:-mb-6",
    sub: "order-3 lg:order-none mt-2 lg:mt-8",
    ask: "order-4 lg:order-none",
  },
} as const;

export function Hero({
  layout = "copy-first",
  anchorId = "join",
}: {
  layout?: HeroLayout;
  /** The ask's id; other pages link to `/#join`. */
  anchorId?: string;
}) {
  const { variant, ask, modal } = useWaitlistAsk("hero");
  const c = LAYOUT[layout];
  const cx = (...parts: string[]) => parts.filter(Boolean).join(" ");

  return (
    <>
      <header
        id="section-hero"
        className="relative pt-32 pb-flow lg:pt-56 z-10"
      >
        <div
          className={cx(
            "max-w-7xl mx-auto px-6 grid lg:grid-cols-[minmax(0,11fr)_minmax(0,13fr)]",
            c.grid,
            "items-center",
          )}
        >
          {/* Hero Content */}
          <div className={c.copy}>
            <h1
              className={cx(
                "font-serif text-display text-ink text-balance",
                c.piece,
                c.h1,
              )}
            >
              Manifest your best life.
            </h1>

            <p
              className={cx(
                c.sub,
                "text-xl text-ink max-w-lg mx-auto lg:mx-0 font-light leading-normal lg:leading-relaxed font-sans text-balance",
                c.piece,
              )}
            >
              Lightly magical texts that weave inspiration into your day and
              help turn your intentions into reality.
            </p>

            {/* The ask. "form": first name + email right here, centred under
                the copy on phones and left-aligned with it from lg. "modal":
                the button that opens the email-only pop-up. Either way the
                spot is #join, where other pages send the visitor. */}
            {variant === "form" ? (
              <div
                className={cx(
                  "mt-8 lg:mt-10 max-w-md mx-auto lg:mx-0 lg:max-w-lg text-center lg:text-left",
                  c.piece,
                  c.ask,
                )}
              >
                <EmailWaitlistForm
                  id={anchorId}
                  location="hero"
                  note="Free to join. Get an invitation when access opens."
                />
              </div>
            ) : (
              <div
                id={anchorId}
                className={cx("mt-8 lg:mt-10 scroll-mt-32", c.piece, c.ask)}
              >
                <button
                  type="button"
                  onClick={ask}
                  className="bg-cobalt text-linen px-10 py-4 rounded-sm text-lg font-medium hover:bg-cobalt-deep transition-all duration-300 font-sans"
                >
                  Join the waitlist
                </button>
                <p className="text-sm text-muted mt-3 font-sans">
                  Free to join. Get an invitation when access opens.
                </p>
              </div>
            )}
          </div>

          {/* Hero visual: the Messages phone with the "My vision" board and
              prints spilling out around it (HeroScene, layout "spill"). The
              scene canvas carries empty margins for ad crops; the negative
              margins trim them here so the phone fills the column. Mobile
              trims harder (about 20% larger) and centres the scene's content,
              which keeps it inside a 390px screen. Everything in it is
              transparent over the linen page. */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            // The negative bottom margin absorbs the transparent margin under
            // the phone, so the gap to the next section looks like the rest.
            // Below lg it sits under the copy and CTA at the same size as
            // before, capped at phone width so tablets and landscape phones
            // don't blow the scene up; from lg it returns to its column
            // beside the copy.
            className={cx(
              "relative w-full max-w-md mx-auto",
              c.scene,
              "lg:max-w-none",
              heroInter.variable,
            )}
          >
            <div className="-mt-[11%] -mb-[9%] -ml-[17%] -mr-[20%] lg:-mx-[7%] lg:-mt-[8%] lg:-mb-[6%]">
              <HeroScene layout="spill" motion={HERO_MOTION} />
            </div>
          </motion.div>
        </div>
      </header>
      {modal}
    </>
  );
}
