"use client";

import { Check } from "lucide-react";
import { PhoneMockup } from "./phone-mockup";

export function Testimonials() {
  return (
    <section id="section-testimonials" className="py-32">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="relative flex justify-center items-center h-[600px]">
              <PhoneMockup rotated={false} />
            </div>
          </div>

          <div className="space-y-12 order-1 lg:order-2">
            <h2 className="font-serif text-5xl md:text-6xl text-navy font-medium leading-tight">
              What You&apos;ll Experience
            </h2>

            <div className="space-y-10">
              {[
                {
                  title: "Zero Friction",
                  description:
                    "No login screens, no loading spinners. Just SMS.",
                },
                {
                  title: "Emotional Buy-in",
                  description:
                    "The act of typing your intention creates a contract with yourself.",
                },
                {
                  title: "Founder Led",
                  description:
                    "Early signals are reviewed by humans to ensure the system evolves correctly.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-6 items-start group">
                  <div className="w-12 h-12 rounded-full border border-teal-900/10 flex items-center justify-center text-teal-900 flex-shrink-0 mt-1 group-hover:bg-teal-900 group-hover:text-cream transition-colors duration-300">
                    <Check className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-2xl text-navy mb-2 font-medium">
                      {item.title}
                    </h4>
                    <p className="text-teal-900/70 font-sans font-light leading-relaxed">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
