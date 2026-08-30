import Link from "next/link";
import type { Metadata } from "next";
import { PublicQuizFlow } from "@/components/quiz/public-quiz-flow";
import { siteConfig } from "@/config/site";

/**
 * Public, no-auth archetype quiz. Middleware redirect rules only cover
 * /dashboard, /onboarding, and /auth, so this route is reachable by anyone —
 * shares from /archetype/[slug] and ads land here.
 */
export const metadata: Metadata = {
  title: `What's your manifestation archetype? — ${siteConfig.name}`,
  description:
    "Eight taps, two minutes. Discover your manifestation archetype — and the inner-critic pattern that's been quietly steering you.",
};

export default async function QuizPage({
  searchParams,
}: {
  searchParams: Promise<{ src?: string }>;
}) {
  // Share attribution: /archetype/[slug] CTAs link /quiz?src=share-{slug}.
  // Validated again server-side in /api/quiz/lead — this is display plumbing.
  const { src } = await searchParams;
  return (
    <div className="min-h-screen bg-linen text-ink font-sans relative selection:bg-cobalt-wash selection:text-cobalt-deep">
      {/* Background grain */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grain mix-blend-multiply" />

      {/* Ambient gradients */}

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="p-6">
          <Link
            href="/"
            className="font-serif text-2xl tracking-[2px] text-ink"
          >
            {siteConfig.name}
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            <div className="bg-surface rounded-sm border border-rule p-8">
              <PublicQuizFlow src={src ?? null} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
