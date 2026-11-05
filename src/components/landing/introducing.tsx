import { Compass, Sprout, Sun, type LucideIcon } from "lucide-react";

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

// The answer to the tension above it, on the same paper with no rule between:
// what Entiremind is, then a lead-in sentence that the three benefits complete
// (each starts with a verb). The demo conversation follows in its own section
// (Moment); the phone that used to sit here is kept as DemoPhone.
export function Introducing() {
  return (
    <section id="section-how-it-works" className="pb-section relative z-10">
      <div className="max-w-xl lg:max-w-2xl mx-auto px-6">
        <div>
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
      </div>
    </section>
  );
}
