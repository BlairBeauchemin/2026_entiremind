import { Compass, Feather, Sprout, type LucideIcon } from "lucide-react";

const benefits: {
  icon: LucideIcon;
  title: string;
  description: string;
}[] = [
  {
    icon: Compass,
    title: "Step out of autopilot.",
    description:
      "Pause, notice what's on your mind, and bring your attention back to what you want.",
  },
  {
    icon: Feather,
    title: "Move beyond familiar doubts.",
    description:
      "Question the stories that hold you back and explore a different way forward.",
  },
  {
    icon: Sprout,
    title: "Bring your intentions to life.",
    description:
      "Get clear on what you want and take small, meaningful actions to manifest it.",
  },
];

// Three benefits as one section: compact rows on hairlines, each led by a
// thin cobalt line icon in a hairline circle, then a serif title and one
// sentence. Stacked on mobile; three across from lg.
export function Benefits() {
  return (
    <section
      id="section-benefits"
      className="py-section relative z-10 border-t border-rule"
    >
      <div className="max-w-xl lg:max-w-5xl mx-auto px-6">
        <h2 className="font-serif text-heading text-ink text-balance mb-6 lg:mb-8">
          Entiremind helps you to:
        </h2>
        <ul className="divide-y divide-rule border-y border-rule lg:grid lg:grid-cols-3 lg:gap-10 lg:divide-y-0 lg:border-y-0">
          {benefits.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex gap-4 py-5 lg:flex-col lg:gap-4 lg:py-0 lg:border-t lg:border-rule lg:pt-6"
            >
              <span
                aria-hidden="true"
                className="flex size-11 shrink-0 items-center justify-center rounded-full border border-rule text-cobalt"
              >
                <Icon className="size-5" strokeWidth={1.5} />
              </span>
              <div>
                <h3 className="font-serif text-xl text-ink leading-snug">
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
    </section>
  );
}
