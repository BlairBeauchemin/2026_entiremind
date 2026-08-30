"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { WaitlistModal } from "./waitlist-modal";

const includedFeatures = [
  "A daily text tuned to your archetype and intention",
  "Reply anytime — it listens, remembers, and responds",
  "Weekly rhythm that adapts to you, even your quiet days",
  "Pause or stop whenever you need to",
];

const faqs = [
  {
    question: "How does it work?",
    answer:
      "Everything happens over text — up to 2 messages a day. Each morning a short prompt meets you where you are. Reply in your own words whenever you like; there's no app to open and nothing to keep up with.",
  },
  {
    question: "Can I stop anytime?",
    answer:
      "Always. Reply STOP to any message and the texts end immediately, or pause them from your dashboard and pick the practice back up whenever you're ready.",
  },
  {
    question: "Is what I share private?",
    answer:
      "Yes. Your replies are yours. They shape your own experience and are never shared or published without your explicit permission.",
  },
  {
    question: "When does it launch?",
    answer:
      "Soon. The waitlist gets first access — and founding members will start with a 10-day free trial before anything is billed.",
  },
];

export function Pricing() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section id="section-pricing" className="py-32 relative overflow-hidden">
        <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
          <h2 className="font-serif text-section text-ink">
            Membership
          </h2>
          <p className="text-xl text-ink leading-relaxed font-light font-sans">
            One simple practice, one simple price. Every membership begins with
            a 10-day free trial — no card needed to join the waitlist.
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-6 mt-20 grid md:grid-cols-2 gap-10">
          {/* Monthly */}
          <div className="p-10 rounded-sm bg-surface border border-rule hover:border-cobalt transition-all duration-500 flex flex-col">
            <h3 className="font-serif text-3xl text-ink mb-2">Monthly</h3>
            <p className="text-muted font-sans font-light mb-6">
              Billed monthly, cancel anytime.
            </p>
            <div className="mb-8">
              <span className="font-serif text-5xl text-ink">$12.99</span>
              <span className="text-muted font-sans font-light"> / month</span>
            </div>
            <ul className="space-y-3 mb-10 flex-1">
              {includedFeatures.map((feature) => (
                <li key={feature} className="flex gap-3 items-start">
                  <Check className="w-4 h-4 text-ink flex-shrink-0 mt-1" />
                  <span className="text-muted font-sans font-light text-sm leading-relaxed">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full border border-cobalt text-ink px-10 py-4 rounded-sm text-lg font-medium hover:bg-cobalt hover:text-linen transition-all duration-300 font-sans"
            >
              Join the Waitlist
            </button>
          </div>

          {/* Yearly */}
          <div className="relative p-10 rounded-sm bg-surface border border-rule hover:border-cobalt transition-all duration-500 flex flex-col">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-cobalt-wash border border-rule text-ink text-[11px] font-medium tracking-widest uppercase">
              Two Months Free
            </div>
            <h3 className="font-serif text-3xl text-ink mb-2">Yearly</h3>
            <p className="text-muted font-sans font-light mb-6">
              A full year of the practice.
            </p>
            <div className="mb-8">
              <span className="font-serif text-5xl text-ink">$99</span>
              <span className="text-muted font-sans font-light"> / year</span>
            </div>
            <ul className="space-y-3 mb-10 flex-1">
              {includedFeatures.map((feature) => (
                <li key={feature} className="flex gap-3 items-start">
                  <Check className="w-4 h-4 text-ink flex-shrink-0 mt-1" />
                  <span className="text-muted font-sans font-light text-sm leading-relaxed">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-cobalt text-linen px-10 py-4 rounded-sm text-lg font-medium hover:bg-cobalt-deep transition-all duration-300 font-sans"
            >
              Join the Waitlist
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto px-6 mt-24">
          <h3 className="font-serif text-3xl text-ink text-center mb-12">
            Questions, answered
          </h3>
          <div className="space-y-8">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="p-8 rounded-sm bg-surface border border-rule"
              >
                <h4 className="font-serif text-2xl text-ink mb-3">
                  {faq.question}
                </h4>
                <p className="text-muted font-sans font-light leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <WaitlistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
