const faqs = [
  {
    question: "How often will you text me?",
    answer:
      "One short, guided text a day, plus a reply when you answer. Reply STOP anytime and it ends.",
  },
  {
    question: "What will it cost?",
    answer:
      "$12.99 a month, or $99 a year — two months free. Every membership starts with a 10-day free trial, and there's no card to join the waitlist.",
  },
  {
    question: "Is what I share private?",
    answer:
      "Yes. Your replies only shape your own experience, and they're never shared or published without your permission.",
  },
  {
    question: "When does it launch?",
    answer: "Soon. The waitlist gets in first.",
  },
];

export function FAQ() {
  return (
    <section
      id="section-faq"
      className="py-section relative z-10 border-t border-rule"
    >
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="font-serif text-heading text-ink text-center mb-12">
          Questions, answered
        </h2>
        <dl className="divide-y divide-rule border-y border-rule">
          {faqs.map((faq) => (
            <div key={faq.question} className="py-7">
              <dt className="font-serif text-xl text-ink mb-2">
                {faq.question}
              </dt>
              <dd className="text-muted font-sans leading-relaxed">
                {faq.answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
