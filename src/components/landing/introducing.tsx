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
      "Reconnect with what you truly want and give your dreams clearer direction.",
  },
  {
    icon: Sun,
    title: "See more possibilities in your day.",
    description:
      "Reflect, practice gratitude, and find more to look forward to.",
  },
  {
    icon: Sprout,
    title: "Move toward what you want.",
    description: "Turn reflection into small, meaningful actions.",
  },
];

// The answer to the tension above it, on the same paper with no rule between:
// what Entiremind is, then a lead-in sentence that the three benefits complete
// (each starts with a verb), then a waitlist ask. The demo conversation follows in its own section
// (Moment); the phone that used to sit here is kept as DemoPhone.
export function Introducing() {
  return (
    <section id="section-how-it-works" className="pb-flow relative z-10">
      <div className="max-w-xl lg:max-w-2xl mx-auto px-6">
        <div>
          <h2 className="font-serif text-heading text-cobalt">
            Introducing Entiremind
          </h2>
          <p className="mt-6 text-xl text-ink font-sans leading-normal text-pretty">
            Not another app to download. Just personalized texts that help you:
          </p>
          <ul className="mt-6 space-y-8">
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
                  <p className="mt-2 text-base text-muted font-sans leading-relaxed">
                    {description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* The ask, right after the promise. Centred like the page's other
            mid-page asks. */}
        <div className="mt-12 text-center">
          <WaitlistButton location="benefits" />
          <p className="text-sm text-muted mt-3 font-sans">
            Free to join. Get an invitation when access opens.
          </p>
        </div>
      </div>
    </section>
  );
}
