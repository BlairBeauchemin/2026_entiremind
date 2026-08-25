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
      className="bg-surface rounded-sm border border-rule p-8 md:p-10"
    >
      {/* Micro label */}
      <div className="flex items-center gap-2 mb-5">
        <span className="w-2 h-2 rounded-full bg-cobalt animate-pulse-slow" />
        <span className="text-[10px] font-medium uppercase tracking-widest text-muted">
          Your Archetype
        </span>
      </div>

      {/* Archetype */}
      <h2 className="font-serif text-2xl md:text-3xl text-ink">
        {content.archetype.name}
      </h2>
      <p className="mt-3 text-base md:text-lg text-ink leading-relaxed">
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
        <div className="mt-7 rounded-sm bg-cobalt-wash p-5">
          <div className="text-[10px] font-medium uppercase tracking-widest text-cobalt">
            What we listen for
          </div>
          <div className="mt-1.5 font-serif text-lg text-ink">
            {content.innerCritic.name}
          </div>
          <p className="mt-1 text-sm text-muted leading-relaxed">
            {content.innerCritic.oneLiner}
          </p>
        </div>
      )}

      {/* Values */}
      {profile.core_values.length > 0 && (
        <div className="mt-7">
          <div className="text-[10px] font-medium uppercase tracking-widest text-muted mb-2.5">
            What guides you
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.core_values.map((value) => (
              <span
                key={value}
                className="text-sm px-3 py-1.5 rounded-full bg-cobalt-wash text-ink border border-rule"
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
          className="text-xs text-muted hover:text-cobalt transition-colors"
        >
          Retake
        </Link>
      </div>
    </motion.div>
  );
}
