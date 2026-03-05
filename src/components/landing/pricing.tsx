"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { WaitlistModal } from "./waitlist-modal";

export function Pricing() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <section id="section-pricing" className="py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-serif text-5xl md:text-7xl text-navy mb-8 font-medium">
            Be the First to Know
          </h2>
          <p className="text-xl text-teal-900/70 mb-16 max-w-2xl mx-auto font-sans font-light leading-relaxed">
            We&apos;re building Entiremind and want to hear from you. Sign up to
            get notified when we launch and help shape what we create.
          </p>

          <div className="bg-white/60 backdrop-blur-xl rounded-[3rem] shadow-2xl shadow-em-purple-300/20 border border-white p-10 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-em-purple-300 via-em-yellow-400 to-teal-900 opacity-50" />

            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-left space-y-6">
                <div className="inline-block px-4 py-1 rounded-full bg-teal-900/5 text-teal-900 text-xs font-medium tracking-widest uppercase">
                  Launching Soon
                </div>
                <p className="text-teal-900/80 font-sans font-light text-lg">
                  Sign up to get notified when Entiremind launches.
                </p>

                <ul className="space-y-3 pt-4">
                  {[
                    "Early access when we launch",
                    "Help shape the product",
                    "Direct founder updates",
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

              {/* CTA Column */}
              <div className="relative">
                <div className="bg-white/40 p-6 md:p-8 rounded-3xl border border-white/60 backdrop-blur-md text-center">
                  <p className="text-teal-900/70 font-sans font-light mb-6">
                    Join the waitlist and we&apos;ll let you know when Entiremind
                    is ready.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="w-full bg-navy text-cream py-4 rounded-full font-medium hover:bg-navy/90 hover:shadow-lg hover:shadow-navy/10 transition-all duration-300 font-sans"
                  >
                    Reserve My Spot
                  </button>
                  <p className="text-xs text-teal-900/60 text-center font-sans mt-4">
                    Your information is kept private. No spam, ever.
                  </p>
                </div>
              </div>
            </div>
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
