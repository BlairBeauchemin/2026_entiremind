"use client";

import { motion } from "framer-motion";
import { ChevronLeft, Signal, Wifi, BatteryFull } from "lucide-react";

interface PhoneMockupProps {
  rotated?: boolean;
}

/**
 * A facsimile of the phone's own Messages app — which is the entire product
 * surface, so this is the one place on the site that renders someone else's
 * design system rather than ours.
 *
 * Two consequences worth stating, because both look like mistakes:
 *
 *  - The messages are set in the SANS, not the serif. A text message carries
 *    no typography at all; setting the mockup in Prata would advertise
 *    something the product cannot do.
 *  - The bubble radius and the 15px/10px type are iOS values, not ours. They
 *    are device chrome. `text-device` exists in globals.css for exactly this
 *    and is documented there as not-for-product-UI.
 *
 * The device carries the single contact shadow the system permits, on the
 * grounds that it is an object sitting on the page rather than a raised panel.
 */
export function PhoneMockup({ rotated = true }: PhoneMockupProps) {
  return (
    <div
      className={`relative w-[340px] h-[680px] bg-linen rounded-[3.25rem] border-[8px] border-ink overflow-hidden z-10 transition-transform duration-700 ease-out [box-shadow:0_18px_40px_-24px_rgba(20,18,15,0.45)] ${
        rotated ? "rotate-[-2deg] hover:rotate-0" : ""
      }`}
    >
      {/* Status bar */}
      <div className="absolute top-0 w-full h-10 bg-linen z-20 flex justify-between px-8 items-center text-attribution tracking-normal font-medium text-ink">
        <span>9:41</span>
        <div className="flex gap-1.5">
          <Signal className="w-3 h-3" aria-hidden="true" />
          <Wifi className="w-3 h-3" aria-hidden="true" />
          <BatteryFull className="w-3 h-3" aria-hidden="true" />
        </div>
      </div>

      <div className="w-full h-full bg-linen pt-14 px-5 flex flex-col gap-6 overflow-hidden relative">
        {/* Thread header */}
        <div className="absolute top-0 left-0 w-full h-24 bg-linen z-10 border-b border-rule flex items-end pb-4 px-6">
          <div className="flex items-center gap-4 w-full justify-center relative">
            <div className="absolute left-0 text-cobalt">
              <ChevronLeft className="w-5 h-5" aria-hidden="true" />
            </div>
            <div className="text-center">
              <div className="font-serif text-xl tracking-[1px] text-ink">
                Entiremind
              </div>
              <div className="text-attribution uppercase text-muted mt-1">
                Always listening
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="self-start max-w-[90%]"
          >
            <div className="bg-surface p-4 rounded-[18px] rounded-tl-[4px] border border-rule text-device text-ink">
              Good morning. What is one thing you wish to manifest into reality
              today?
            </div>
            <span className="text-attribution tracking-normal text-muted ml-2 mt-1.5 block">
              8:00 AM
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="self-end max-w-[90%]"
          >
            <div className="bg-cobalt p-4 rounded-[18px] rounded-tr-[4px] text-device text-linen">
              I want to feel more present with my work.
            </div>
            <span className="text-attribution tracking-normal text-muted text-right mr-2 mt-1.5 block">
              8:05 AM
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
            className="self-start max-w-[90%]"
          >
            <div className="bg-surface p-4 rounded-[18px] rounded-tl-[4px] border border-rule text-device text-ink">
              Understood. When you feel distraction rising, simply reply with
              &ldquo;Anchor&rdquo;. I will remind you of this intention.
            </div>
            <span className="text-attribution tracking-normal text-muted ml-2 mt-1.5 block">
              8:06 AM
            </span>
          </motion.div>

          {/* Typing indicator. The dots fade rather than bounce — a bounce
              reads as a toy, and this is meant to read as a phone. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="self-start mt-2"
          >
            <div
              className="bg-surface border border-rule px-4 py-3 rounded-full flex gap-1.5 w-fit"
              role="status"
              aria-label="Entiremind is typing"
            >
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-muted rounded-full animate-pulse-slow"
                  style={{ animationDelay: `${i * 0.25}s` }}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Composer */}
        <div className="absolute bottom-0 left-0 w-full p-6 bg-linen border-t border-rule">
          <div className="w-full h-12 bg-surface rounded-full flex items-center px-5 text-muted text-device border border-rule">
            Text Message…
          </div>
        </div>
      </div>
    </div>
  );
}
