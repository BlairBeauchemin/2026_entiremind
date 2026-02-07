export function HowItWorks() {
  const steps = [
    {
      number: "01",
      title: "Action",
      description: "You receive a prompt or send an intention via SMS.",
    },
    {
      number: "02",
      title: "Signal",
      description:
        "Your reply (or silence) is captured as a behavioral signal.",
    },
    {
      number: "03",
      title: "Learning",
      description:
        "The system analyzes patterns in your responses over time.",
    },
    {
      number: "04",
      title: "Adjustment",
      description: "Future prompts evolve to better serve your goals.",
    },
  ];

  return (
    <section
      id="section-how-it-works"
      className="py-32 bg-teal-900 text-cream relative overflow-hidden rounded-[3rem] mx-4 md:mx-8"
    >
      {/* Background Accents */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-800/50 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-900/30 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
          <div className="max-w-2xl">
            <h2 className="font-serif text-5xl md:text-6xl mb-6 font-light italic">
              The Feedback Loop
            </h2>
            <p className="text-teal-100/80 text-xl font-light font-sans">
              A continuous cycle of action, signal, and adjustment designed to
              compound your growth.
            </p>
          </div>
          <a
            href="#section-hero"
            className="text-cream border border-white/20 px-6 py-2.5 rounded-full hover:bg-white hover:text-navy font-sans text-sm transition-all duration-300"
          >
            Start your loop
          </a>
        </div>

        <div className="grid md:grid-cols-4 gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className="relative p-8 rounded-3xl bg-white/5 border border-white/5 backdrop-blur-sm hover:bg-white/10 transition-colors group"
            >
              <div className="text-4xl font-serif text-white/20 mb-8 italic">
                {step.number}
              </div>
              <h3 className="text-2xl font-serif italic mb-3 text-cream">
                {step.title}
              </h3>
              <p className="text-sm text-teal-100/60 font-sans font-light leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
