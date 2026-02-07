"use client";

import { motion } from "framer-motion";

// Simple geometric icons as SVG
function HexagonIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path d="M12 2L21 7V17L12 22L3 17V7L12 2Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CircleTriangleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 6L18 16H6L12 6Z" />
    </svg>
  );
}

function SeedOfLifeIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <circle cx="12" cy="12" r="4" />
      <circle cx="12" cy="7" r="4" />
      <circle cx="12" cy="17" r="4" />
      <circle cx="7.5" cy="9.5" r="4" />
      <circle cx="16.5" cy="9.5" r="4" />
      <circle cx="7.5" cy="14.5" r="4" />
      <circle cx="16.5" cy="14.5" r="4" />
    </svg>
  );
}

const values = [
  {
    icon: HexagonIcon,
    title: "Velocity of Learning",
    description:
      "The system operates as a real-time behavioral loop. Your actions teach the system, and the system guides your next action.",
  },
  {
    icon: CircleTriangleIcon,
    title: "Silence is a Signal",
    description:
      "We don't nag. If you don't reply, we record the silence as data. The system adapts to your rhythm, not the other way around.",
  },
  {
    icon: SeedOfLifeIcon,
    title: "Lightly Magical",
    description:
      "Calm, inspiring, and intuitive. No charts, no streaks, no productivity theater. Just pure intention and reflection.",
  },
];

export function SacredValues() {
  return (
    <section id="section-philosophy" className="py-32 relative overflow-hidden">
      {/* Subtle background geometry */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] opacity-[0.02]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='50' cy='50' r='40' fill='none' stroke='%23cbbbe3' stroke-width='0.5'/%3E%3Ccircle cx='50' cy='50' r='20' fill='none' stroke='%23cbbbe3' stroke-width='0.5'/%3E%3C/svg%3E")`,
            backgroundSize: "100px 100px",
          }}
        />
      </div>

      <div className="max-w-3xl mx-auto px-6 text-center space-y-8">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-serif text-5xl md:text-6xl text-navy font-medium tracking-tight"
        >
          The Philosophy of Less
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-xl text-teal-900 leading-relaxed font-light font-sans tracking-wide"
        >
          Most apps demand your attention. Entiremind respects it. We believe
          that the most powerful tools are the ones that get out of your way.
        </motion.p>
      </div>

      {/* Triangular card arrangement */}
      <div className="max-w-6xl mx-auto px-6 mt-24">
        {/* Top card - centered */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex justify-center mb-8"
        >
          <ValueCard value={values[0]} />
        </motion.div>

        {/* Bottom two cards */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <ValueCard value={values[1]} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <ValueCard value={values[2]} />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

interface ValueCardProps {
  value: {
    icon: React.ComponentType<{ className?: string }>;
    title: string;
    description: string;
  };
}

function ValueCard({ value }: ValueCardProps) {
  const Icon = value.icon;
  return (
    <div className="group relative p-10 rounded-[2rem] bg-white/30 border border-teal-900/5 hover:bg-white/50 transition-all duration-500 max-w-md">
      {/* Geometric corner accents */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l border-t border-em-purple-300/30" />
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r border-b border-em-purple-300/30" />

      <div className="w-14 h-14 rounded-full border border-teal-900/10 flex items-center justify-center mb-8 text-teal-900 group-hover:border-em-purple-300/40 transition-colors duration-500">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-serif text-3xl text-navy mb-4 font-medium tracking-tight">
        {value.title}
      </h3>
      <p className="text-teal-900/70 leading-relaxed font-sans font-light tracking-wide">
        {value.description}
      </p>
    </div>
  );
}
