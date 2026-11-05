"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { DEMO_CONTENT } from "./hero-phone-content";
import { heroInter } from "./hero-font";
import { WaitlistButton } from "./waitlist-button";

// The demo conversation layered over a photograph of someone receiving it, in
// the hero collage's spirit: the photograph keeps its portrait shape and the
// four messages overlap its edge (its lower half on mobile, its left side from
// lg, so they never cover the phone in her right hand). No phone frame; the
// hero and the intro already establish the format. Bubbles are solid so they
// read on any part of the photo, and carry the still-life contact shadow
// DESIGN.md allows objects resting in a scene. Their radius is set
// explicitly: the site's radius tokens are 2px, and a square message bubble
// stops reading as a text.
//
// A waitlist ask follows the caption.
//
// The conversation plays in once, when the section scrolls into view: a
// typing indicator before each Entiremind message, a short pause before each
// of Maya's replies. Every bubble keeps its place in the layout from the
// start (only its opacity and offset change), so nothing below it moves.
// Server render and reduced motion show the whole conversation at once.
const bubbleBase =
  "max-w-[85%] px-4 py-2.5 text-[0.9375rem] leading-snug shadow-[0_18px_40px_-22px_rgba(20,18,15,0.6)] transition-[opacity,transform] duration-500 ease-out";

// Pacing: the thread's beats, scaled together so the rhythm holds. The 500ms
// bubble fade is separate and overlaps the next beat.
const PACE = 0.765;
const START_DELAY_MS = 400 * PACE;
const TYPING_MS = 1300 * PACE;
const REPLY_PAUSE_MS = 900 * PACE;
const AFTER_BUBBLE_MS = 500 * PACE;

type Phase = { shown: number; typing: number | null };

export function Moment() {
  const listRef = useRef<HTMLOListElement>(null);
  const bubbles = DEMO_CONTENT.bubbles;
  // null until mounted: the server and no-JS render everything.
  const [phase, setPhase] = useState<Phase | null>(null);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const timers: number[] = [];
    const at = (ms: number, fn: () => void) =>
      timers.push(window.setTimeout(fn, ms));

    // Hide the thread once, before it plays. The section sits well below the
    // fold, so this lands long before anyone scrolls to it.
    at(0, () => setPhase({ shown: 0, typing: null }));

    const play = () => {
      let t = START_DELAY_MS;
      bubbles.forEach((bubble, i) => {
        if (bubble.from === "them") {
          at(t, () => setPhase({ shown: i, typing: i }));
          t += TYPING_MS;
        } else {
          t += REPLY_PAUSE_MS;
        }
        at(t, () => setPhase({ shown: i + 1, typing: null }));
        t += AFTER_BUBBLE_MS;
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          observer.disconnect();
          play();
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(list);

    return () => {
      observer.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
    };
  }, [bubbles]);

  return (
    <section
      id="section-moment"
      aria-label="An example conversation"
      className="py-section relative z-10 border-t border-rule"
    >
      <div className="max-w-5xl mx-auto px-6 lg:flex lg:flex-row-reverse lg:items-center lg:justify-center">
        <div className="relative w-full lg:w-[460px] aspect-[4/5] shrink-0 overflow-hidden rounded-sm">
          <Image
            // Unsplash, unsplash.com/photos/7ooBcYLI6Do (Unsplash License:
            // free for commercial use, attribution not required). Cropped to
            // 4:5.
            src="/marketing/hero/unsplash-phone-7ooBcYLI6Do.webp"
            alt="A woman in a cream sweater looking at her phone against a warm wall"
            fill
            sizes="(min-width: 1024px) 460px, 100vw"
            className="object-cover object-center"
          />
        </div>

        <ol
          ref={listRef}
          className={`relative -mt-24 px-3 lg:mt-0 lg:-mr-28 lg:px-0 lg:w-[400px] space-y-3 ${heroInter.variable}`}
          style={{ fontFamily: "var(--font-inter), var(--font-karla)" }}
        >
          {bubbles.map((bubble, i) => {
            const visible = phase === null || i < phase.shown;
            const typing = phase?.typing === i;
            return (
              <li key={bubble.text} className="relative flex flex-col">
                {typing && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-0 flex h-10 items-center gap-1.5 rounded-[18px] rounded-bl-[5px] border border-rule bg-surface px-4 shadow-[0_18px_40px_-22px_rgba(20,18,15,0.6)]"
                  >
                    {[0, 1, 2].map((d) => (
                      <span
                        key={d}
                        className="size-1.5 rounded-full bg-muted animate-typing-dot"
                        style={{ animationDelay: `${d * 160}ms` }}
                      />
                    ))}
                  </span>
                )}
                <span
                  className={`${bubbleBase} ${
                    bubble.from === "me"
                      ? "self-end rounded-[18px] rounded-br-[5px] bg-cobalt text-linen"
                      : "self-start rounded-[18px] rounded-bl-[5px] border border-rule bg-surface text-ink"
                  } ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}
                >
                  <span className="sr-only">
                    {bubble.from === "me" ? "Maya: " : "Entiremind: "}
                  </span>
                  {bubble.text}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
      <p className="mt-6 text-center text-sm text-muted font-sans">
        An example conversation
      </p>

      {/* The ask, while the demo is fresh. Its analytics location stays
          'demo': it moved here with the demo when the intro's phone went. */}
      <div className="mt-10 px-6 text-center">
        <WaitlistButton location="demo" />
        <p className="text-sm text-muted mt-3 font-sans">
          Free to join. Get an invitation when access opens.
        </p>
      </div>
    </section>
  );
}
