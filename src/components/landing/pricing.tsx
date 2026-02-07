"use client";

import { Check } from "lucide-react";
import { LeadCaptureForm } from "./lead-capture-form";

export function Pricing() {
  return (
    <section id="section-pricing" className="py-32">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <h2 className="font-serif text-5xl md:text-7xl text-navy mb-8 font-medium">
          Join the Pretotype
        </h2>
        <p className="text-xl text-teal-900/70 mb-16 max-w-2xl mx-auto font-sans font-light leading-relaxed">
          We are currently in Phase 1. Access is limited to ensure high-quality
          interactions. Sign up now to reserve your spot in the queue.
        </p>

        <div className="bg-white/60 backdrop-blur-xl rounded-[3rem] shadow-2xl shadow-em-purple-300/20 border border-white p-10 md:p-16 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-em-purple-300 via-em-yellow-400 to-teal-900 opacity-50" />

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="text-left space-y-6">
              <div className="inline-block px-4 py-1 rounded-full bg-teal-900/5 text-teal-900 text-xs font-medium tracking-widest uppercase">
                Early Access
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-serif text-navy font-medium">
                  $0
                </span>
                <span className="text-teal-900/60 font-sans">/ month</span>
              </div>
              <p className="text-teal-900/80 font-sans font-light">
                Free during the pretotype phase. We only ask for your honest
                feedback.
              </p>

              <ul className="space-y-3 pt-4">
                {[
                  "Daily intention prompts",
                  "Personalized reflections",
                  "Direct founder access",
                ].map((feature) => (
                  <li
                    key={feature}
                    className="flex items-center gap-3 text-sm text-teal-900 font-sans"
                  >
                    <Check className="w-4 h-4 text-teal-900" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Form Column */}
            <div className="relative">
              <div className="bg-white/40 p-6 md:p-8 rounded-3xl border border-white/60 backdrop-blur-md">
                <LeadCaptureForm variant="pricing" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
