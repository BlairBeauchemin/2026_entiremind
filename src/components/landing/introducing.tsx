import { SmsPhone } from "./sms-phone";
import { INTRO_CONTENT } from "./hero-phone-content";
import { WaitlistButton } from "./waitlist-button";
import { heroInter } from "./hero-font";

const beats = [
  {
    number: "01",
    title: "Name what you're calling in.",
    description:
      "Tell us your intention in your own words. It stays yours — we never rewrite it.",
  },
  {
    number: "02",
    title: "Simple, guided texts.",
    description:
      "Short prompts shaped around your intention. Nothing to open, nothing to keep up with.",
  },
  {
    number: "03",
    title: "Answer, or don't.",
    description:
      "A word or a paragraph. It remembers what you share, and quiet days are just quiet days.",
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
        <SmsPhone content={INTRO_CONTENT} />
      </div>
    </div>
  );
}

// The guide, introduced as the answer to the problem section's last line
// ("Nothing was there to bring you back"). No rule above it: the two read as
// one turn, not two sections.
export function Introducing() {
  return (
    <section id="section-how-it-works" className="pb-section relative z-10">
      <div className="max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
        <div className="text-center lg:text-left lg:order-last">
          <h2 className="font-serif text-display text-cobalt text-balance mb-8">
            Introducing Entiremind
          </h2>
          <p className="font-serif italic text-xl lg:text-2xl text-ink leading-snug text-balance">
            We know what it&apos;s like to want change but feel stuck in the
            same cycles. That&apos;s exactly why we created Entiremind.
          </p>
          <p className="mt-8 text-lg lg:text-xl text-ink font-light leading-relaxed font-sans text-balance">
            A minimalist manifestation practice, delivered through simple,
            guided text messages. Each one helps you take your mind off
            autopilot, notice the old patterns, and reconnect with what you
            truly want.
          </p>
          <p className="mt-6 text-lg lg:text-xl text-ink font-light leading-relaxed font-sans text-balance">
            You don&apos;t need to read a book, master an app, or overhaul your
            routine. Just quiet moments, woven into your day.
          </p>
        </div>

        {/* The hero's phone on its own (no prints, board or sparkles), showing
            the first exchange rather than the hero's conversation. */}
        <div className={`mx-auto w-[260px] sm:w-[300px] ${heroInter.variable}`}>
          <PhoneOnly />
        </div>
      </div>

      <ol className="max-w-5xl mx-auto px-6 mt-16 lg:mt-20 grid md:grid-cols-3 gap-10 md:gap-12">
        {beats.map((beat) => (
          <li key={beat.number} className="border-t border-rule pt-6">
            <div className="font-serif italic text-cobalt text-2xl mb-4">
              {beat.number}
            </div>
            <h3 className="font-serif text-2xl text-ink text-balance mb-3">
              {beat.title}
            </h3>
            <p className="text-muted font-sans leading-relaxed">
              {beat.description}
            </p>
          </li>
        ))}
      </ol>

      <div className="mt-16 text-center px-6">
        <WaitlistButton location="intro" />
        <p className="text-xs text-muted mt-3 font-sans">
          Free to join. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}
