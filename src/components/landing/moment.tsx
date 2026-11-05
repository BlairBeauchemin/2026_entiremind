import Image from "next/image";
import { DEMO_CONTENT } from "./hero-phone-content";
import { heroInter } from "./hero-font";

// The demo conversation layered over a photograph of someone receiving it, in
// the hero collage's spirit: the photograph keeps its portrait shape and the
// four messages overlap its edge (its lower half on mobile, its left side from
// lg, so they never cover the phone in her right hand). No phone frame; the
// hero and the intro already establish the format. Bubbles are solid so they
// read on any part of the photo, and carry the still-life contact shadow
// DESIGN.md allows objects resting in a scene. Their radius is set
// explicitly: the site's radius tokens are 2px, and a square message bubble
// stops reading as a text.
const bubbleBase =
  "max-w-[85%] px-4 py-2.5 text-[0.9375rem] leading-snug shadow-[0_18px_40px_-22px_rgba(20,18,15,0.6)]";

export function Moment() {
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
          className={`relative -mt-24 px-3 lg:mt-0 lg:-mr-28 lg:px-0 lg:w-[400px] space-y-3 ${heroInter.variable}`}
          style={{ fontFamily: "var(--font-inter), var(--font-karla)" }}
        >
          {DEMO_CONTENT.bubbles.map((bubble) => (
            <li
              key={bubble.text}
              className={
                bubble.from === "me"
                  ? `${bubbleBase} ml-auto rounded-[18px] rounded-br-[5px] bg-cobalt text-linen`
                  : `${bubbleBase} mr-auto rounded-[18px] rounded-bl-[5px] border border-rule bg-surface text-ink`
              }
            >
              <span className="sr-only">
                {bubble.from === "me" ? "Maya: " : "Entiremind: "}
              </span>
              {bubble.text}
            </li>
          ))}
        </ol>
      </div>
      <p className="mt-6 text-center text-sm text-muted font-sans">
        An example conversation
      </p>
    </section>
  );
}
