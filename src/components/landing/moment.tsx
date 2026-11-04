import Image from "next/image";
import { DEMO_CONTENT } from "./hero-phone-content";
import { heroInter } from "./hero-font";

// The demo conversation layered over a photograph of the life it points to, in the hero
// collage's spirit: the photograph keeps its portrait shape and the four
// messages overlap its edge (its lower half on mobile, its right side from
// lg). No phone frame; the hero and the intro already establish the format.
// Bubbles are solid so they read on any part of the photo, and carry the
// still-life contact shadow DESIGN.md allows objects resting in a scene.
// Their radius is set explicitly: the site's radius tokens are 2px, and a
// square message bubble stops reading as a text.
const bubbleBase =
  "max-w-[85%] px-4 py-2.5 text-[0.9375rem] leading-snug shadow-[0_18px_40px_-22px_rgba(20,18,15,0.6)]";

export function Moment({
  src = "/marketing/hero/studio-woman.webp",
  alt = "A woman sketching at a sunlit table by the window, a mood board on the wall beside her",
  label,
  flip = false,
}: {
  src?: string;
  alt?: string;
  label?: string;
  /** Photo on the right from lg, for photos whose subject sits on the right. */
  flip?: boolean;
} = {}) {
  return (
    <section
      id="section-moment"
      aria-label="An example conversation"
      className="py-section relative z-10 border-t border-rule"
    >
      {label && (
        <p className="mb-6 text-center">
          <span className="inline-block bg-cobalt text-linen px-3 py-1.5 text-sm font-sans">
            {label}
          </span>
        </p>
      )}
      <div
        className={`max-w-5xl mx-auto px-6 lg:flex lg:items-center lg:justify-center ${flip ? "lg:flex-row-reverse" : ""}`}
      >
        <div className="relative w-full lg:w-[460px] aspect-[4/5] shrink-0 overflow-hidden rounded-sm">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(min-width: 1024px) 460px, 100vw"
            className="object-cover object-center"
          />
        </div>

        <ol
          className={`relative -mt-24 px-3 lg:mt-0 lg:px-0 lg:w-[400px] space-y-3 ${flip ? "lg:-mr-28" : "lg:-ml-28"} ${heroInter.variable}`}
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
