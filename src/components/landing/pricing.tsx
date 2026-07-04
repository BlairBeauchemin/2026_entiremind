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
          <h2 className="font-serif text-5xl md:text-6xl text-navy font-medium">
            Membership
          </h2>
          <p className="text-xl text-teal-900 leading-relaxed font-light font-sans">
            One simple practice, one simple price. Every membership begins with
            a 10-day free trial — no card needed to join the waitlist.
          </p>
        </div>

        <div className="max-w-4xl mx-auto px-6 mt-20 grid md:grid-cols-2 gap-10">
          {/* Monthly */}
          <div className="p-10 rounded-[2rem] bg-white/40 border border-white/60 backdrop-blur-sm hover:bg-white/60 transition-all duration-500 flex flex-col">
            <h3 className="font-serif text-3xl text-navy mb-2 font-medium">
              Monthly
            </h3>
            <p className="text-teal-900/70 font-sans font-light mb-6">
              Billed monthly, cancel anytime.
            </p>
            <div className="mb-8">
              <span className="font-serif text-5xl text-navy font-medium">
                $12.99
              </span>
              <span className="text-teal-900/60 font-sans font-light">
                {" "}
                / month
              </span>
            </div>
            <ul className="space-y-3 mb-10 flex-1">
              {includedFeatures.map((feature) => (
                <li key={feature} className="flex gap-3 items-start">
                  <Check className="w-4 h-4 text-teal-900 flex-shrink-0 mt-1" />
                  <span className="text-teal-900/70 font-sans font-light text-sm leading-relaxed">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full border border-navy/20 text-navy px-10 py-4 rounded-full text-lg font-medium hover:bg-navy hover:text-cream transition-all duration-300 font-sans"
            >
              Join the Waitlist
            </button>
          </div>

          {/* Yearly */}
          <div className="relative p-10 rounded-[2rem] bg-white/60 border border-em-purple-300/60 backdrop-blur-sm hover:bg-white/80 transition-all duration-500 flex flex-col">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-em-purple-300/40 border border-em-purple-300/60 text-teal-900 text-[11px] font-medium tracking-widest uppercase">
              Two Months Free
            </div>
            <h3 className="font-serif text-3xl text-navy mb-2 font-medium">
              Yearly
            </h3>
            <p className="text-teal-900/70 font-sans font-light mb-6">
              A full year of the practice.
            </p>
            <div className="mb-8">
              <span className="font-serif text-5xl text-navy font-medium">
                $99
              </span>
              <span className="text-teal-900/60 font-sans font-light">
                {" "}
                / year
              </span>
            </div>
            <ul className="space-y-3 mb-10 flex-1">
              {includedFeatures.map((feature) => (
                <li key={feature} className="flex gap-3 items-start">
                  <Check className="w-4 h-4 text-teal-900 flex-shrink-0 mt-1" />
                  <span className="text-teal-900/70 font-sans font-light text-sm leading-relaxed">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full bg-navy text-cream px-10 py-4 rounded-full text-lg font-medium hover:bg-navy/90 hover:shadow-lg hover:shadow-navy/10 transition-all duration-300 font-sans"
            >
              Join the Waitlist
            </button>
          </div>
        </div>

        {/* FAQ */}
        <div className="max-w-3xl mx-auto px-6 mt-24">
          <h3 className="font-serif text-3xl text-navy font-medium text-center mb-12">
            Questions, answered
          </h3>
          <div className="space-y-8">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="p-8 rounded-[2rem] bg-white/40 border border-white/60 backdrop-blur-sm"
              >
                <h4 className="font-serif text-2xl text-navy mb-3 font-medium">
                  {faq.question}
                </h4>
                <p className="text-teal-900/70 font-sans font-light leading-relaxed">
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
