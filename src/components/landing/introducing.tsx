import { SmsPhone } from "./sms-phone";
import { DEMO_CONTENT } from "./hero-phone-content";
import { heroInter } from "./hero-font";
import { Compass, Sprout, Sun, type LucideIcon } from "lucide-react";
import { WaitlistButton } from "./waitlist-button";

const benefits: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: Compass,
    title: "Manifest with clarity and intention.",
    description:
      "Reconnect with what you truly want, so your next steps reflect what matters to you.",
  },
  {
    icon: Sun,
    title: "Find more possibility in your everyday life.",
    description:
      "Make room for reflection and gratitude to notice what's working, what's shifting, and what you'd like to change.",
  },
  {
    icon: Sprout,
    title: "Bring your intentions to life.",
    description:
      "Take small, meaningful actions to manifest what you want, woven into the day you're already living.",
  },
];

// SmsPhone renders on a square 1024-unit canvas with the device at
// x 277–747, y 42–982. This box is the device's own size, and the canvas is
// offset inside it so only the phone takes up layout space.
function PhoneOnly() {
  return (
    <div className="relative aspect-[470/940]">
      <div
        className="absolute"
        style={{
          width: `${(1024 / 470) * 100}%`,
          left: `${(-277 / 470) * 100}%`,
          marginTop: `${(-42 / 470) * 100}%`,
        }}
      >
        <SmsPhone content={DEMO_CONTENT} />
      </div>
    </div>
  );
}

// The answer to the tension above it, on the same paper with no rule between:
// what Entiremind is, a lead-in sentence that the three benefits complete
// (each starts with a verb), then a phone showing one example exchange, and an
// ask centred under the whole section. The copy and benefits come first on
// mobile; from lg they sit beside the phone.
export function Introducing() {
  return (
    <section id="section-how-it-works" className="pb-section relative z-10">
      <div className="max-w-xl lg:max-w-5xl mx-auto px-6 grid lg:grid-cols-[minmax(0,1fr)_auto] gap-10 lg:gap-20 items-center">
        <div className="max-w-xl">
          <h2 className="font-serif text-heading text-cobalt">
            Introducing Entiremind
          </h2>
          <p className="mt-3 font-serif text-xl text-ink leading-snug text-balance">
            A little space for your intentions, woven into everyday life.
          </p>
          <p className="mt-4 text-lg text-ink font-sans leading-normal">
            Thoughtful texts, shaped around what you want to create, so you can:
          </p>
          <ul className="mt-6 space-y-5">
            {benefits.map(({ icon: Icon, title, description }) => (
              <li key={title} className="flex gap-4">
                <span
                  aria-hidden="true"
                  className="flex size-10 shrink-0 items-center justify-center rounded-full border border-rule text-cobalt"
                >
                  <Icon className="size-5" strokeWidth={1.5} />
                </span>
                <div>
                  <h3 className="font-serif text-lg text-ink leading-snug">
                    {title}
                  </h3>
                  <p className="mt-1 text-base text-muted font-sans leading-normal">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <figure>
          <div
            className={`mx-auto w-[300px] sm:w-[320px] ${heroInter.variable}`}
          >
            <PhoneOnly />
          </div>
          <figcaption className="mt-4 text-sm text-muted font-sans text-center">
            An example conversation
          </figcaption>
        </figure>
      </div>

      {/* The ask spans the whole section, centred under both columns on
          desktop; on mobile it simply follows the phone. */}
      <div className="mt-10 lg:mt-14 px-6 text-center">
        <WaitlistButton location="demo" />
        <p className="text-sm text-muted mt-3 font-sans">
          Free to join. Get an invitation when access opens.
        </p>
      </div>
    </section>
  );
}
