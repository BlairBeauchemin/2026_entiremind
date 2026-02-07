"use client";

import { motion } from "framer-motion";
import { LeadCaptureForm } from "./lead-capture-form";
import { PhoneMockup } from "./phone-mockup";

export function Hero() {
  return (
    <header
      id="section-hero"
      className="relative pt-40 pb-24 lg:pt-56 lg:pb-40 z-10 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage:
          'url("https://nivbeqiuhotuxbmcvuxt.supabase.co/storage/v1/object/public/project-images/10ae444c-eb2d-49cc-b7cb-99d5ff759dd0/897f91c1-821d-4fed-8574-49161ace98e5.png")',
      }}
    >
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
        {/* Hero Content */}
        <div className="relative z-10 space-y-10 text-center lg:text-left animate-fade-in-up">
          <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/50 border border-teal-900/10 text-teal-900 text-[11px] font-medium tracking-widest uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-teal-900 animate-pulse" />
            Now accepting early signals
          </div>

          <h1 className="font-serif text-6xl lg:text-8xl leading-[0.95] text-navy font-medium">
            Manifestation at the <br />
            <span className="font-medium">speed of thought.</span>
          </h1>

          <p className="text-lg lg:text-xl text-teal-900 max-w-lg mx-auto lg:mx-0 font-light leading-relaxed font-sans">
            A lightly magical SMS companion that aligns your intentions with
            reality. No apps to open, no dashboards to manage—just signals to
            send.
          </p>

          <LeadCaptureForm />

          <div className="pt-6 flex items-center justify-center lg:justify-start gap-4 text-sm text-teal-900/70 font-sans font-light">
            <div className="flex -space-x-3 opacity-80">
              {[1, 2, 3].map((i) => (
                <img
                  key={i}
                  src={`https://i.pravatar.cc/150?u=${i}`}
                  alt="User"
                  className="w-8 h-8 rounded-full border-2 border-cream grayscale"
                />
              ))}
            </div>
            <span>Join 2,000+ others aligning intentions.</span>
          </div>
        </div>

        {/* Hero Visual / Phone Mockup */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="relative lg:h-[700px] flex items-center justify-center"
        >
          {/* Decorative Elements */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-em-yellow-400/10 rounded-full blur-3xl animate-pulse-slow" />
          <div
            className="absolute bottom-32 left-10 w-40 h-40 bg-em-purple-300/10 rounded-full blur-3xl animate-pulse-slow"
            style={{ animationDelay: "1s" }}
          />

          {/* Floating Cards */}
          <div className="absolute top-[20%] left-[-40px] z-20 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-white shadow-sm animate-float max-w-[220px] hidden md:block">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-teal-900" />
              <span className="text-[10px] font-medium text-teal-900 uppercase tracking-widest">
                Signal Received
              </span>
            </div>
            <p className="text-lg text-teal-900 font-serif italic leading-tight">
              &ldquo;I want to launch my project.&rdquo;
            </p>
          </div>

          <div className="absolute bottom-[25%] right-[-40px] z-20 bg-white/80 backdrop-blur-md p-5 rounded-2xl border border-white shadow-sm animate-float-delayed max-w-[220px] hidden md:block">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-em-purple-300/60" />
              <span className="text-[10px] font-medium text-teal-900 uppercase tracking-widest">
                Reflection
              </span>
            </div>
            <p className="text-lg text-teal-900 font-serif italic leading-tight">
              &ldquo;What is the smallest step you can take right now?&rdquo;
            </p>
          </div>

          <PhoneMockup />
        </motion.div>
      </div>
    </header>
  );
}
