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
    <div className="min-h-screen bg-cream text-teal-900 font-sans relative selection:bg-em-purple-300/30 selection:text-teal-900">
      {/* Background grain */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-40 bg-grain mix-blend-multiply" />

      {/* Ambient gradients */}
      <div className="fixed top-[-20%] left-[-10%] w-[60vw] h-[60vw] bg-em-purple-300/10 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-em-yellow-400/8 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="p-6">
          <Link
            href="/"
            className="font-serif text-2xl font-medium tracking-[2px] text-navy"
          >
            {siteConfig.name}
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-6 pb-12">
          <div className="w-full max-w-sm">
            <div className="bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/60 p-8">
              <PublicQuizFlow src={src ?? null} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
