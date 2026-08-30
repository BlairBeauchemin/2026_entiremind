"use client";

import { motion } from "framer-motion";
import { SacredGeometryAccent } from "./sacred-geometry-visual";

export function SacredTestimonial() {
  return (
    <section
      id="section-testimonials"
      className="py-32 relative overflow-hidden"
    >
      {/* Background decorative geometry */}
      <div className="absolute top-20 left-10 opacity-10">
        <SacredGeometryAccent size={200} />
      </div>
      <div className="absolute bottom-20 right-10 opacity-10">
        <SacredGeometryAccent size={150} />
      </div>

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          {/* Geometric quote decoration */}
          <div className="flex justify-center mb-8">
            <svg
              width="60"
              height="60"
              viewBox="0 0 60 60"
              className="text-muted"
              aria-hidden="true"
            >
              <path
                d="M30 5L55 17.5V42.5L30 55L5 42.5V17.5L30 5Z"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
              <text
                x="30"
                y="38"
                textAnchor="middle"
                fill="currentColor"
                fontSize="24"
                fontFamily="serif"
              >
                &ldquo;
              </text>
            </svg>
          </div>

          {/* Quote */}
          <blockquote className="mb-10">
            <p className="font-serif text-3xl md:text-4xl lg:text-5xl text-ink leading-relaxed italic">
              It feels like having a wise friend in my pocket who actually
              listens. The silence between messages is just as meaningful as the
              words.
            </p>
          </blockquote>

          {/* Attribution */}
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-full bg-cobalt-wash border border-rule flex items-center justify-center">
              <span className="font-serif text-lg text-ink">S</span>
            </div>
            <div className="text-left">
              <div className="font-sans font-medium text-ink">Sarah M.</div>
              <div className="font-sans text-sm text-muted">Early Adopter</div>
            </div>
          </div>

          {/* Decorative stars */}
          <div className="flex justify-center gap-1 mt-8">
            {[...Array(5)].map((_, i) => (
              <svg
                key={i}
                className="w-4 h-4 text-cobalt"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
              </svg>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
