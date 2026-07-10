"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { buildRevealContent } from "@/lib/persona/content";
import { VALUE_OPTIONS } from "@/lib/persona/questions";
import { ShareArchetypeButton } from "@/components/share-archetype-button";
import type { PersonaProfile, ValueId } from "@/lib/persona/types";

interface PersonaCardProps {
  profile: PersonaProfile;
  name: string;
}

function valueLabel(value: ValueId): string {
  return VALUE_OPTIONS.find((v) => v.id === value)?.label ?? value;
}

export function PersonaCard({ profile, name }: PersonaCardProps) {
  const content = buildRevealContent(profile, { name });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 p-8 md:p-10"
    >
      {/* Micro label */}
      <div className="flex items-center gap-2 mb-5">
        <span className="w-2 h-2 rounded-full bg-em-yellow-400 animate-pulse-slow" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-teal-900/50">
          Your Archetype
        </span>
      </div>

      {/* Archetype */}
      <h2 className="font-serif text-2xl md:text-3xl text-navy font-medium">
        {content.archetype.name}
      </h2>
      <p className="mt-3 text-base md:text-lg text-navy/80 leading-relaxed">
        {content.archetype.paragraph}
      </p>
      <div className="mt-4">
        <ShareArchetypeButton
          archetype={profile.archetype}
          archetypeName={content.archetype.name}
        />
      </div>

      {/* Inner-critic pattern */}
      {content.innerCritic && (
        <div className="mt-7 rounded-2xl bg-em-purple-300/10 p-5">
          <div className="text-[10px] font-medium uppercase tracking-widest text-em-purple-400">
            What we listen for
          </div>
          <div className="mt-1.5 font-serif text-lg text-navy">
            {content.innerCritic.name}
          </div>
          <p className="mt-1 text-sm text-navy/70 leading-relaxed">
            {content.innerCritic.oneLiner}
          </p>
        </div>
      )}

      {/* Values */}
      {profile.core_values.length > 0 && (
        <div className="mt-7">
          <div className="text-[10px] font-medium uppercase tracking-widest text-teal-900/50 mb-2.5">
            What guides you
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.core_values.map((value) => (
              <span
                key={value}
                className="text-sm px-3 py-1.5 rounded-full bg-em-yellow-400/20 text-navy border border-em-yellow-400/40"
              >
                {valueLabel(value)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-end mt-7">
        <Link
          href="/onboarding/archetype"
          className="text-[12px] text-teal-900/40 hover:text-teal-900 transition-colors"
        >
          Retake
        </Link>
      </div>
    </motion.div>
  );
}
