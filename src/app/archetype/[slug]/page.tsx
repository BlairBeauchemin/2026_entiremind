import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { ARCHETYPES, type Archetype } from "@/lib/persona/types";
import { ARCHETYPE_PUBLIC } from "@/lib/persona/content";

/**
 * Public, shareable archetype pages (Part C of
 * docs/plans/2026-07-04-monetization-growth.md).
 *
 * Statically generated, one per archetype, containing ONLY generic archetype
 * copy — never any user data. The CTA feeds the landing page with share
 * attribution (?src=share-{slug}) so signups from shares are measurable in
 * leads.source.
 */

export function generateStaticParams() {
  return ARCHETYPES.map((slug) => ({ slug }));
}

export const dynamicParams = false;

function isArchetype(slug: string): slug is Archetype {
  return (ARCHETYPES as readonly string[]).includes(slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isArchetype(slug)) return {};
  const content = ARCHETYPE_PUBLIC[slug];
  return {
    title: `${content.name} — Entiremind`,
    description: `${content.essence} Discover your own manifestation archetype in 2 minutes.`,
  };
}

export default async function ArchetypePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!isArchetype(slug)) notFound();
  const content = ARCHETYPE_PUBLIC[slug];

  return (
    <main className="min-h-screen bg-gradient-to-b from-em-purple-100 to-white flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg space-y-10 text-center">
        <p className="text-[10px] font-medium uppercase tracking-widest text-teal-900/40">
          A manifestation archetype
        </p>

        <div className="space-y-4">
          <h1 className="font-serif text-4xl md:text-5xl text-navy font-medium">
            {content.name}
          </h1>
          <p className="font-serif text-xl text-em-purple-400">
            {content.essence}
          </p>
        </div>

        <p className="text-teal-900/70 leading-relaxed text-left">
          {content.description}
        </p>

        <ul className="space-y-3 text-left">
          {content.traits.map((trait) => (
            <li
              key={trait}
              className="rounded-2xl bg-white/50 border border-white/70 px-5 py-3 text-sm text-teal-900/80"
            >
              {trait}
            </li>
          ))}
        </ul>

        <div className="space-y-3 pt-2">
          <Link
            href={`/quiz?src=share-${slug}`}
            className="inline-block rounded-xl bg-navy px-8 py-3.5 text-sm font-medium text-white transition-colors hover:bg-navy/90"
          >
            Discover your archetype
          </Link>
          <p className="text-xs text-teal-900/50">
            8 taps, 2 minutes. Then a daily practice by text.
          </p>
        </div>
      </div>
    </main>
  );
}
