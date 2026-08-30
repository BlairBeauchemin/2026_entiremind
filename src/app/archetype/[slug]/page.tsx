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
    <main className="min-h-screen bg-linen flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-lg space-y-10 text-center">
        <p className="text-[10px] font-medium uppercase tracking-widest text-muted">
          A manifestation archetype
        </p>

        <div className="space-y-4">
          <h1 className="font-serif text-display text-ink">
            {content.name}
          </h1>
          <p className="font-serif text-xl text-cobalt">{content.essence}</p>
        </div>

        <p className="text-muted leading-relaxed text-left">
          {content.description}
        </p>

        <ul className="space-y-3 text-left">
          {content.traits.map((trait) => (
            <li
              key={trait}
              className="rounded-sm bg-surface border border-rule px-5 py-3 text-sm text-ink"
            >
              {trait}
            </li>
          ))}
        </ul>

        <div className="space-y-3 pt-2">
          <Link
            href={`/quiz?src=share-${slug}`}
            className="inline-block rounded-sm bg-cobalt px-8 py-3.5 text-sm font-medium text-linen transition-colors hover:bg-cobalt-deep"
          >
            Discover your archetype
          </Link>
          <p className="text-xs text-muted">
            8 taps, 2 minutes. Then a daily practice by text.
          </p>
        </div>
      </div>
    </main>
  );
}
