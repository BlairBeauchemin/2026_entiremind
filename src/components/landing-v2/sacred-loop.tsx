"use client";

import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Action",
    description: "You receive a prompt or send an intention via SMS.",
  },
  {
    number: "02",
    title: "Signal",
    description: "Your reply (or silence) is captured as a behavioral signal.",
  },
  {
    number: "03",
    title: "Learning",
    description: "The system analyzes patterns in your responses over time.",
  },
  {
    number: "04",
    title: "Adjustment",
    description: "Future prompts evolve to better serve your goals.",
  },
];

export function SacredLoop() {
  return (
    <section
      id="section-how-it-works"
      className="py-32 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-20">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-serif text-5xl md:text-6xl text-navy font-medium tracking-tight mb-6"
          >
            The Feedback Loop
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-teal-900 leading-relaxed font-light font-sans tracking-wide"
          >
            A continuous cycle of action, signal, and adjustment designed to
            compound your growth.
          </motion.p>
        </div>

        {/* Circular diagram with steps around it */}
        <div className="relative max-w-5xl mx-auto">
          {/* Central SVG diagram */}
          <div className="hidden lg:flex absolute inset-0 items-center justify-center pointer-events-none">
            <CircularDiagram />
          </div>

          {/* Steps grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {steps.map((step, i) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
                className="relative"
              >
                <div className="relative p-8 rounded-2xl bg-white/40 border border-teal-900/5 backdrop-blur-sm hover:bg-white/60 transition-all duration-500 group">
                  {/* Geometric accent */}
                  <div className="absolute top-3 right-3 w-6 h-6 opacity-20 group-hover:opacity-40 transition-opacity">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="text-em-purple-300">
                      <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" />
                    </svg>
                  </div>

                  <div className="text-5xl font-serif text-em-purple-300/40 mb-6 font-light">
                    {step.number}
                  </div>
                  <h3 className="text-2xl font-serif text-navy mb-3 font-medium tracking-tight">
                    {step.title}
                  </h3>
                  <p className="text-sm text-teal-900/70 font-sans font-light leading-relaxed tracking-wide">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-16"
        >
          <a
            href="#section-hero"
            className="inline-flex items-center gap-2 text-teal-900 border border-teal-900/20 px-6 py-2.5 rounded-full hover:bg-teal-900 hover:text-cream font-sans text-sm transition-all duration-300"
          >
            Start your loop
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </a>
        </motion.div>
      </div>
    </section>
  );
}

function CircularDiagram() {
  const size = 300;
  const center = size / 2;
  const radius = 100;

  // Four points on the circle for the steps
  const points = [
    { x: center, y: center - radius }, // Top - Action
    { x: center + radius, y: center }, // Right - Signal
    { x: center, y: center + radius }, // Bottom - Learning
    { x: center - radius, y: center }, // Left - Adjustment
  ];

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="opacity-30"
      initial={{ opacity: 0, rotate: -90 }}
      whileInView={{ opacity: 0.3, rotate: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 1.5, ease: "easeOut" }}
    >
      {/* Outer circle */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="#cbbbe3"
        strokeWidth="1"
      />

      {/* Inner circle */}
      <circle
        cx={center}
        cy={center}
        r={radius * 0.5}
        fill="none"
        stroke="#204147"
        strokeWidth="0.5"
        opacity="0.5"
      />

      {/* Connecting lines */}
      {points.map((point, i) => (
        <g key={i}>
          {/* Line to next point */}
          <line
            x1={point.x}
            y1={point.y}
            x2={points[(i + 1) % 4].x}
            y2={points[(i + 1) % 4].y}
            stroke="#cbbbe3"
            strokeWidth="0.5"
            opacity="0.5"
          />
          {/* Line to center */}
          <line
            x1={point.x}
            y1={point.y}
            x2={center}
            y2={center}
            stroke="#204147"
            strokeWidth="0.5"
            opacity="0.3"
          />
          {/* Node */}
          <circle cx={point.x} cy={point.y} r={4} fill="#cbbbe3" opacity="0.6" />
        </g>
      ))}

      {/* Center point */}
      <circle cx={center} cy={center} r={6} fill="#f9d97a" opacity="0.8" />
    </motion.svg>
  );
}
